// web-app/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- Dùng useAuth

const ProtectedRoute = () => {
    const { user } = useAuth(); // <-- Lấy user từ "trạm điều khiển"
    
    // Nếu không có user, chuyển hướng về trang đăng nhập
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    // Nếu có user, cho phép truy cập
    return <Outlet />;
};

export default ProtectedRoute;
