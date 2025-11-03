// services/file-service/index.js (ĐÃ SỬA)
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: '../../.env' });

// Import modules
const { logger } = require('./shared/logger');
const { asyncHandler, notFound, errorHandler, AppError } = require('./shared/middleware/errorHandler');
const { idParamValidation, orderIdParamValidation, fileIdParamValidation } = require('./shared/middleware/validation');

const authMiddleware = (req, res, next) => next();
const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_FILE_NAME,
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

// === START: SỬA LỖI FONT 1 (Sửa storage.filename) ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // FIX: Multer đọc tên file là latin1, chuyển nó về utf8
        const correctOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        // Dùng tên file đã fix để lưu
        cb(null, `${Date.now()}-${correctOriginalName}`);
    }
});
// === END: SỬA LỖI FONT 1 ===

const upload = multer({ storage: storage });

// --- API Endpoints ---

// API: Tải file lên
// === START: SỬA LỖI FONT 2 (Sửa app.post('/upload')) ===
app.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
    const { order_id, uploader_id, file_type, coordinatorId } = req.body;
    const file = req.file;
    if (!file) {
        throw new AppError('Không có file nào được tải lên.', 400);
    }

    // file.path là đường dẫn file ĐÃ ĐƯỢC LƯU (ví dụ: uploads/12345-Tên-File-Đúng.mp3)
    const { path: filePath, size } = file;
    
    // FIX: Tên file gốc (để lưu vào DB) cũng phải được chuyển đổi
    const correctOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const [result] = await pool.execute(
        `INSERT INTO file (order_id, uploader_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, uploader_id, correctOriginalName, filePath, file_type, size] // Dùng tên file đã fix
    );

    // Gửi thông báo (không đổi)
    if (file_type !== 'audio' && coordinatorId) {
        notify(coordinatorId, 'product_file_uploaded', {
            orderId: order_id,
            fileName: correctOriginalName, // Dùng tên file đã fix
            uploaderId: uploader_id,
            message: `Chuyên viên vừa nộp file sản phẩm cho đơn hàng #${order_id}.`
        });
    }

    logger.info(`File ${correctOriginalName} uploaded for order #${order_id}`); // Dùng tên file đã fix
    res.status(201).json({ id: result.insertId, message: 'File uploaded successfully', filePath: filePath });
}));
// === END: SỬA LỖI FONT 2 ===

// API: Lấy danh sách file theo order ID (Không đổi)
app.get('/files/order/:orderId', authMiddleware, orderIdParamValidation, asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const [rows] = await pool.execute(
        'SELECT id, file_name, file_type, created_at FROM file WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
    );
    res.json(rows);
}));

// API: Tải file xuống
// === START: SỬA LỖI FONT 3 (Sửa app.get('/files/download...')) ===
app.get('/files/download/:fileId', authMiddleware, fileIdParamValidation, asyncHandler(async (req, res, next) => {
    const { fileId } = req.params;

    const [rows] = await pool.execute('SELECT * FROM file WHERE id = ?', [fileId]);
    if (rows.length === 0) {
        throw new AppError('Không tìm thấy thông tin file trong CSDL.', 404);
    }
    const fileInfo = rows[0];
    const filePath = path.join(__dirname, fileInfo.file_path);

    if (fs.existsSync(filePath)) {
        // FIX: Dùng res.sendFile + setHeader để trình duyệt hiểu đúng tên file UTF-8
        // Thay vì res.download(filePath, fileInfo.file_name, ...);
        
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileInfo.file_name)}`);
        res.sendFile(filePath, (err) => {
            if (err) {
                // Chuyển lỗi cho error handler để ghi log
                next(err);
            }
        });
    } else {
        throw new AppError('Không tìm thấy file trên server.', 404);
    }
}));
// === END: SỬA LỖI FONT 3 ===

// --- Middleware xử lý cuối cùng ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    logger.info(`File Service is running on port ${PORT}`);
});