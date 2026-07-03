import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wealthmap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log errors but don't auto-redirect - let components handle it
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error details for debugging
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token invalid or expired');
    }
    
    if (error.response?.status === 403) {
      console.error('403 Forbidden - Access Denied');
      console.error('Error details:', error.response?.data);
    }
    
    // Don't auto-logout/redirect - let the user see the error
    return Promise.reject(error);
  }
);

export default api;
