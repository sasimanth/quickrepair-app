import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'https://fixvo-backend.onrender.com/api';

// Ensure the API URL has the /api suffix, as backend routes are prefixed with /api
if (API_URL && !API_URL.endsWith('/api') && !API_URL.endsWith('/api/')) {
  API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 25000, // 25 seconds to accommodate Render backend cold starts
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown';

    if (status === 401) {
      console.warn('Unauthorized API response (401). Token may be expired.');
    }

    // Add a Sentry breadcrumb so failed API calls appear in error traces.
    // Never log Authorization headers or response body (may contain tokens/PII).
    try {
      import('../utils/sentryFrontend.js').then(({ Sentry }) => {
        Sentry.addBreadcrumb({
          category: 'api',
          message: `API ${error.config?.method?.toUpperCase() || 'REQUEST'} ${url} → ${status || 'network error'}`,
          level: status >= 500 ? 'error' : 'warning',
          data: { url, status }
        });
      });
    } catch { /* no-op */ }

    return Promise.reject(error);
  }
);

export default api;
