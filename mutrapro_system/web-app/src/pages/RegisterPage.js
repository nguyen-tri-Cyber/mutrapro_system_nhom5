import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi'; // Import file API đã tạo

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer'); // Thêm state mới để quản lý vai trò
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Truyền thêm 'role' vào hàm register
            await authApi.register(name, email, password, role);
            
            alert('Đăng ký tài khoản thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
            navigate('/login');

        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleRegister} className="form-card">
                <h2>Đăng Ký Tài Khoản</h2>
                
                <div className="form-group">
                    <label>Tên hiển thị</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                {/* --- Ô CHỌN VAI TRÒ ĐƯỢC THÊM VÀO ĐÂY --- */}
                <div className="form-group">
                    <label>Vai trò</label>
                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="customer">Khách hàng (Customer)</option>
                        <option value="coordinator">Điều phối viên (Coordinator)</option>
                        <option value="transcriber">Chuyên viên ký âm (Transcriber)</option>
                        <option value="arranger">Chuyên viên phối khí (Arranger)</option>
                        <option value="artist">Nghệ sĩ thu âm (Artist)</option>
                        <option value="studio_admin">Quản trị viên phòng thu (Studio Admin)</option>
                        <option value="admin">Quản trị hệ thống (Admin)</option>
                    </select>
                </div>

                {error && <p className="error-message">{error}</p>}
                
                <button type="submit" className="form-button" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đăng Ký'}
                </button>
            </form>
        </div>
    );
};

export default RegisterPage;