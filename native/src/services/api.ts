import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../utils/constants';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.error('Network Error: Check if the backend is running and accessible at:', API_URL);
    }
    return Promise.reject(error);
  },
);

export default api;
