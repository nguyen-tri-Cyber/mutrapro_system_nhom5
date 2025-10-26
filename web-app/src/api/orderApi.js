import axios from 'axios';

// Địa chỉ của Order Service
const API_URL = 'http://localhost:3002';

/**
 * Tạo một đơn hàng mới.
 * @param {object} orderData - Dữ liệu của đơn hàng, ví dụ: { customer_id, service_type, description, price }
 * @returns {Promise<object>} Dữ liệu phản hồi từ server.
 */
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

const orderApi = {
    createOrder,
    getUnassignedOrders,
    updateOrderStatus,
    getOrdersByCustomer,
    getOrderById,
    payForOrder
};

export default orderApi;