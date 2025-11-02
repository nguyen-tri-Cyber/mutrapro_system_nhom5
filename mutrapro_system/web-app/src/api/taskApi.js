import axios from 'axios';

const API_URL = 'http://localhost:3003'; // Địa chỉ của Task Service

const createTask = async (taskData) => {
    try {
        const response = await axios.post(`${API_URL}/tasks`, taskData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getTasksBySpecialist = async (specialistId) => {
    try {
        const response = await axios.get(`${API_URL}/tasks/specialist/${specialistId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updateTaskStatus = async (taskId, status) => {
    try {
        const response = await axios.put(`${API_URL}/tasks/${taskId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const taskApi = {
    createTask,
    getTasksBySpecialist,
    updateTaskStatus 
};

export default taskApi;