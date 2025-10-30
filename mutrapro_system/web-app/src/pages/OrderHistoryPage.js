// web-app/src/pages/OrderHistoryPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderApi from '../api/orderApi';

const OrderHistoryPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        if (user) {
            fetchOrders(user.id);
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) return <div className="page-container"><p>Đang tải lịch sử đơn hàng...</p></div>;

    return (
        <div className="page-container" style={{ alignItems: 'flex-start', maxWidth: '1000px', margin: 'auto' }}>
            <h2>Lịch Sử Đơn Hàng Của Bạn</h2>
            {orders.length === 0 ? (
                <p>Bạn chưa có đơn hàng nào.</p>
            ) : (

                <table className="admin-table" style={{color: 'white'}}> 
                    <thead style={{color: 'black'}}>
                        <tr>
                            <th>ID Đơn hàng</th>
                            <th>Dịch Vụ</th>
                            <th>Trạng Thái</th>
                            <th>Chi tiết</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td><Link to={`/orders/${order.id}`} style={{color: 'red', fontWeight:'bold'}}>#{order.id}</Link></td>
                                <td style={{color: '#58a6ff', fontWeight:'bold'}}>{order.service_type}</td>
                                <td style={{ fontWeight: 'bold', color:'red'}}>{order.status}</td>
                                <td style={{fontSize: '0.9em', color: '#58a6ff', fontWeight:'bold'}}>
                                    {order.studioInfo ? (
                                        `Phòng thu: ${order.studioInfo.studioName} (${order.studioInfo.location})`
                                    ) : (
                                        ''
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default OrderHistoryPage;