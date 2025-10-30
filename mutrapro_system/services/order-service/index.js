const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

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

// Hàm helper để gửi thông báo, tránh lặp code
const notify = async (userId, eventName, data) => {
    try {
        await axios.post('http://notification-service:3006/notify', { userId, eventName, data });
    } catch (err) {
        console.error(`Lỗi khi gửi thông báo '${eventName}':`, err.message);
    }
};

// API ĐỂ LẤY CÁC ĐƠN HÀNG "ĐANG CHỜ"
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

// API Endpoint: Lấy tất cả đơn hàng của một khách hàng
app.get('/orders/customer/:customerId', async (req, res) => {
    const { customerId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
            [customerId]
        );

        // --- PHẦN LÀM GIÀU DỮ LIỆU ---
        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                // Nếu là dịch vụ thu âm và đã qua giai đoạn pending, đi hỏi studio-service
                if (order.service_type === 'recording' && order.status !== 'pending') {
                    try {
                        const bookingResponse = await axios.get(`http://studio-service:3005/bookings/order/${order.id}`);
                        // Gắn thêm thông tin phòng thu vào đơn hàng
                        return { ...order, studioInfo: bookingResponse.data };
                    } catch (error) {
                        // Nếu không tìm thấy booking (lỗi 404), không sao cả, chỉ trả về order gốc
                        if (error.response && error.response.status === 404) {
                            return order;
                        }
                        // Nếu là lỗi khác, log ra console
                        console.error(`[Order Service] Lỗi khi lấy booking cho order ${order.id}:`, error.message);
                        return order;
                    }
                }
                return order; // Trả về đơn hàng gốc nếu không phải dịch vụ thu âm
            })
        );
        // -----------------------------

        res.json(enrichedOrders); // Trả về danh sách đơn hàng đã được làm giàu
    } catch (error) {
        console.error('Get orders by customer error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API ĐỂ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ĐÃ NÂNG CẤP)
app.put('/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Lấy thông tin customer_id trước khi update
        const [orderRows] = await connection.execute('SELECT customer_id FROM orders WHERE id = ?', [id]);
        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const customerId = orderRows[0].customer_id;

        // Thực hiện update
        await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

        // Gửi thông báo real-time cho khách hàng
        notify(customerId, 'order_status_updated', {
            orderId: id,
            newStatus: status,
            message: `Trạng thái đơn hàng #${id} của bạn đã được cập nhật thành: ${status}.`
        });

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API ĐỂ THANH TOÁN
app.post('/orders/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { customer_id, amount, method } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [updateResult] = await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
            ['paid', id, 'completed']
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Đơn hàng không hợp lệ để thanh toán.' });
        }

        await connection.execute(
            `INSERT INTO payment (order_id, customer_id, amount, method, status, created_at)
       VALUES (?, ?, ?, ?, 'paid', NOW())`,
            [id, customer_id, amount, method || 'credit_card']
        );

        await connection.commit();
        res.json({ message: 'Thanh toán thành công!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Lỗi xử lý thanh toán' });
    } finally {
        if (connection) connection.release();
    }
});

// API: Kiểm tra xem đơn hàng đã có feedback chưa
app.get('/orders/:id/feedback', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id FROM feedback WHERE order_id = ?',
            [id]
        );
        res.json({ hasFeedback: rows.length > 0 });
    } catch (error) {
        console.error('Check feedback error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});


// API: Khách hàng gửi feedback mới
app.post('/orders/:id/feedback', async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [existing] = await connection.execute('SELECT id FROM feedback WHERE order_id = ?', [id]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Feedback for this order already exists.' });
        }

        await connection.execute(
            'INSERT INTO feedback (order_id, rating, comment, created_at) VALUES (?, ?, ?, NOW())',
            [id, rating, comment]
        );
        res.status(201).json({ message: 'Feedback submitted successfully!' });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API ĐỂ LẤY CHI TIẾT MỘT ĐƠN HÀNG (LUÔN ĐẶT GẦN CUỐI)
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

// ======================= THÊM LẠI API CHO DASHBOARD BÁO CÁO =======================
app.get('/stats', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Query 1: Tính tổng doanh thu từ bảng payment
        const [revenueRows] = await connection.execute(
            "SELECT SUM(amount) as totalRevenue FROM payment WHERE status = 'paid'"
        );
        const totalRevenue = revenueRows[0].totalRevenue || 0;

        // Query 2: Đếm số lượng đơn hàng theo từng trạng thái
        const [statusRows] = await connection.execute(
            "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
        );
        
        // Query 3: Đếm tổng số đơn hàng
        const [totalOrdersRows] = await connection.execute(
            "SELECT COUNT(*) as totalOrders FROM orders"
        );
        const totalOrders = totalOrdersRows[0].totalOrders || 0;

        res.json({
            totalRevenue: totalRevenue,
            orderStats: statusRows,
            totalOrders: totalOrders
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Database error while fetching stats' });
    } finally {
        if (connection) connection.release();
    }
});
// ===========================================================================

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
});