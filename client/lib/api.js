import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token from localStorage if needed
api.interceptors.request.use(
    (config) => {
        // For cases where we need to send token in headers (fallback)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 errors (unauthorized) - but not for logout endpoint
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/logout')) {
            // Clear any stored tokens
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        return Promise.reject(error);
    }
);

// Auth API functions
export const authAPI = {
    // Register new user
    register: (userData) => api.post('/auth/register', userData),

    // Login user
    login: (credentials) => api.post('/auth/login', credentials),

    // Get current user
    getMe: () => api.get('/auth/me'),

    // Logout user
    logout: () => api.post('/auth/logout'),

    // Forgot password
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

    // Reset password
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// User API functions
export const userAPI = {
    // Get all users (admin/superadmin only)
    getAllUsers: () => api.get('/users'),

    // Get single user
    getUser: (id) => api.get(`/users/${id}`),

    // Update user role
    updateUserRole: (id, role) => api.patch(`/users/${id}/role`, { role }),

    // Update user status
    updateUserStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),

    // Delete user (superadmin only)
    deleteUser: (id) => api.delete(`/users/${id}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
