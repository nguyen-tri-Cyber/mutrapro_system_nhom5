// services/studio-service/index.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
// axios đã có sẵn, tuyệt vời!
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_STUDIO_NAME || 'mutrapro_studio',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Hàm helper để gửi thông báo (đã có sẵn)
const notify = async (userId, eventName, data) => {
    try {
        await axios.post('http://notification-service:3006/notify', { userId, eventName, data });
    } catch (err) {
        console.error(`Lỗi khi gửi thông báo '${eventName}':`, err.message);
    }
};

// === API CHO KHÁCH HÀNG & CHUYÊN GIA ===

// API Endpoint: Lấy danh sách phòng thu (Không đổi)
app.get('/studios', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM studios ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Get studios error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API Endpoint: Đặt lịch phòng thu (ĐÃ NÂNG CẤP)
app.post('/bookings', async (req, res) => {
    // Giả sử frontend sẽ gửi thêm studioAdminId để biết ai là người nhận thông báo
    const { studio_id, artist_id, order_id, start_time, end_time, studioAdminId } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO booking (studio_id, artist_id, order_id, start_time, end_time, status)
             VALUES (?, ?, ?, ?, ?, 'scheduled')`,
            [studio_id, artist_id, order_id, start_time, end_time]
        );
        
        // --- PHẦN NÂNG CẤP REAL-TIME ---
        // Gửi thông báo cho admin phòng thu (nếu có ID được gửi lên)
        if (studioAdminId) {
            notify(studioAdminId, 'new_booking', {
                studioId: studio_id,
                orderId: order_id,
                message: `Có một lịch đặt mới tại phòng thu của bạn cho đơn hàng #${order_id}.`
            });
        }
        // -----------------------------

        res.status(201).json({ id: result.insertId, message: 'Booking created' });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// === CÁC API DÀNH RIÊNG CHO ADMIN PHÒNG THU ===

// 1. API: Lấy toàn bộ lịch đặt (Không đổi)
app.get('/bookings/all', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`
            SELECT b.id, b.order_id, b.start_time, b.end_time, s.name as studio_name
            FROM booking b
            JOIN studios s ON b.studio_id = s.id
            WHERE b.status = 'scheduled'
            ORDER BY b.start_time ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// 2. API: Cập nhật trạng thái phòng thu (ĐÃ NÂNG CẤP)
app.put('/studios/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['available', 'booked', 'maintenance'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE studios SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phòng thu.' });
        }

        // --- PHẦN NÂNG CẤP REAL-TIME ---
        // Gửi broadcast cho tất cả mọi người biết trạng thái đã thay đổi
        notify('broadcast', 'studio_status_updated', {
            studioId: id,
            newStatus: status
        });
        // -----------------------------

        res.json({ message: 'Cập nhật trạng thái phòng thu thành công.' });
    } catch (error) {
        console.error('Update studio status error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// 3. API: Tạo một phòng thu mới (Không đổi)
app.post('/studios', async (req, res) => {
    /* ... Giữ nguyên code cũ ... */
    const { name, location } = req.body;
    if (!name || !location) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đủ tên và địa điểm.' });
    }
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO studios (name, location, status) VALUES (?, ?, 'available')`,
            [name, location]
        );
        res.status(201).json({ id: result.insertId, message: 'Tạo phòng thu mới thành công.' });
    } catch (error) {
        console.error('Create studio error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// 4. API: Xóa một phòng thu (Không đổi)
app.delete('/studios/:id', async (req, res) => {
    /* ... Giữ nguyên code cũ ... */
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM studios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phòng thu.' });
        }
        res.json({ message: 'Xóa phòng thu thành công.' });
    } catch (error) {
        console.error('Delete studio error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Không thể xóa phòng thu vì vẫn còn lịch đặt liên quan.' });
        }
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// === API MỚI ĐỂ "LÀM GIÀU DỮ LIỆU" CHO ORDER-SERVICE ===
app.get('/bookings/order/:orderId', async (req, res) => {
    const { orderId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        // Lấy thêm cả thời gian để hiển thị cho chi tiết
        const [rows] = await connection.execute(`
            SELECT s.name as studioName, s.location, b.start_time, b.end_time 
            FROM booking b
            JOIN studios s ON b.studio_id = s.id
            WHERE b.order_id = ? 
            LIMIT 1
        `, [orderId]);

        if (rows.length > 0) {
            res.json(rows[0]); // Trả về { studioName, location, start_time, end_time }
        } else {
            res.status(404).json({ message: 'Không tìm thấy lịch đặt cho đơn hàng này.' });
        }
    } catch (error) {
        console.error("Lỗi khi lấy booking theo order ID:", error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});
// =======================================================


const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Studio Service is running on port ${PORT}`);
});