// web-app/src/components/Layout.js
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { io } from "socket.io-client";
import Navbar from './Navbar';

const Layout = () => {
    const { user } = useAuth(); 

    useEffect(() => {
        let socket; // Khai báo socket ở đây để có thể truy cập trong cleanup function

        if (user) {
            console.log(`[Layout Effect] User logged in (ID: ${user.id}). Attempting to connect socket...`);
            socket = io("http://localhost:3006"); // Kết nối socket

            socket.on('connect', () => {
                console.log(`[Socket.IO] Connected successfully! Socket ID: ${socket.id}`);
                // Gửi ID người dùng lên server để đăng ký online
                console.log(`[Socket.IO] Emitting 'addUser' for user ID: ${user.id}`);
                socket.emit("addUser", user.id); 
            });

            // Log lỗi kết nối (nếu có)
            socket.on('connect_error', (err) => {
                console.error('[Socket.IO] Connection Error:', err.message);
            });

            // Lắng nghe các sự kiện (giữ nguyên)
            socket.on("new_task", (data) => {
                console.log("[Socket.IO] Received 'new_task':", data);
                toast.info(data.message || "Bạn có công việc mới!");
            });
            socket.on("order_status_updated", (data) => {
                console.log("[Socket.IO] Received 'order_status_updated':", data);
                toast.success(data.message || `Đơn hàng #${data.orderId} đã cập nhật.`);
            });
            socket.on("studio_status_updated", (data) => {
                 console.log("[Socket.IO] Received 'studio_status_updated':", data);
                 // Có thể thêm toast ở đây nếu muốn
                 // toast.info(`Trạng thái phòng thu ${data.studioId} đổi thành ${data.newStatus}`);
            });
             socket.on("product_file_uploaded", (data) => {
                 console.log("[Socket.IO] Received 'product_file_uploaded':", data);
                 toast.success(data.message || `Có file mới cho đơn hàng #${data.orderId}`);
             });
             // Thêm các listener khác nếu cần

            // Cleanup function khi component unmount hoặc user thay đổi
            return () => {
                if (socket) {
                    console.log("[Socket.IO] Disconnecting socket...");
                    socket.disconnect();
                }
            };
        } else {
             // Nếu không có user (logout), đảm bảo không có socket nào đang chạy
             console.log("[Layout Effect] No user logged in.");
             // Không cần làm gì thêm vì cleanup của lần chạy trước (nếu có) đã disconnect rồi
        }
    }, [user]); // Phụ thuộc vào user

    return (
        <>
            <Navbar />
            <main>
                <Outlet />
            </main>
        </>
    );
};

export default Layout;