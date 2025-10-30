import axios from 'axios';

// Địa chỉ của Order Service
const API_URL = 'http://localhost:3002';

const createOrder = async (orderData) => {
    try {
        const response = await axios.post(`${API_URL}/orders`, orderData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getUnassignedOrders = async () => {
    try {
        const response = await axios.get(`${API_URL}/orders/unassigned`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${orderId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getOrdersByCustomer = async (customerId) => {
    try {
        const response = await axios.get(`${API_URL}/orders/customer/${customerId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getOrderById = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/orders/${orderId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const payForOrder = async (orderId, paymentData) => {
    try {
        const response = await axios.post(`${API_URL}/orders/${orderId}/pay`, paymentData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ======================= HÀM MỚI CHO FEEDBACK =======================
const getFeedbackForOrder = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/orders/${orderId}/feedback`);
        return response.data; // Should return { hasFeedback: true/false }
    } catch (error) {
        throw error;
    }
};

const submitFeedback = async (orderId, feedbackData) => {
    try {
        const response = await axios.post(`${API_URL}/orders/${orderId}/feedback`, feedbackData);
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