const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
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
    connectionLimit: 10, // Giới hạn 10 kết nối
    queueLimit: 0
};

// Tạo ra một "bể" chứa các kết nối có sẵn
const pool = mysql.createPool(dbConfig);

console.log('---DATABASE CONFIG---', dbConfig);

const upload = multer({ dest: 'uploads/' });

app.get('/ping', (req, res) => {
    console.log('>>> Received a PING request!');
    res.status(200).send('Pong from File Service!');
});

// --- API MỚI ĐỂ DOWNLOAD FILE ---
app.get('/files/download/:fileId', async (req, res) => {
    const { fileId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        // Lấy thông tin file từ DB, bao gồm cả file_path
        const [rows] = await connection.execute('SELECT * FROM file WHERE id = ?', [fileId]);

        if (rows.length === 0) {
            return res.status(404).send('File not found.');
        }

        const fileInfo = rows[0];
        // Tạo đường dẫn tuyệt đối đến file trên server
        const filePath = path.join(__dirname, fileInfo.file_path);

        // Kiểm tra xem file có thực sự tồn tại không
        if (fs.existsSync(filePath)) {
            // Gửi file về cho client để tải xuống với tên gốc
            res.download(filePath, fileInfo.file_name, (err) => {
                if (err) {
                    console.error('File download error:', err);
                    // Không gửi response lỗi ở đây vì header đã được gửi
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

// API LẤY FILE THEO ORDER ID
app.get('/files/order/:orderId', async (req, res) => {
    const { orderId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        // --- THÊM "LIMIT 1" VÀO CUỐI CÂU LỆNH SQL ---
        const [rows] = await connection.execute(
            'SELECT id, file_name, file_type, created_at FROM file WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );
        res.json(rows); // Sẽ trả về mảng có 0 hoặc 1 phần tử
    } catch (error) {
        console.error(`Error fetching files for order ${orderId}:`, error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});


// Endpoint chính để tải file lên
app.post('/upload', upload.single('file'), async (req, res) => {
    const { order_id, uploader_id, file_type } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, path: filePath } = file;
    let connection;
    try {
        // "Mượn" kết nối
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO file (order_id, uploader_id, file_name, file_path, file_type)
             VALUES (?, ?, ?, ?, ?)`,
            [order_id, uploader_id, originalname, filePath, file_type]
        );
        
        res.status(201).json({ id: result.insertId, message: 'File uploaded successfully', filePath: filePath });
    } catch (error) {
        console.error('---!!! DATABASE OPERATION FAILED !!!---:', error);
        res.status(500).json({ error: 'Database error', details: error.message });
    } finally {
        // "Trả lại" kết nối
        if (connection) connection.release();
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`File Service is running on port ${PORT}`);
});