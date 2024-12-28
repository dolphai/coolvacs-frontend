import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

export const checkAuth = async () => {
  try {
    const response = await api.get('/api/auth/check');
    return response.data.authenticated;
  } catch {
    return false;
  }
};

export const verifyOTP = async (otp, userId) => {
  const response = await api.post('/api/auth/verify-otp', { 
    otp, 
    userId,
    timestamp: new Date().toISOString() // Add timestamp for additional security
  });
  return response.data;
};

export const resendOTP = async (userId) => {
  const response = await api.post('/api/auth/resend-otp', { userId });
  return response.data;
};

export default api;
