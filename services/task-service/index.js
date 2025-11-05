// services/task-service/index.js (ĐÃ SỬA 2 LỖI AXIOS)
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config({ path: '../../.env' });
// Import modules
const { logger } = require('./shared/logger');
const { asyncHandler, notFound, errorHandler, AppError } = require('./shared/middleware/errorHandler');
const { createTaskValidation, idParamValidation } = require('./shared/middleware/validation');
// TODO: Tạm thời giả lập auth, sẽ được thay thế bằng logic gọi qua API Gateway
const authMiddleware = (req, res, next) => next();
const checkRole = (...roles) => (req, res, next) => next();
const app = express();
app.use(cors());
app.use(express.json());
//  🔹  Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'task-service',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TASK_NAME,
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
// API: Tạo công việc mới (yêu cầu coordinator)
app.post('/tasks', authMiddleware, checkRole('coordinator'), createTaskValidation, asyncHandler(async (req, res) => {
    const { order_id, assigned_to, specialist_role, deadline } = req.body;
    const [result] = await pool.execute(
        `INSERT INTO task (order_id, assigned_to, specialist_role, status, deadline) VALUES (?, ?, ?, 'assigned', ?)`,
        [order_id, assigned_to, specialist_role, deadline]
    );
    // Gửi thông báo cho chuyên viên được giao việc
    notify(assigned_to, 'new_task', {
        orderId: order_id,
        message: `Bạn vừa được giao một công việc mới cho đơn hàng #${order_id}.`
    });
    logger.info(`New task created for order #${order_id}, assigned to user #${assigned_to}`);
    res.status(201).json({ id: result.insertId, message: 'Task created' });
}));
// === START: PHẦN CẬP NHẬT LOGIC NẰM Ở ĐÂY ===
// API: Cập nhật trạng thái công việc (yêu cầu chuyên viên hoặc coordinator)
app.put('/tasks/:id/status', authMiddleware, idParamValidation, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, coordinatorId } = req.body;
    // 1. Cập nhật trạng thái task
    await pool.execute('UPDATE task SET status = ? WHERE id = ?', [status, id]);
    // 2. Lấy order_id (cần cho cả 2 logic bên dưới)
    const [taskRows] = await pool.execute('SELECT order_id FROM task WHERE id = ?', [id]);
    const orderId = taskRows[0]?.order_id;
    if (!orderId) {
        logger.warn(`Task #${id} status updated, but could not find matching orderId.`);
        // Vẫn trả về thành công vì task đã được cập nhật
        res.json({ message: 'Task status updated, but failed to find order.' });
        return;
    }
    // 3. (LOGIC MỚI) Nếu task bắt đầu (in_progress), cập nhật cả trạng thái của order
    if (status === 'in_progress') {
        try {
            // SỬA LỖI 1: Bỏ "/orders" khỏi đường dẫn
            await axios.put(`http://order-service:3002/${orderId}/status`, { status: 'in_progress' });
            logger.info(`[Task Service] Notified Order Service to update order ${orderId} to in_progress.`);
        } catch (err) {
            logger.error(`[Task Service] Failed to update order status for order ${orderId}`, { message: err.message });
            // Không ném lỗi, chỉ log
        }
    }
    // 4. (LOGIC CŨ) Nếu task hoàn thành (done) và có coordinatorId, báo cho coordinator biết
    if (status === 'done' && coordinatorId) {
        notify(coordinatorId, 'task_completed', {
            taskId: id,
            orderId: orderId,
            message: `Công việc cho đơn hàng #${orderId} đã được chuyên viên hoàn thành.`
        });
    }
    logger.info(`Task #${id} status updated to ${status}`);
    res.json({ message: 'Task status updated' });
}));
// === END: PHẦN CẬP NHẬT LOGIC ===
// API: Lấy task gần nhất theo Order ID (dùng nội bộ)
app.get('/tasks/order/:orderId', asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const [rows] = await pool.execute(
        'SELECT * FROM task WHERE order_id = ? ORDER BY assigned_at DESC LIMIT 1',
        [orderId]
    );
    if (rows.length === 0) {
        throw new AppError('Không tìm thấy task cho đơn hàng này.', 404);
    }
    res.json(rows[0]);
}));
// API: Mở lại một task từ trạng thái 'done' (dùng nội bộ bởi order-service)
app.post('/tasks/order/:orderId/re-open', asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { comment } = req.body; // Nhận comment từ yêu cầu revision
    // Tìm task mới nhất của order này
    const [taskRows] = await pool.execute(
        'SELECT id, assigned_to FROM task WHERE order_id = ? ORDER BY assigned_at DESC LIMIT 1',
        [orderId]
    );
    if (taskRows.length === 0) {
        throw new AppError('Không tìm thấy công việc tương ứng.', 404);
    }
    const task = taskRows[0];
    const [updateResult] = await pool.execute(
        "UPDATE task SET status = 'revision_requested', revision_comment = ? WHERE id = ? AND status = 'done'",
        [comment, task.id]
    );
    if (updateResult.affectedRows === 0) {
        throw new AppError('Công việc không ở trạng thái hợp lệ để mở lại.', 400);
    }
    // Gửi thông báo cho chuyên viên biết task của họ cần sửa
    notify(task.assigned_to, 'task_revision_needed', {
        orderId: orderId,
        taskId: task.id,
        message: `Đơn hàng #${orderId} cần bạn chỉnh sửa lại sản phẩm.`
    });
    logger.info(`Task #${task.id} for order #${orderId} has been re-opened for revision.`);
    res.json({ message: 'Task re-opened successfully' });
}));
// API: Lấy danh sách công việc của một chuyên viên
app.get('/tasks/specialist/:specialistId', authMiddleware, asyncHandler(async (req, res) => {
    const { specialistId } = req.params;
    // if (req.user.id !== parseInt(specialistId, 10)) {
    //     throw new AppError('Không có quyền truy cập', 403);
    // }
    const [tasks] = await pool.execute('SELECT * FROM task WHERE assigned_to = ? ORDER BY assigned_at DESC', [specialistId]);
    if (tasks.length === 0) {
        return res.json([]);
    }
    // Làm giàu dữ liệu: Lấy mô tả đơn hàng từ order-service
    const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
            try {
                // SỬA LỖI 2: Bỏ "/orders" khỏi đường dẫn
                const orderResponse = await axios.get(`http://order-service:3002/${task.order_id}`);
                return { ...task, description: orderResponse.data.description };
            } catch (error) {
                logger.error(`Không thể lấy chi tiết cho order ID ${task.order_id}`, { message: error.message });
                return { ...task, description: 'Không thể tải mô tả đơn hàng.' };
            }
        })
    );
    res.json(enrichedTasks);
}));
// --- Middleware xử lý cuối cùng ---
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    logger.info(`Task Service is running on port ${PORT}`);
});
