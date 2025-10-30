const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Đảm bảo thư mục 'uploads' tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// 1. Cấu hình "bể kết nối"
const dbConfig = {
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_strong_password',
    database: process.env.DB_FILE_NAME || 'mutrapro_file',
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

console.log('---DATABASE CONFIG---', dbConfig);

const upload = multer({ dest: 'uploads/' });

app.get('/ping', (req, res) => {
    console.log('>>> Received a PING request!');
    res.status(200).send('Pong from File Service!');
});

// --- API MỚI ĐỂ DOWNLOAD FILE --- (Không đổi)
app.get('/files/download/:fileId', async (req, res) => {
    const { fileId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM file WHERE id = ?', [fileId]);
        if (rows.length === 0) {
            return res.status(404).send('File not found.');
        }
        const fileInfo = rows[0];
        const filePath = path.join(__dirname, fileInfo.file_path);
        if (fs.existsSync(filePath)) {
            res.download(filePath, fileInfo.file_name, (err) => {
                if (err) {
                    console.error('File download error:', err);
                }
            });
        } else {
            res.status(404).send('File not found on server.');
        }
    } catch (error) {
        console.error(`Error downloading file ${fileId}:`, error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API LẤY FILE THEO ORDER ID (Không đổi)
app.get('/files/order/:orderId', async (req, res) => {
    const { orderId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, file_name, file_type, created_at FROM file WHERE order_id = ? ORDER BY created_at DESC', // Gỡ LIMIT 1 để lấy tất cả file
            [orderId]
        );
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching files for order ${orderId}:`, error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// Endpoint chính để tải file lên (ĐÃ NÂNG CẤP)
app.post('/upload', upload.single('file'), async (req, res) => {
    // Giả sử frontend sẽ gửi thêm coordinatorId khi chuyên viên nộp bài
    const { order_id, uploader_id, file_type, coordinatorId } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, path: filePath } = file;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO file (order_id, uploader_id, file_name, file_path, file_type)
             VALUES (?, ?, ?, ?, ?)`,
            [order_id, uploader_id, originalname, filePath, file_type]
        );
        
        // ======================= PHẦN NÂNG CẤP REAL-TIME =======================
        // Nếu là file sản phẩm (không phải audio gốc) và có coordinatorId, thì gửi thông báo
        if (file_type !== 'audio' && coordinatorId) {
            notify(coordinatorId, 'product_file_uploaded', {
                orderId: order_id,
                fileName: originalname,
                uploaderId: uploader_id,
                message: `Chuyên viên vừa nộp file sản phẩm cho đơn hàng #${order_id}.`
            });
        }
        // ======================================================================
        
        res.status(201).json({ id: result.insertId, message: 'File uploaded successfully', filePath: filePath });
    } catch (error) {
        console.error('---!!! DATABASE OPERATION FAILED !!!---:', error);
        res.status(500).json({ error: 'Database error', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`File Service is running on port ${PORT}`);
});