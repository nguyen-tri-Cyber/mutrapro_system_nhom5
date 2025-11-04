// services/notification-service/index.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config({ path: '../../.env' });

// Import modules
const { logger } = require('./shared/logger');
const { asyncHandler, notFound, errorHandler, AppError } = require('./shared/middleware/errorHandler');
const app = express();

const corsOptions = {
    origin: "http://localhost:3000", // Port mặc định của React app
    methods: ["GET", "POST"]
};

app.use(cors(corsOptions));
app.use(express.json());

// 🔹 Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'notification-service',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// Hệ thống quản lý user đang online
let onlineUsers = {};
const addUser = (userId, socketId) => {
    onlineUsers[userId] = socketId;
    logger.info(`User ${userId} connected with socket ${socketId}. Total online: ${Object.keys(onlineUsers).length}`);
};
const removeUser = (socketId) => {
    let removedUserId = null;
    Object.keys(onlineUsers).forEach(userId => {
        if (onlineUsers[userId] === socketId) {
            delete onlineUsers[userId];
            removedUserId = userId;
        }
    });
    if (removedUserId) {
        logger.info(`User ${removedUserId} disconnected (socket ${socketId}). Total online: ${Object.keys(onlineUsers).length}`);
    }
};

// Lắng nghe kết nối từ client
io.on("connection", (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
    });
    socket.on("disconnect", () => {
        removeUser(socket.id);
    });
});

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NOTIFICATION_NAME,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// --- API Endpoints ---

// API: Lưu thông báo vào DB (dùng nội bộ)
app.post('/send', asyncHandler(async (req, res) => {
    const { user_id, title, message, channel } = req.body;
    
    const [result] = await pool.execute(
        `INSERT INTO notifications (user_id, title, message, channel, status) VALUES (?, ?, ?, ?, 'pending')`,
        [user_id, title, message, channel || 'push']
    );

    logger.info(`Notification for user #${user_id} queued.`);
    res.status(201).json({ id: result.insertId, message: 'Notification queued for sending' });
}));

// API: Bắn thông báo real-time
app.post('/notify', (req, res) => {
    const { userId, eventName, data } = req.body;
    logger.info(`Received POST /notify for userId: ${userId}, event: ${eventName}`);
    
    if (userId === 'broadcast') {
        io.emit(eventName, data);
        logger.info(`Broadcasted event '${eventName}' to all clients.`);
        return res.status(200).json({ message: "Sự kiện đã được broadcast." });
    }

    const receiverSocketId = onlineUsers[userId];
    if (receiverSocketId) {
        io.to(receiverSocketId).emit(eventName, data);
        logger.info(`Emitted event '${eventName}' to user ${userId} (socket ${receiverSocketId})`);
        res.status(200).json({ message: "Thông báo real-time đã được gửi đi." });
    } else {
        logger.warn(`User ${userId} is OFFLINE. Cannot send real-time message for event '${eventName}'.`);
        // Có thể lưu thông báo này vào DB để gửi sau
        res.status(404).json({ message: "Người dùng không online." });
    }
});


// --- Middleware xử lý cuối cùng ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
    logger.info(`Notification Service (HTTP + WebSocket) is running on port ${PORT}`);
});