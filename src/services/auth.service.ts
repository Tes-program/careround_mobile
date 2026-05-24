import { apiClient } from '../lib/axios';
import type { JwtResponse, User } from '../types/domain';

export const authService = {
  login: async (hospitalCode: string, email: string, password: string): Promise<JwtResponse> => {
    const response = await apiClient.post<JwtResponse>('/auth/login', {
      hospitalCode,
      email,
      password,
    });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<JwtResponse> => {
    const response = await apiClient.post<JwtResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/users/me/password', { currentPassword, newPassword });
  },

  updateDeviceToken: async (fcmToken: string): Promise<void> => {
    await apiClient.put('/users/me/device-token', { fcmToken });
  },
};
