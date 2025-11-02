// File: web-app/src/pages/AdminUserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import authApi from '../api/authApi';
import UserEditModal from '../components/UserEditModal';
import './AdminUserManagementPage.css'; // Sẽ tạo file CSS sau

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State cho modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // User đang được chọn để edit

    // Hàm tải dữ liệu, dùng useCallback
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await authApi.adminGetAllUsers();
            setUsers(data);
        } catch (err) {
            setError('Không thể tải danh sách người dùng.');
            toast.error('Không thể tải danh sách người dùng.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Tải dữ liệu khi component mount
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Hàm mở modal "Tạo mới"
    const handleAddNew = () => {
        setCurrentUser(null); // Không có user nào được chọn
        setIsModalOpen(true);
    };

    // Hàm mở modal "Chỉnh sửa"
    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    // Hàm xử lý khi modal được lưu
    const handleSave = () => {
        fetchUsers(); // Tải lại danh sách
    };

    // Hàm xử lý xóa
    const handleDelete = async (user) => {
        if (window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}" (ID: ${user.id})?`)) {
            try {
                await authApi.adminDeleteUser(user.id);
                toast.success('Xóa người dùng thành công!');
                fetchUsers(); // Tải lại danh sách
            } catch (error) {
                toast.error(error.response?.data?.error || 'Xóa thất bại.');
            }
        }
    };

    if (error) return <div className="page-container"><h1>{error}</h1></div>;

    return (
        <>
            <div className="page-container admin-user-management">
                <div className="admin-header">
                    <h1>Quản Lý Người Dùng</h1>
                    <button onClick={handleAddNew} className="form-button">
                        Thêm Người Dùng Mới
                    </button>
                </div>

                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : (
                    <div className="dashboard-features" style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên</th>
                                    <th>Email</th>
                                    <th>Vai trò (Role)</th>
                                    <th>Ngày Tạo</th>
                                    <th>Hành Động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`status-badge role-${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="action-buttons">
                                            <button onClick={() => handleEdit(user)} className="form-button secondary">
                                                Sửa
                                            </button>
                                            <button onClick={() => handleDelete(user)} className="form-button danger">
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal để Thêm/Sửa */}
            {isModalOpen && (
                <UserEditModal
                    userToEdit={currentUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

export default AdminUserManagementPage;