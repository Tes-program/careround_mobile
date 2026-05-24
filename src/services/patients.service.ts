import { apiClient } from '../lib/axios';
import type { Patient } from '../types/domain';

export const patientsService = {
  getPatients: async (params?: { wardId?: string; status?: string }): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>('/patients', { params });
    return response.data;
  },

  getPatient: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },
};
