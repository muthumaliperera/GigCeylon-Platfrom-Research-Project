import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/*interface AppAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean; // For potential token refresh implementation
}
  */

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('401 error - token might be expired or invalid');
      // Automatic token cleanup. Navigation/redirection is handled by callers.
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_) {
        // ignore storage errors
      }
    }
    return Promise.reject(error);
  }
);