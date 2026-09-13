import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login or trigger context logout)
      // We will trigger a custom event that the AuthContext can listen to
      if (
        error.config &&
        !error.config.url?.includes('/auth/logout') &&
        !error.config.url?.includes('/auth/login')
      ) {
        window.dispatchEvent(new Event('unauthorized'));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
