import axios from 'axios';
import { insforge } from './insforge';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const { data, error } = await insforge.auth.getSession();
    if (data?.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch (err) {
    console.error('Failed to get token:', err);
  }
  return config;
});

export default api;
