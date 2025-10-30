import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// Đảm bảo import CoordinatorDashboard nếu nó là component riêng
import CoordinatorDashboard from './CoordinatorDashboard'; 

// (Component chức năng của Khách hàng - giữ nguyên)
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

// Component chức năng của Chuyên gia - giữ nguyên
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
    const { user } = useContext(AuthContext); 
    
    // === HÀM RENDER ĐÃ ĐƯỢC CẬP NHẬT ===
    const renderRoleDashboard = () => {
        if (!user) return null;

        switch (user.role) {
            case 'customer':
                return <CustomerDashboard user={user} />;
            
            case 'coordinator':
                // Coordinator sẽ thấy bảng phân công VÀ link đến báo cáo
                return (
                    <>
                        <CoordinatorDashboard /> {/* Component bảng phân công */}
                        {/* Phần link đến báo cáo */}
                        <div className="dashboard-features" style={{ marginTop: '20px' }}>
                             <h3>Công cụ quản lý</h3>
                             <ul>
                                <li><Link to="/admin/dashboard">Xem Báo Cáo & Thống Kê</Link></li>
                                {/* Có thể thêm link khác cho Coordinator ở đây */}
                            </ul>
                        </div>
                    </>
                );

            case 'artist':
            case 'transcriber':
            case 'arranger':
                return <SpecialistDashboard user={user} />;

            // === THÊM CASE MỚI CHO ADMIN ===
            case 'admin':
                return (
                    <div className="dashboard-features">
                        <h3>Công cụ quản trị hệ thống</h3>
                        <ul>
                           <li><Link to="/admin/dashboard">Xem Báo Cáo & Thống Kê</Link></li>
                           {/* Ví dụ: Link quản lý người dùng (nếu có) */}
                           {/* <li><Link to="/admin/users">Quản lý người dùng</Link></li> */}
                       </ul>
                   </div>
                );
            // === KẾT THÚC CASE ADMIN ===

            default:
                // Thêm case cho studio_admin để họ thấy link quay lại trang quản lý studio
                if (user.role === 'studio_admin') {
                     return (
                         <div className="dashboard-features">
                             <h3>Công cụ quản trị phòng thu</h3>
                             <ul>
                                 <li><Link to="/admin/studios">Quản lý phòng thu & lịch đặt</Link></li>
                             </ul>
                         </div>
                     );
                }
                // Nếu vai trò không khớp bất kỳ trường hợp nào ở trên
                return <p>Vai trò của bạn chưa có chức năng nào trên trang này.</p>;
        }
    };
    // =====================================

    if (!user) {
        return <div className="page-container"><h1>Đang tải thông tin người dùng...</h1></div>;
    }

    return (
        <div className="page-container" style={{ alignItems: 'flex-start', maxWidth: '1000px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <h1>Chào mừng trở lại, {user.name}!</h1>
            </div>
            <p style={{ marginBottom: '30px' }}>Đây là bảng điều khiển của bạn. <strong>Vai trò:</strong> {user.role}</p>

            {/* Hiển thị các chức năng tương ứng với vai trò */}
            {renderRoleDashboard()}
        </div>
    );
};

export default Dashboard;