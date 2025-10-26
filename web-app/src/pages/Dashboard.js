import React, { useContext } from 'react'; // 1. Bỏ useState, useEffect
import { Link } from 'react-router-dom'; // Bỏ useNavigate
import { AuthContext } from '../context/AuthContext'; // 2. Import "trạm điều khiển"
import CoordinatorDashboard from './CoordinatorDashboard';

// (Component chức năng của Khách hàng)
const CustomerDashboard = ({ user }) => (
    <div className="dashboard-features">
        <h3>Chức năng của Khách hàng</h3>
        <ul>
            <li><Link to="/orders/new">Tạo đơn hàng mới</Link></li>
            <li><Link to="/orders/history">Xem lịch sử đơn hàng</Link></li>
            <li><Link to="/profile">Chỉnh sửa hồ sơ</Link></li>
        </ul>
    </div>
);

// Component chức năng của Chuyên gia
const SpecialistDashboard = ({ user }) => (
    <div className="dashboard-features">
        <h3>Nhiệm vụ của bạn</h3>
        <ul>
            <li><Link to="/tasks">Xem nhiệm vụ được giao</Link></li>
            {user.role === 'artist' && (
                <li><Link to="/studio/booking">Đặt lịch phòng thu</Link></li>
            )}
        </ul>
    </div>
);


const Dashboard = () => {
    // 3. Lấy thông tin user trực tiếp từ trạm điều khiển, bỏ hoàn toàn logic tự quản lý
    const { user } = useContext(AuthContext); 
    
    // Hàm render các chức năng dựa trên vai trò (giữ nguyên)
    const renderRoleDashboard = () => {
        if (!user) return null;

        switch (user.role) {
            case 'customer':
                return <CustomerDashboard user={user} />;
            case 'coordinator':
                return <CoordinatorDashboard />;
            case 'artist':
            case 'transcriber':
            case 'arranger':
                return <SpecialistDashboard user={user} />;
            default:
                return <p>Vai trò của bạn chưa có chức năng nào.</p>;
        }
    };

    // Nếu không có user (do AuthContext trả về), component sẽ tự động được bảo vệ
    // bởi ProtectedRoute, màn hình "Đang tải..." này để tránh lỗi render tạm thời.
    if (!user) {
        return <div className="page-container"><h1>Đang tải thông tin người dùng...</h1></div>;
    }

    return (
        <div className="page-container" style={{ alignItems: 'flex-start', maxWidth: '1000px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <h1>Chào mừng trở lại, {user.name}!</h1>
                {/* 4. NÚT ĐĂNG XUẤT MÀU ĐỎ ĐÃ ĐƯỢC XÓA */}
            </div>
            <p style={{ marginBottom: '30px' }}>Đây là bảng điều khiển của bạn. <strong>Vai trò:</strong> {user.role}</p>

            {/* Hiển thị các chức năng tương ứng với vai trò */}
            {renderRoleDashboard()}
        </div>
    );
};

export default Dashboard;