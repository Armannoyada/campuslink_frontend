import axios from 'axios';
import { useUserAuthStore } from '@/store/user-auth.store';

export const userApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

userApi.interceptors.request.use((config) => {
  const token = useUserAuthStore.getState().accessToken;
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

userApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute = originalRequest.url?.includes('/auth/user/login') || 
                        originalRequest.url?.includes('/auth/signup') ||
                        originalRequest.url?.includes('/auth/user/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => userApi(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = useUserAuthStore.getState();
        const res = await userApi.post('/auth/user/refresh', refreshToken ? { refreshToken } : {});
        const newAccessToken = res.data?.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken;
        if (newAccessToken) {
          useUserAuthStore.getState().setTokens(newAccessToken, newRefreshToken ?? refreshToken ?? '');
        }
        processQueue(null);
        return userApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useUserAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
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
