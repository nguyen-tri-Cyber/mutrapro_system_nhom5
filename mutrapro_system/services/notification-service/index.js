const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

// --- 1. IMPORT CÁC THƯ VIỆN CẦN THIẾT CHO REAL-TIME ---
const http = require('http');
const { Server } = require("socket.io");

const app = express();

// --- 2. CẤU HÌNH CORS CHO CẢ HTTP VÀ SOCKET.IO ---
// Điều này rất quan trọng để React app của bạn (chạy ở port khác) có thể kết nối
const corsOptions = {
    origin: "http://localhost:3000", // Port mặc định của React app
    methods: ["GET", "POST"]
};
app.use(cors(corsOptions));
app.use(express.json());

// --- 3. TẠO HTTP SERVER VÀ GẮN SOCKET.IO VÀO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});

// --- 4. HỆ THỐNG QUẢN LÝ USER ĐANG ONLINE ---
// Mục đích: Biết được socket ID nào tương ứng với user ID nào
// để gửi thông báo đến đúng người dùng.
let onlineUsers = {};
const addUser = (userId, socketId) => {
    onlineUsers[userId] = socketId;
    console.log(`[Notification Service] User ${userId} added with socket ${socketId}. Online users:`, onlineUsers); // Log thêm
};

const removeUser = (socketId) => {
    let removedUserId = null; // Biến để lưu ID user bị xóa
    Object.keys(onlineUsers).forEach(userId => {
        if (onlineUsers[userId] === socketId) {
            delete onlineUsers[userId];
            removedUserId = userId; // Ghi lại ID
        }
    });
    if (removedUserId) {
        console.log(`[Notification Service] User ${removedUserId} removed (socket ${socketId}). Online users:`, onlineUsers); // Log thêm
    }
};

// --- 5. LẮNG NGHE CÁC KẾT NỐI TỪ CLIENT (REACT APP) ---
io.on("connection", (socket) => {
    console.log(`[Notification Service] A user connected: ${socket.id}`);

    // Lắng nghe sự kiện "addUser" từ client
    socket.on("addUser", (userId) => {
        console.log(`[Notification Service] Received 'addUser' event for userId: ${userId} from socket: ${socket.id}`); // Log thêm
        addUser(userId, socket.id);
    });

    socket.on("disconnect", () => {
        console.log(`[Notification Service] User disconnected: ${socket.id}`);
        removeUser(socket.id);
    });
});

// Cấu hình "bể kết nối" đến DB (giữ nguyên)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NOTIFICATION_NAME || 'mutrapro_notification',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
const pool = mysql.createPool(dbConfig);

// API Endpoint: Gửi thông báo (Lưu vào DB, giữ nguyên)
// Mục đích: Vẫn giữ lại để có thể lưu lịch sử thông báo
app.post('/send', async (req, res) => {
    const { user_id, title, message, channel } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO notifications (user_id, title, message, channel, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [user_id, title, message, channel]
        );
        res.status(201).json({ id: result.insertId, message: 'Notification queued for sending' });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// ======================= API REAL-TIME MỚI =======================
// MỤC ĐÍCH: Nhận yêu cầu từ các service khác và bắn thông báo real-time ngay lập tức
// CÁCH DÙNG: VD: task-service sau khi tạo task sẽ gọi POST đến đây
// BODY: { "userId": 5, "eventName": "new_task", "data": { "orderId": 12, "description": "Ký âm..." } }
// =================================================================
// API REAL-TIME (ĐÃ NÂNG CẤP)
app.post('/notify', (req, res) => {
    const { userId, eventName, data } = req.body;
    console.log(`[Notification Service] Received POST /notify for userId: ${userId}, event: ${eventName}`); // Log thêm

    if (userId === 'broadcast') {
        io.emit(eventName, data); 
        console.log(`[Notification Service] Broadcasted event '${eventName}'`);
        return res.status(200).json({ message: "Sự kiện đã được broadcast." });
    }
    // ========================

    // Logic gửi cho 1 người giữ nguyên
const receiverSocketId = onlineUsers[userId];
    if (receiverSocketId) {
        io.to(receiverSocketId).emit(eventName, data);
        console.log(`[Notification Service] Emitted event '${eventName}' to user ${userId} (socket ${receiverSocketId})`);
        res.status(200).json({ message: "Thông báo đã được gửi đi." });
    } else {
        console.log(`[Notification Service] User ${userId} is OFFLINE. Cannot send real-time message.`);
        res.status(404).json({ message: "Người dùng không online." }); 
    }
});


const PORT = process.env.PORT || 3006;
// --- 6. KHỞI ĐỘNG SERVER ---
// Chú ý: Dùng `server.listen` thay vì `app.listen` để Socket.IO hoạt động
server.listen(PORT, () => {
    console.log(`Notification Service (HTTP + WebSocket) is running on port ${PORT}`);
});