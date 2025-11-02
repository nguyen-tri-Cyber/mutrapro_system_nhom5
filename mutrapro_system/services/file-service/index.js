// services/file-service/index.js
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
const { idParamValidation } = require('./shared/middleware/validation');

// TODO: Tạm thời giả lập auth, sẽ được thay thế bằng logic gọi qua API Gateway
const authMiddleware = (req, res, next) => next();

const app = express();
app.use(cors());
app.use(express.json());

// Đảm bảo thư mục 'uploads' tồn tại
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất để tránh trùng lặp
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// --- API Endpoints ---

// API: Tải file lên
app.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
    const { order_id, uploader_id, file_type, coordinatorId } = req.body;
    const file = req.file;

    if (!file) {
        throw new AppError('Không có file nào được tải lên.', 400);
    }
    
    const { originalname, path: filePath, size } = file;

    const [result] = await pool.execute(
        `INSERT INTO file (order_id, uploader_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, uploader_id, originalname, filePath, file_type, size]
    );

    // Gửi thông báo nếu là file sản phẩm do chuyên viên nộp
    if (file_type !== 'audio' && coordinatorId) {
        notify(coordinatorId, 'product_file_uploaded', {
            orderId: order_id,
            fileName: originalname,
            uploaderId: uploader_id,
            message: `Chuyên viên vừa nộp file sản phẩm cho đơn hàng #${order_id}.`
        });
    }

    logger.info(`File ${originalname} uploaded for order #${order_id}`);
    res.status(201).json({ id: result.insertId, message: 'File uploaded successfully', filePath: filePath });
}));

// API: Lấy danh sách file theo order ID
app.get('/files/order/:orderId', authMiddleware, asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const [rows] = await pool.execute(
        'SELECT id, file_name, file_type, created_at FROM file WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
    );
    res.json(rows);
}));

// API: Tải file xuống
app.get('/files/download/:fileId', authMiddleware, asyncHandler(async (req, res, next) => {
    const { fileId } = req.params;
    
    const [rows] = await pool.execute('SELECT * FROM file WHERE id = ?', [fileId]);
    if (rows.length === 0) {
        throw new AppError('Không tìm thấy thông tin file trong CSDL.', 404);
    }

    const fileInfo = rows[0];
    const filePath = path.join(__dirname, fileInfo.file_path);

    if (fs.existsSync(filePath)) {
        res.download(filePath, fileInfo.file_name, (err) => {
            if (err) {
                // Chuyển lỗi cho error handler để ghi log
                next(err);
            }
        });
    } else {
        throw new AppError('Không tìm thấy file trên server.', 404);
    }
}));


// --- Middleware xử lý cuối cùng ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    logger.info(`File Service is running on port ${PORT}`);
});