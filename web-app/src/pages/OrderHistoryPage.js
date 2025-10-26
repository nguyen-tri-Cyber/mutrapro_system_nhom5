// web-app/src/pages/OrderHistoryPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 1. Import Link để tạo đường dẫn
import { useAuth } from '../context/AuthContext'; // 2. Import useAuth để lấy thông tin user
import orderApi from '../api/orderApi';

const OrderHistoryPage = () => {
    const { user } = useAuth(); // 3. Lấy user trực tiếp từ trạm điều khiển trung tâm
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hàm fetchOrders không đổi
        const fetchOrders = async (userId) => {
            try {
                const data = await orderApi.getOrdersByCustomer(userId);
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };

        // 4. Logic được đơn giản hóa: nếu có user thì fetch, không thì thôi
        if (user) {
            fetchOrders(user.id);
        } else {
            // Nếu không có user (ví dụ: bị logout), không cần làm gì và không loading nữa
            setLoading(false);
        }
    }, [user]); // useEffect sẽ chạy lại mỗi khi user thay đổi (đăng nhập/đăng xuất)

    if (loading) return <div className="page-container"><p>Đang tải lịch sử đơn hàng...</p></div>;

    return (
        <div className="page-container" style={{ alignItems: 'flex-start', maxWidth: '1000px', margin: 'auto' }}>
            <h2>Lịch Sử Đơn Hàng Của Bạn</h2>
            {orders.length === 0 ? (
                <p>Bạn chưa có đơn hàng nào.</p>
            ) : (
                <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #333' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>ID Order</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Dịch Vụ</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Mô Tả</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #ccc' }}>
                                {/* --- 5. SỬA LỖI Ở ĐÂY: BIẾN ID THÀNH LINK --- */}
                                <td style={{ padding: '10px' }}>
                                    <Link to={`/orders/${order.id}`}>#{order.id}</Link>
                                </td>
                                <td style={{ padding: '10px' }}>{order.service_type}</td>
                                <td style={{ padding: '10px' }}>{order.description}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{order.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default OrderHistoryPage;