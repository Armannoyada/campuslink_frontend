import axios from 'axios';
import { useOpsAuthStore } from '@/store/ops-auth.store';

export const opsApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

opsApi.interceptors.request.use((config) => {
  const token = useOpsAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(undefined);
  });
  failedQueue = [];
}

opsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => opsApi(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = useOpsAuthStore.getState();
        const res = await opsApi.post('/auth/ops/refresh', refreshToken ? { refreshToken } : {});
        const newAccessToken = res.data?.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken;
        if (newAccessToken) {
          useOpsAuthStore.getState().setTokens(newAccessToken, newRefreshToken ?? refreshToken ?? '');
        }
        processQueue(null);
        return opsApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useOpsAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/operations/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
