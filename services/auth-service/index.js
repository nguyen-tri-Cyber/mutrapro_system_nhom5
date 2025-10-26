const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_AUTH_NAME || 'mutrapro_auth',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// API Endpoint: Đăng ký người dùng
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    let connection;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        res.status(201).json({ id: result.insertId, message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email này đã được sử dụng.' });
        }
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API Endpoint: Đăng nhập
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
        }
        delete user.password_hash;
        res.json({ message: 'Login successful', user: user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// API: Lấy danh sách chuyên viên theo vai trò
app.get('/users/specialists', async (req, res) => {
    const { role } = req.query;
    let connection;
    const specialistRoles = ['transcriber', 'arranger', 'artist'];
    if (!role || !specialistRoles.includes(role)) {
        return res.status(400).json({ error: 'Vai trò chuyên viên không hợp lệ.' });
    }
    try {
        connection = await pool.getConnection();
        const [specialists] = await connection.execute(
            'SELECT id, name FROM users WHERE role = ?',
            [role]
        );
        res.json(specialists);
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách chuyên viên cho vai trò ${role}:`, error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    } finally {
        if (connection) connection.release();
    }
});

// API: Cập nhật tên người dùng
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    let connection;
    if (!name) {
        return res.status(400).json({ error: 'Tên không được để trống.' });
    }
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE users SET name = ? WHERE id = ?',
            [name, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        res.json({ message: 'Cập nhật hồ sơ thành công.' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

// ======================= API MỚI ĐỂ ĐỔI MẬT KHẨU =======================
// MỤC ĐÍCH: Cho phép người dùng đổi mật khẩu sau khi xác thực mật khẩu cũ.
// CÁCH GỌI: PUT http://localhost:3001/users/5/password
// BODY: { "oldPassword": "...", "newPassword": "..." }
// ========================================================================
app.put('/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    let connection;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đủ mật khẩu cũ và mới.' });
    }

    try {
        connection = await pool.getConnection();
        // 1. Lấy mật khẩu đã mã hóa hiện tại từ DB
        const [rows] = await connection.execute('SELECT password_hash FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        
        // 2. So sánh mật khẩu cũ người dùng nhập với mật khẩu trong DB
        const user = rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Mật khẩu cũ không đúng.' });
        }

        // 3. Nếu đúng, mã hóa mật khẩu mới và cập nhật vào DB
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedNewPassword, id]
        );

        res.json({ message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) connection.release();
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});