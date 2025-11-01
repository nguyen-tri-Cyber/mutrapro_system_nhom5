import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';

// Địa chỉ của Order Service (qua API Gateway hoặc trực tiếp)
const API_URL = getApiUrl('order');

const createOrder = async (orderData) => {
    try {
        // API_URL đã bao gồm /api/orders từ Gateway hoặc /orders trực tiếp
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}` : `${API_URL}/orders`;
        const response = await axios.post(endpoint, orderData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getUnassignedOrders = async () => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/unassigned` : `${API_URL}/orders/unassigned`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updateOrderStatus = async (orderId, status) => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/${orderId}/status` : `${API_URL}/orders/${orderId}/status`;
        const response = await axios.put(endpoint, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getOrdersByCustomer = async (customerId) => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/customer/${customerId}` : `${API_URL}/orders/customer/${customerId}`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getOrderById = async (orderId) => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/${orderId}` : `${API_URL}/orders/${orderId}`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const payForOrder = async (orderId, paymentData) => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/${orderId}/pay` : `${API_URL}/orders/${orderId}/pay`;
        const response = await axios.post(endpoint, paymentData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ======================= HÀM MỚI CHO FEEDBACK =======================
const getFeedbackForOrder = async (orderId) => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/${orderId}/feedback` : `${API_URL}/orders/${orderId}/feedback`;
        const response = await axios.get(endpoint);
        return response.data; // Should return { hasFeedback: true/false }
    } catch (error) {
        throw error;
    }
};

const submitFeedback = async (orderId, feedbackData) => {
    try {
        const endpoint = API_URL.includes('/api/orders') ? `${API_URL}/${orderId}/feedback` : `${API_URL}/orders/${orderId}/feedback`;
        const response = await axios.post(endpoint, feedbackData);
        return response.data;
    } catch (error) {
        throw error;
    }
};
// ======================================================================

// Hàm mới để gọi API thống kê
const getStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const orderApi = {
    createOrder,
    getUnassignedOrders,
    updateOrderStatus,
    getOrdersByCustomer,
    getOrderById,
    payForOrder,
    getFeedbackForOrder,
    submitFeedback,
    getStats      
};

export default orderApi;