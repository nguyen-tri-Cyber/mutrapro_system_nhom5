// web-app/src/pages/CoordinatorDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import orderApi from '../api/orderApi';
import taskApi from '../api/taskApi';
import authApi from '../api/authApi'; // Import authApi để lấy chuyên viên


const AssignTaskModal = ({ order, onClose, onAssign }) => {
    const [specialists, setSpecialists] = useState([]);
    const [selectedSpecialist, setSelectedSpecialist] = useState('');
    const [loading, setLoading] = useState(true);

    const roleMap = {
        'transcription': 'transcriber',
        'arrangement': 'arranger',
        'recording': 'artist'
    };
    const requiredRole = roleMap[order.service_type];

    useEffect(() => {
        const fetchSpecialists = async () => {
            if (!requiredRole) return;
            try {
                const data = await authApi.getSpecialistsByRole(requiredRole);
                setSpecialists(data);
                if (data.length > 0) {
                    setSelectedSpecialist(data[0].id); // Chọn người đầu tiên làm mặc định
                }
            } catch (error) {
                console.error("Failed to fetch specialists", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSpecialists();
    }, [requiredRole]);

    const handleSubmit = () => {
        if (!selectedSpecialist) {
            alert("Vui lòng chọn một chuyên viên.");
            return;
        }
        onAssign(order, selectedSpecialist);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Giao việc cho đơn hàng #{order.id}</h2>
                <p><strong>Dịch vụ:</strong> {order.service_type}</p>
                <div className="form-group">
                    <label>Chọn chuyên viên ({requiredRole}):</label>
                    {loading ? (
                        <p>Đang tải danh sách...</p>
                    ) : (
                        <select
                            value={selectedSpecialist}
                            onChange={(e) => setSelectedSpecialist(e.target.value)}
                            className="form-select"
                        >
                            {specialists.length > 0 ? (
                                specialists.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))
                            ) : (
                                <option disabled>Không có chuyên viên phù hợp</option>
                            )}
                        </select>
                    )}
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="form-button secondary">Hủy</button>
                    <button onClick={handleSubmit} className="form-button" disabled={!selectedSpecialist || loading}>Xác nhận</button>
                </div>
            </div>
        </div>
    );
};


const CoordinatorDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // State để quản lý modal

    const fetchOrders = useCallback(async () => {
        try {
            const data = await orderApi.getUnassignedOrders();
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleAssignTask = async (order, specialistId) => {
        const roleMap = {
            'transcription': 'transcriber',
            'arrangement': 'arranger',
            'recording': 'artist'
        };
        try {
            const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
            await taskApi.createTask({
                order_id: order.id,
                assigned_to: specialistId,
                specialist_role: roleMap[order.service_type],
                deadline: deadlineDate.toISOString().slice(0, 19).replace('T', ' ')
            });
            await orderApi.updateOrderStatus(order.id, 'assigned');
            alert(`Đã giao việc cho đơn hàng #${order.id} thành công!`);
            setSelectedOrder(null); // Đóng modal
            fetchOrders(); // Tải lại danh sách đơn hàng
        } catch (error) {
            console.error("Failed to assign task:", error);
            alert("Giao việc thất bại!");
        }
    };

    if (loading) return <div className="page-container"><p>Đang tải danh sách đơn hàng mới...</p></div>;

    return (
        <div className="page-container" style={{ alignItems: 'flex-start' }}>
            <h2>Các Đơn Hàng Đang Chờ Phân Công</h2>
            {orders.length === 0 ? (
                <p>Không có đơn hàng mới nào.</p>
            ) : (
                <table className="coordinator-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Dịch Vụ</th>
                            <th>Mô Tả</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>{order.service_type}</td>
                                <td>{order.description}</td>
                                <td>
                                    <button onClick={() => setSelectedOrder(order)} className="form-button">Giao việc</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {selectedOrder && (
                <AssignTaskModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onAssign={handleAssignTask}
                />
            )}
        </div>
    );
};

export default CoordinatorDashboard;