import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../types/domain';
import type { ApiResponse, JwtResponse } from '../types/domain';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Silent Refresh State ────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor ────────────────────────────────────────────────────

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap ApiResponse envelope when present
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'success' in response.data
    ) {
      response.data = (response.data as ApiResponse<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) throw new Error('No refresh token available');

      // Use bare axios (not apiClient) to avoid recursive interceptor trigger
      const { data } = await axios.post<ApiResponse<JwtResponse>>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken;

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
      ]);

      // Dynamic import avoids circular dependency at module load time
      const { useAuthStore } = await import('../store/auth.store');
      useAuthStore.getState().setAccessToken(newAccessToken);

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      const { useAuthStore } = await import('../store/auth.store');
      await useAuthStore.getState().clearAuth();

      const { router } = await import('expo-router');
      router.replace('/login');

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
