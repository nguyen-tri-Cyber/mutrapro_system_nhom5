// web-app/src/pages/OrderDetailsPage.js
import React, { useState, useEffect, useCallback } from 'react'; // 1. Import thêm useCallback
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import orderApi from '../api/orderApi';
import fileApi from '../api/fileApi';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Bọc hàm fetchData trong useCallback
    // Điều này giúp hàm không bị tạo lại mỗi lần component render, trừ khi orderId thay đổi.
    const fetchData = useCallback(async () => {
        if (!orderId) return;
        try {
            setLoading(true);
            const [orderData, filesData] = await Promise.all([
                orderApi.getOrderById(orderId),
                fileApi.getFilesByOrder(orderId)
            ]);
            setOrder(orderData);
            setFiles(filesData);
        } catch (error) {
            console.error("Failed to fetch order details:", error);
            toast.error("Không thể tải chi tiết đơn hàng.");
        } finally {
            setLoading(false);
        }
    }, [orderId]); // useCallback sẽ theo dõi orderId

    useEffect(() => {
        fetchData();
    }, [fetchData]); // 3. Thêm fetchData vào danh sách theo dõi của useEffect

    const handlePayment = async () => {
        if (!user || !order) return;
        try {
            await orderApi.payForOrder(order.id, {
                customer_id: user.id,
                amount: order.price,
                method: 'credit_card'
            });
            toast.success("Thanh toán thành công!");
            fetchData(); // Gọi lại fetchData để làm mới dữ liệu
        } catch (error) {
            toast.error("Thanh toán thất bại!");
        }
    };

    if (loading) return <div className="page-container"><p>Đang tải chi tiết đơn hàng...</p></div>;
    if (!order) return <div className="page-container"><p>Không tìm thấy đơn hàng.</p></div>;

    return (
        <div className="page-container" style={{ alignItems: 'flex-start', maxWidth: '1000px', margin: 'auto' }}>
            <h2>Chi Tiết Đơn Hàng #{order.id}</h2>
            
            <div className="dashboard-features">
                <p><strong>Dịch vụ:</strong> {order.service_type}</p>
                <p><strong>Mô tả:</strong> {order.description}</p>
                <p><strong>Trạng thái:</strong> <span style={{ fontWeight: 'bold' }}>{order.status}</span></p>
                <p><strong>Ngày tạo:</strong> {new Date(order.created_at).toLocaleString()}</p>

                {user && user.role === 'customer' && order.status === 'completed' && (
                    <button onClick={handlePayment} className="form-button" style={{ marginTop: '20px' }}>
                        Thanh toán ngay
                    </button>
                )}
            </div>

            <h3 style={{ marginTop: '30px' }}>Các File Của Đơn Hàng</h3>
            <div className="dashboard-features">
                {files.length > 0 ? (
                    <ul>
                        {files.map(file => (
                            <li key={file.id}>
                                <a
                                    href={`http://localhost:3004/files/download/${file.id}`}
                                    className="file-download-link"
                                >
                                    {file.file_name}
                                </a>
                                ({file.file_type}) - Tải lên lúc: {new Date(file.created_at).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Chưa có file nào được nộp cho đơn hàng này.</p>
                )}
            </div>
        </div>
    );
};

export default OrderDetailsPage;