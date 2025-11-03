// services/order-service/index.js (ĐÃ CẬP NHẬT)
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config({ path: '../../.env' });
// Import các module dùng chung
const { logger } = require('./shared/logger');
const { asyncHandler, notFound, errorHandler, AppError } = require('./shared/middleware/errorHandler');
const { createOrderValidation, idParamValidation, feedbackValidation } = require('./shared/middleware/validation');
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
    database: process.env.DB_ORDER_NAME,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
const pool = mysql.createPool(dbConfig);
// Hàm helper để gửi thông báo
const notify = async (userId, eventName, data) => {
    try {
        await axios.post('http://notification-service:3006/notify', { userId, eventName, data });
    } catch (err) {
        logger.error(`Lỗi khi gửi thông báo '${eventName}'`, { error: err.message });
    }
};
// --- API Endpoints ---
// API: Tạo đơn hàng mới (yêu cầu vai trò 'customer')
app.post('/orders', authMiddleware, checkRole('customer'), createOrderValidation, asyncHandler(async (req, res) => {
    const { customer_id, service_type, description, price } = req.body;

    const [result] = await pool.execute(
        `INSERT INTO orders (customer_id, service_type, description, price, status) VALUES (?, ?, ?, ?, 'pending')`,
        [customer_id, service_type, description, price]
    );
    // Thông báo cho tất cả coordinator biết có đơn hàng mới
    notify('broadcast', 'new_order_pending', {
        orderId: result.insertId,
        message: `Có đơn hàng mới #${result.insertId} đang chờ được phân công.`
    });

    logger.info(`New order created with ID: ${result.insertId}`);
    res.status(201).json({ id: result.insertId, message: 'Order created' });
}));

// API: Lấy TẤT CẢ đơn hàng (yêu cầu coordinator/admin)
app.get('/orders', authMiddleware, checkRole('coordinator', 'admin'), asyncHandler(async (req, res) => {
    // 1. Lấy tất cả đơn hàng
    const [orders] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');

    // 2. Lấy tất cả feedback (để map cho hiệu quả)
    const [feedbackRows] = await pool.execute('SELECT order_id, rating, comment FROM feedback');
    const feedbackMap = new Map();
    feedbackRows.forEach(fb => {
        feedbackMap.set(fb.order_id, { rating: fb.rating, comment: fb.comment });
    });

    // 3. Làm giàu dữ liệu
    const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
            let assignedSpecialistName = null;
            try {
                // Gọi qua task-service để lấy thông tin người được giao việc
                const taskResponse = await axios.get(`http://task-service:3003/tasks/order/${order.id}`);
                const specialistId = taskResponse.data.assigned_to;

                // Gọi qua auth-service để lấy tên chuyên viên
                const authResponse = await axios.get(`http://auth-service:3001/users/${specialistId}`);
                assignedSpecialistName = authResponse.data.name;
            } catch (error) {
                // Không sao, có thể là đơn hàng 'pending' chưa có task
                if (error.response?.status !== 404) {
                    logger.warn(`[Order Service] Lỗi khi lấy task/user cho order ${order.id}:`, { message: error.message });
                }
            }

            // Lấy feedback từ map
            const feedback = feedbackMap.get(order.id) || null;

            return {
                ...order,
                assignedSpecialist: assignedSpecialistName,
                feedback: feedback
            };
        })
    );
    res.json(enrichedOrders);
}));

// API: Lấy tất cả đơn hàng của một khách hàng (yêu cầu đúng customer hoặc admin)
app.get('/orders/customer/:customerId', authMiddleware, asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    // if (req.user.id !== parseInt(customerId, 10) && req.user.role !== 'admin') {
    //     throw new AppError('Không có quyền truy cập', 403);
    // }
    const [orders] = await pool.execute('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);

    // Làm giàu dữ liệu
    const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
            if (order.service_type === 'recording' && order.status !== 'pending') {
                try {
                    const bookingResponse = await axios.get(`http://studio-service:3005/bookings/order/${order.id}`);
                    return { ...order, studioInfo: bookingResponse.data };
                } catch (error) {
                    if (error.response && error.response.status !== 404) {
                        logger.error(`[Order Service] Lỗi khi lấy booking cho order ${order.id}:`, { message: error.message });
                    }
                    return order;
                }
            }
            return order;
        })
    );
    res.json(enrichedOrders);
}));

// === START: PHẦN CẬP NHẬT LOGIC NẰM Ở ĐÂY ===
// API: Lấy chi tiết một đơn hàng
app.get('/orders/:id', authMiddleware, idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // 1. Lấy thông tin order và feedback (như cũ)
    const [rows] = await pool.execute(
        `SELECT o.*, f.rating, f.comment 
        FROM orders o 
        LEFT JOIN feedback f ON o.id = f.order_id 
        WHERE o.id = ?`,
        [id]
    );

    if (rows.length === 0) {
        throw new AppError('Không tìm thấy đơn hàng.', 404);
    }

    const order = rows[0];

    // 2. === START: LÀM GIÀU DỮ LIỆU (PHẦN THÊM MỚI) ===
    let customerName = 'Không rõ';
    try {
        // Gọi qua auth-service để lấy tên khách hàng
        const authResponse = await axios.get(`http://auth-service:3001/users/${order.customer_id}`);
        customerName = authResponse.data.name;
    } catch (error) {
        // Ghi log nếu có lỗi (trừ lỗi 404 - user có thể đã bị xóa)
        if (error.response?.status !== 404) {
            logger.warn(`[Order Service] Lỗi khi lấy user ${order.customer_id} cho order ${id}:`, { message: error.message });
        }
    }

    const enrichedOrder = {
        ...order,
        customer_name: customerName // Thêm tên khách hàng vào object
    };
    // === END: LÀM GIÀU DỮ LIỆU ===

    // 3. Trả về order đã có tên khách hàng
    res.json(enrichedOrder);
}));
// === END: PHẦN CẬP NHẬT LOGIC ===

// API: Cập nhật trạng thái đơn hàng (yêu cầu coordinator hoặc admin)
app.put('/orders/:id/status', authMiddleware, checkRole('coordinator', 'admin'), idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const [orderRows] = await pool.execute('SELECT customer_id FROM orders WHERE id = ?', [id]);
    if (orderRows.length === 0) {
        throw new AppError('Không tìm thấy đơn hàng.', 404);
    }
    const customerId = orderRows[0].customer_id;

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    notify(customerId, 'order_status_updated', {
        orderId: id,
        newStatus: status,
        message: `Trạng thái đơn hàng #${id} của bạn đã được cập nhật thành: ${status}.`
    });
    logger.info(`Order #${id} status updated to ${status}`);
    res.json({ message: 'Order status updated successfully' });
}));

// API: Thanh toán (yêu cầu customer)
app.post('/orders/:id/pay', authMiddleware, checkRole('customer'), idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { customer_id, amount, method } = req.body;
    await pool.query('START TRANSACTION');

    const [updateResult] = await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
        ['paid', id, 'completed']
    );
    if (updateResult.affectedRows === 0) {
        await pool.query('ROLLBACK');
        throw new AppError('Đơn hàng không hợp lệ để thanh toán.', 400);
    }
    await pool.execute(
        `INSERT INTO payment (order_id, customer_id, amount, method, status) VALUES (?, ?, ?, ?, 'paid')`,
        [id, customer_id, amount, method || 'credit_card']
    );
    await pool.query('COMMIT');
    logger.info(`Payment successful for order #${id}`);
    res.json({ message: 'Thanh toán thành công!' });
}));

// API: Gửi feedback (yêu cầu customer)
app.post('/orders/:id/feedback', authMiddleware, checkRole('customer'), idParamValidation, feedbackValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const [existing] = await pool.execute('SELECT id FROM feedback WHERE order_id = ?', [id]);
    if (existing.length > 0) {
        throw new AppError('Đơn hàng này đã được đánh giá.', 409);
    }

    await pool.execute(
        'INSERT INTO feedback (order_id, rating, comment) VALUES (?, ?, ?)',
        [id, rating, comment]
    );
    logger.info(`New feedback submitted for order #${id}`);
    res.status(201).json({ message: 'Gửi đánh giá thành công!' });
}));

// API: Kiểm tra feedback đã tồn tại chưa
app.get('/orders/:id/feedback', authMiddleware, idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT id FROM feedback WHERE order_id = ?', [id]);
    res.json({ hasFeedback: rows.length > 0 });
}));

// API: Khách hàng yêu cầu chỉnh sửa (yêu cầu customer)
app.post('/orders/:id/request-revision', authMiddleware, checkRole('customer'), idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment, coordinatorId } = req.body; // Lấy comment và ID của coordinator để gửi thông báo
    // 1. Cập nhật trạng thái đơn hàng thành 'revision_requested'
    const [updateResult] = await pool.execute(
        "UPDATE orders SET status = 'revision_requested' WHERE id = ? AND status = 'completed'",
        [id]
    );
    if (updateResult.affectedRows === 0) {
        throw new AppError('Đơn hàng không hợp lệ để yêu cầu chỉnh sửa.', 400);
    }
    // 2. (Quan trọng) Gửi yêu cầu đến task-service để mở lại task
    try {
        await axios.post(`http://task-service:3003/tasks/order/${id}/re-open`, { comment });
    } catch (error) {
        // Nếu task-service lỗi, rollback lại trạng thái order
        await pool.execute("UPDATE orders SET status = 'completed' WHERE id = ?", [id]);
        logger.error(`[Order Service] Lỗi khi gọi re-open task cho order ${id}:`, { message: error.message });
        throw new AppError('Không thể mở lại công việc cho chuyên viên.', 500);
    }

    // 3. Thông báo cho coordinator biết có yêu cầu chỉnh sửa
    if (coordinatorId) {
        notify(coordinatorId, 'revision_requested', {
            orderId: id,
            message: `Khách hàng vừa yêu cầu chỉnh sửa cho đơn hàng #${id}. Lý do: ${comment}`
        });
    }
    logger.info(`Revision requested for order #${id}`);
    res.json({ message: 'Yêu cầu chỉnh sửa đã được gửi đi.' });
}));

// API: Lấy thống kê (yêu cầu admin hoặc coordinator)
app.get('/stats', authMiddleware, checkRole('admin', 'coordinator'), asyncHandler(async (req, res) => {
    const [revenueRows] = await pool.execute("SELECT SUM(amount) as totalRevenue FROM payment WHERE status = 'paid'");
    const [statusRows] = await pool.execute("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
    const [totalOrdersRows] = await pool.execute("SELECT COUNT(*) as totalOrders FROM orders");
    res.json({
        totalRevenue: revenueRows[0].totalRevenue || 0,
        orderStats: statusRows,
        totalOrders: totalOrdersRows[0].totalOrders || 0
    });
}));

// === START: API MỚI CHO ADMIN QUẢN LÝ GIAO DỊCH ===
app.get('/admin/payments', authMiddleware, checkRole('admin'), asyncHandler(async (req, res) => {
    // 1. Lấy tất cả giao dịch từ bảng payment
    const [payments] = await pool.execute(
        'SELECT * FROM payment ORDER BY created_at DESC'
    );

    if (payments.length === 0) {
        return res.json([]);
    }

    // 2. Làm giàu dữ liệu: Lấy tên khách hàng từ auth-service
    // (Sử dụng logic tương tự như API GET /orders của Coordinator)
    const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
            let customerName = 'Không rõ';
            try {
                // Gọi qua auth-service để lấy tên khách hàng
                const authResponse = await axios.get(`http://auth-service:3001/users/${payment.customer_id}`);
                customerName = authResponse.data.name;
            } catch (error) {
                if (error.response?.status !== 404) {
                    logger.warn(`[Order Service] Lỗi khi lấy user ${payment.customer_id}:`, { message: error.message });
                }
            }
            return {
                ...payment,
                customer_name: customerName
            };
        })
    );

    res.json(enrichedPayments);
}));
// === END: API MỚI ===

// --- Middleware xử lý cuối cùng ---
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    logger.info(`Order Service is running on port ${PORT}`);
});