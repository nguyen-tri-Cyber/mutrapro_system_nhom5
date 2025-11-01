// web-app/src/api/fileApi.js
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';

const API_URL = getApiUrl('file'); // Địa chỉ của File Service (qua API Gateway hoặc trực tiếp)

/**
 * Tải một file lên server.
 * @param {File} file - Đối tượng file được chọn từ input.
 * @param {number} orderId - ID của đơn hàng liên quan.
 * @param {number} uploaderId - ID của người tải lên.
 * @param {string} fileType - Loại file ('notation', 'mix', 'audio').
 * @returns {Promise<object>}
 */
const uploadFile = async (file, orderId, uploaderId, fileType) => {
    // Dùng FormData để gửi file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('order_id', orderId);
    formData.append('uploader_id', uploaderId);
    formData.append('file_type', fileType);

    try {
        const endpoint = API_URL.includes('/api/files') ? `${API_URL}/upload` : `${API_URL}/upload`;
        const response = await axios.post(endpoint, formData, {
            headers: {
                // Header này rất quan trọng khi gửi file
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        // Ném lỗi ra để component có thể bắt và xử lý
        throw error;
    }
};

const getFilesByOrder = async (orderId) => {
    try {
        const endpoint = API_URL.includes('/api/files') ? `${API_URL}/files/order/${orderId}` : `${API_URL}/files/order/${orderId}`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const fileApi = {
    uploadFile,
    getFilesByOrder,
};

export default fileApi;