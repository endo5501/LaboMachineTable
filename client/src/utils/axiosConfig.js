import axios from 'axios';

// Create an axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
});

// Add a request interceptor to add /api prefix if not already present
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if the URL already starts with /api
    if (!config.url.startsWith('/api')) {
      config.url = `/api${config.url}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
