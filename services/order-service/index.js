const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_ORDER_NAME || 'mutrapro_order',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// API Endpoint: Tạo đơn hàng mới
app.post('/orders', async (req, res) => {
    // ... code này đã đúng, không cần sửa ...
    // Giữ nguyên logic mượn và trả kết nối
    const { customer_id, service_type, description, price } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO orders (customer_id, service_type, description, price, status, created_at, update_at)
             VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [customer_id, service_type, description, price]
        );
        res.status(201).json({ id: result.insertId, message: 'Order created' });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// --- SỬA LỖI LOGIC: ĐƯA CÁC ROUTE CỤ THỂ LÊN TRƯỚC ROUTE ĐỘNG ---

// API ĐỂ LẤY CÁC ĐƠN HÀNG "ĐANG CHỜ" (ĐÚNG VỊ TRÍ)
app.get('/orders/unassigned', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC"
        );
        res.json(rows);
    } catch (error) {
        console.error('Get unassigned orders error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API Endpoint: Lấy tất cả đơn hàng của một khách hàng (ĐÚNG VỊ TRÍ)
app.get('/orders/customer/:customerId', async (req, res) => {
    const { customerId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', 
            [customerId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get orders by customer error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API ĐỂ LẤY CHI TIẾT MỘT ĐƠN HÀNG (BÂY GIỜ ĐẶT Ở CUỐI)
app.get('/orders/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API ĐỂ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
app.put('/orders/:id/status', async (req, res) => {
    // ... code này đã đúng, không cần sửa ...
    // Giữ nguyên logic mượn và trả kết nối
    const { id } = req.params;
    const { status } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// ======================= API MỚI ĐỂ THANH TOÁN =======================
app.post('/orders/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { customer_id, amount, method } = req.body; // Lấy thông tin cần thiết từ body
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Bắt đầu transaction để đảm bảo an toàn

        // Bước 1: Cập nhật trạng thái đơn hàng thành 'paid'
        await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
            ['paid', id, 'completed'] // Chỉ cho thanh toán đơn hàng đã 'completed'
        );

        // Bước 2: Tạo một dòng mới trong bảng payment
        await connection.execute(
            `INSERT INTO payment (order_id, customer_id, amount, method, status, created_at)
             VALUES (?, ?, ?, ?, 'paid', NOW())`,
            [id, customer_id, amount, method || 'credit_card'] // Giả định phương thức thanh toán
        );

        await connection.commit(); // Hoàn tất transaction
        res.json({ message: 'Thanh toán thành công!' });

    } catch (error) {
        if (connection) await connection.rollback(); // Nếu có lỗi, hoàn tác tất cả thay đổi
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Lỗi xử lý thanh toán' });
    } finally {
        if (connection) connection.release();
    }
});
// =====================================================================

// ======================= API BỔ SUNG ĐỂ SỬA LỖI 404 =======================
// MỤC ĐÍCH: Xử lý yêu cầu thanh toán cho một đơn hàng.
app.post('/orders/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { customer_id, amount, method } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Dùng transaction để đảm bảo an toàn

        // Bước 1: Cập nhật trạng thái đơn hàng thành 'paid'
        // Chỉ cho phép thanh toán khi đơn hàng đang ở trạng thái 'completed'
        const [updateResult] = await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
            ['paid', id, 'completed']
        );

        // Nếu không có dòng nào được cập nhật, nghĩa là đơn hàng không ở trạng thái 'completed'
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Đơn hàng không hợp lệ để thanh toán.' });
        }

        // Bước 2: Tạo một dòng mới trong bảng 'payment'
        await connection.execute(
            `INSERT INTO payment (order_id, customer_id, amount, method, status, created_at)
             VALUES (?, ?, ?, ?, 'paid', NOW())`,
            [id, customer_id, amount, method || 'credit_card']
        );

        await connection.commit(); // Hoàn tất và lưu các thay đổi
        res.json({ message: 'Thanh toán thành công!' });

    } catch (error) {
        if (connection) await connection.rollback(); // Hoàn tác nếu có lỗi
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Lỗi xử lý thanh toán' });
    } finally {
        if (connection) connection.release();
    }
});
// =====================================================================

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
});