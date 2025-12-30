export const API_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    ENDPOINTS: {
        EMPRESAS: '/api/empresas',
        HEALTH: '/api/health'
    }
};

// Axios instance pre-configurada
import axios from 'axios';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para logging
api.interceptors.request.use(
    config => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    error => {
        console.error(`API Error: ${error.message}`, error.response?.data);
        return Promise.reject(error);
    }
);

export default api;
