// web-app/src/api/studioApi.js
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';

const API_URL = getApiUrl('studio'); // Địa chỉ của Studio Service (qua API Gateway hoặc trực tiếp)

// Lấy danh sách tất cả phòng thu
const getStudios = async () => {
    try {
        const endpoint = API_URL.includes('/api/studios') ? `${API_URL}` : `${API_URL}/studios`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Tạo một booking mới (cho Artist)
const createBooking = async (bookingData) => {
    try {
        const dataToSend = {
            ...bookingData,
            start_time: new Date(bookingData.start_time).toISOString().slice(0, 19).replace('T', ' '),
            end_time: new Date(bookingData.end_time).toISOString().slice(0, 19).replace('T', ' ')
        };
        const endpoint = API_URL.includes('/api/studios') ? `${API_URL}/bookings` : `${API_URL}/bookings`;
        const response = await axios.post(endpoint, dataToSend);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// === CÁC HÀM MỚI CHO ADMIN ===

// Lấy tất cả lịch đặt
const getAllBookings = async () => {
    try {
        const endpoint = API_URL.includes('/api/studios') ? `${API_URL}/bookings/all` : `${API_URL}/bookings/all`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Cập nhật trạng thái phòng thu
const updateStudioStatus = async (studioId, status) => {
    try {
        const endpoint = API_URL.includes('/api/studios') ? `${API_URL}/${studioId}/status` : `${API_URL}/studios/${studioId}/status`;
        const response = await axios.put(endpoint, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const studioApi = {
    getStudios,
    createBooking,
    getAllBookings,       // Mới
    updateStudioStatus,   // Mới
};

export default studioApi;