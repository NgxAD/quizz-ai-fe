import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to every request
axiosClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Explicitly remove Authorization header if no token
      delete config.headers.Authorization;
    }
    // Only set Content-Type if not FormData
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear cookies and redirect to login
      Cookies.remove('accessToken');
      Cookies.remove('user');
      delete axiosClient.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export a method to clear auth headers
export const clearAuthHeaders = () => {
  Cookies.remove('accessToken');
  Cookies.remove('user');
  delete axiosClient.defaults.headers.common['Authorization'];
};

export default axiosClient;
