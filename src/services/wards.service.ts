import { apiClient } from '../lib/axios';
import type { Ward } from '../types/domain';

export const wardsService = {
  getWards: async (): Promise<Ward[]> => {
    const response = await apiClient.get<Ward[]>('/wards');
    return response.data;
  },
};
