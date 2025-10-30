const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Cấu hình "bể kết nối"
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_TASK_NAME || 'mutrapro_task',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Tạo ra một "bể" chứa các kết nối có sẵn
const pool = mysql.createPool(dbConfig);

// Hàm helper để gửi thông báo
const notify = async (userId, eventName, data) => {
    try {
        await axios.post('http://notification-service:3006/notify', { userId, eventName, data });
    } catch (err) {
        console.error(`Lỗi khi gửi thông báo '${eventName}':`, err.message);
    }
};

// API Endpoint: Tạo công việc mới
app.post('/tasks', async (req, res) => {
    const { order_id, assigned_to, specialist_role, deadline } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO task (order_id, assigned_to, specialist_role, status, assigned_at, deadline)
             VALUES (?, ?, ?, 'assigned', NOW(), ?)`,
            [order_id, assigned_to, specialist_role, deadline]
        );
        
        // Gửi thông báo cho chuyên viên được giao việc
        notify(assigned_to, 'new_task', {
            orderId: order_id,
            message: `Bạn vừa được giao một công việc mới cho đơn hàng #${order_id}.`
        });

        res.status(201).json({ id: result.insertId, message: 'Task created' });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API Endpoint: Cập nhật trạng thái công việc
app.put('/tasks/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, coordinatorId } = req.body; // Giả sử frontend gửi kèm ID của coordinator
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.execute('UPDATE task SET status = ? WHERE id = ?', [status, id]);

        // Nếu task hoàn thành và có coordinatorId, báo cho coordinator biết
        if (status === 'done' && coordinatorId) {
            const [taskRows] = await connection.execute('SELECT order_id FROM task WHERE id = ?', [id]);
            const orderId = taskRows[0]?.order_id;
            
            notify(coordinatorId, 'task_completed', {
                taskId: id,
                orderId: orderId,
                message: `Công việc cho đơn hàng #${orderId} đã được chuyên viên hoàn thành.`
            });
        }
        
        res.json({ message: 'Task status updated' });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API LẤY TASK (đã nâng cấp)
app.get('/tasks/specialist/:specialistId', async (req, res) => {
    const { specialistId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [tasks] = await connection.execute(
            'SELECT * FROM task WHERE assigned_to = ? ORDER BY assigned_at DESC',
            [specialistId]
        );

        if (tasks.length === 0) return res.json([]);

        const enrichedTasks = await Promise.all(
            tasks.map(async (task) => {
                try {
                    const orderResponse = await axios.get(`http://order-service:3002/orders/${task.order_id}`);
                    return { ...task, description: orderResponse.data.description };
                } catch (error) {
                    console.error(`Không thể lấy chi tiết cho order ID ${task.order_id}:`, error.message);
                    return { ...task, description: 'Không thể tải mô tả đơn hàng.' };
                }
            })
        );
        res.json(enrichedTasks);
    } catch (error) {
        console.error('Get tasks by specialist error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Task Service is running on port ${PORT}`);
}); 