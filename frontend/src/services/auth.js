import api from './api';
import { getDeviceDetails } from './pushNotification';
export { api };

export const login = async (credentials) => {
  const deviceDetails = getDeviceDetails();
  const response = await api.post('/auth/login', {
    ...credentials,
    ...deviceDetails
  });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (userData) => {
  const deviceDetails = getDeviceDetails();
  const response = await api.post('/auth/signup', {
    ...userData,
    ...deviceDetails
  });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = async () => {
  try {
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      await api.post('/auth/logout', { deviceId });
    }
  } catch (err) {
    console.error('Backend logout session cleanup failed:', err);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};
