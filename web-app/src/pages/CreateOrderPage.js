// web-app/src/pages/CreateOrderPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import orderApi from '../api/orderApi';
import fileApi from '../api/fileApi';

const CreateOrderPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [serviceType, setServiceType] = useState('transcription');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null); // State để lưu file người dùng chọn
    const [loading, setLoading] = useState(false);
    
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        setLoading(true);
        try {
            // Bước 1: Tạo đơn hàng trước
            const orderData = {
                customer_id: user.id,
                service_type: serviceType,
                description: description,
                price: 0 
            };
            const newOrder = await orderApi.createOrder(orderData);
            
            // Bước 2: Nếu có file, upload file với ID của đơn hàng vừa tạo
            if (file) {
                // 'audio' là file_type chung cho file yêu cầu ban đầu
                await fileApi.uploadFile(file, newOrder.id, user.id, 'audio');
            }

            toast.success('Tạo đơn hàng thành công!');
            navigate('/orders/history'); // Chuyển đến trang lịch sử đơn hàng để xem ngay

        } catch (err) {
            toast.error('Tạo đơn hàng thất bại. Vui lòng thử lại.');
            console.error("Create order failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="form-card">
                <h2>Tạo Yêu Cầu Dịch Vụ Mới</h2>
                <div className="form-group">
                    <label>Chọn loại dịch vụ</label>
                    <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                        <option value="transcription">Ký âm (Transcription)</option>
                        <option value="arrangement">Hòa âm, Phối khí (Arrangement)</option>
                        <option value="recording">Thu âm (Recording)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Mô tả chi tiết yêu cầu</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="5"
                        placeholder="Ví dụ: Em cần ký âm bài hát 'See Tình' của Hoàng Thùy Linh..."
                    />
                </div>
                
                <div className="form-group">
                    <label>Tải lên tệp âm thanh (MP3, MP4, WAV...)</label>
                    <input 
                        type="file" 
                        onChange={handleFileChange}
                        accept=".mp3,.mp4,.wav,.m4a" // Giới hạn chỉ cho chọn file nhạc
                        className="file-input" // Thêm class để có thể style riêng nếu cần
                    />
                </div>

                <button type="submit" className="form-button" disabled={loading}>
                    {loading ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu'}
                </button>
            </form>
        </div>
    );
};

export default CreateOrderPage;