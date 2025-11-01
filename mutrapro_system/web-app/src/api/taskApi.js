import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';

const API_URL = getApiUrl('task'); // Địa chỉ của Task Service (qua API Gateway hoặc trực tiếp)

const createTask = async (taskData) => {
    try {
        const endpoint = API_URL.includes('/api/tasks') ? `${API_URL}` : `${API_URL}/tasks`;
        const response = await axios.post(endpoint, taskData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getTasksBySpecialist = async (specialistId) => {
    try {
        const endpoint = API_URL.includes('/api/tasks') ? `${API_URL}/specialist/${specialistId}` : `${API_URL}/tasks/specialist/${specialistId}`;
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updateTaskStatus = async (taskId, status) => {
    try {
        const endpoint = API_URL.includes('/api/tasks') ? `${API_URL}/${taskId}/status` : `${API_URL}/tasks/${taskId}/status`;
        const response = await axios.put(endpoint, { status });
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