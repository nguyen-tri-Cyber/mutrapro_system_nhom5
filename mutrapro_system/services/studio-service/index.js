// services/studio-service/index.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config({ path: '../../.env' });

// Import modules
const { logger } = require('./shared/logger');
const { asyncHandler, notFound, errorHandler, AppError } = require('./shared/middleware/errorHandler');
const { idParamValidation } = require('./shared/middleware/validation');

// TODO: Tạm thời giả lập auth, sẽ được thay thế bằng logic gọi qua API Gateway
const authMiddleware = (req, res, next) => next();
const checkRole = (...roles) => (req, res, next) => next();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_STUDIO_NAME,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const notify = async (userId, eventName, data) => {
    try {
        await axios.post('http://notification-service:3006/notify', { userId, eventName, data });
    } catch (err) {
        logger.error(`Lỗi khi gửi thông báo '${eventName}'`, { error: err.message });
    }
};

// --- API Endpoints ---

// API: Lấy danh sách tất cả phòng thu (công khai)
app.get('/studios', asyncHandler(async (req, res) => {
    const [rows] = await pool.execute('SELECT * FROM studios ORDER BY name ASC');
    res.json(rows);
}));

// API: Đặt lịch phòng thu (yêu cầu vai trò 'artist')
app.post('/bookings', authMiddleware, checkRole('artist'), asyncHandler(async (req, res) => {
    const { studio_id, artist_id, order_id, start_time, end_time, studioAdminId } = req.body;
    
    const [result] = await pool.execute(
        `INSERT INTO booking (studio_id, artist_id, order_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, 'scheduled')`,
        [studio_id, artist_id, order_id, start_time, end_time]
    );

    if (studioAdminId) {
        notify(studioAdminId, 'new_booking', {
            studioId: studio_id,
            orderId: order_id,
            message: `Có một lịch đặt mới tại phòng thu của bạn cho đơn hàng #${order_id}.`
        });
    }

    logger.info(`New booking created for studio #${studio_id} by artist #${artist_id}`);
    res.status(201).json({ id: result.insertId, message: 'Booking created' });
}));

// API: Lấy thông tin booking theo order ID (dùng cho service khác)
app.get('/bookings/order/:orderId', asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const [rows] = await pool.execute(`
        SELECT s.name as studioName, s.location, b.start_time, b.end_time
        FROM booking b JOIN studios s ON b.studio_id = s.id
        WHERE b.order_id = ? LIMIT 1`,
        [orderId]
    );
    if (rows.length === 0) {
        throw new AppError('Không tìm thấy lịch đặt cho đơn hàng này.', 404);
    }
    res.json(rows[0]);
}));

// --- API DÀNH RIÊNG CHO ADMIN PHÒNG THU ---

// API: Lấy toàn bộ lịch đặt (yêu cầu 'studio_admin')
app.get('/bookings/all', authMiddleware, checkRole('studio_admin'), asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT b.id, b.order_id, b.start_time, b.end_time, s.name as studio_name
        FROM booking b JOIN studios s ON b.studio_id = s.id
        WHERE b.status = 'scheduled' ORDER BY b.start_time ASC`);
    res.json(rows);
}));

// API: Cập nhật trạng thái phòng thu (yêu cầu 'studio_admin')
app.put('/studios/:id/status', authMiddleware, checkRole('studio_admin'), idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['available', 'booked', 'maintenance'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Trạng thái không hợp lệ.', 400);
    }

    const [result] = await pool.execute('UPDATE studios SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
        throw new AppError('Không tìm thấy phòng thu.', 404);
    }

    notify('broadcast', 'studio_status_updated', {
        studioId: id,
        newStatus: status
    });
    
    logger.info(`Studio #${id} status updated to ${status}`);
    res.json({ message: 'Cập nhật trạng thái phòng thu thành công.' });
}));


// --- Middleware xử lý cuối cùng ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    logger.info(`Studio Service is running on port ${PORT}`);
});