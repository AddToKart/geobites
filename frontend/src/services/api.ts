import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_URL } from '../utils/constants';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        config.headers.Authorization = `Bearer ${urlToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/mock-payment') {
      window.location.href = '/login';
    }

    // Enhance error with user-friendly message
    let message = 'An error occurred';

    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;
      if (typeof data.message === 'string') {
        message = data.message;
      }
    }

    if (!error.message.includes('user-friendly')) {
      (error as unknown as Record<string, unknown>).userMessage = message;
    }

    return Promise.reject(error);
  },
);

export default api;
