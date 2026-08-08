import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Ensure the API URL has the /api suffix, as backend routes are prefixed with /api
if (API_URL && !API_URL.endsWith('/api') && !API_URL.endsWith('/api/')) {
  API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 6000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
