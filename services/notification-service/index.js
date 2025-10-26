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
};

const removeUser = (socketId) => {
    // Tìm userId dựa trên socketId và xóa khỏi danh sách
    Object.keys(onlineUsers).forEach(userId => {
        if (onlineUsers[userId] === socketId) {
            delete onlineUsers[userId];
        }
    });
};

// --- 5. LẮNG NGHE CÁC KẾT NỐI TỪ CLIENT (REACT APP) ---
io.on("connection", (socket) => {
    console.log(`Một người dùng đã kết nối: ${socket.id}`);

    // Lắng nghe sự kiện khi user đăng nhập và gửi userId của họ lên
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        console.log("Danh sách người dùng online:", onlineUsers);
    });

    // Lắng nghe sự kiện khi user ngắt kết nối (tắt tab, logout)
    socket.on("disconnect", () => {
        console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
        removeUser(socket.id);
        console.log("Danh sách người dùng online:", onlineUsers);
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
app.post('/notify', (req, res) => {
    const { userId, eventName, data } = req.body;

    // Tìm socket ID của người dùng cần nhận thông báo
    const receiverSocketId = onlineUsers[userId];

    if (receiverSocketId) {
        // Nếu người dùng đang online, gửi sự kiện đến họ
        io.to(receiverSocketId).emit(eventName, data);
        console.log(`Đã gửi sự kiện '${eventName}' đến người dùng ID: ${userId}`);
        res.status(200).json({ message: "Thông báo đã được gửi đi." });
    } else {
        // Nếu người dùng offline, báo lại cho service gọi đến
        console.log(`Người dùng ID: ${userId} không online, không gửi thông báo real-time.`);
        res.status(404).json({ message: "Người dùng không online." });
        // (Nâng cao): Ở đây bạn có thể thêm logic để lưu thông báo này vào DB
        // để khi người dùng online trở lại, họ sẽ thấy.
    }
});


const PORT = process.env.PORT || 3006;
// --- 6. KHỞI ĐỘNG SERVER ---
// Chú ý: Dùng `server.listen` thay vì `app.listen` để Socket.IO hoạt động
server.listen(PORT, () => {
    console.log(`Notification Service (HTTP + WebSocket) is running on port ${PORT}`);
});