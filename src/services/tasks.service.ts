import { apiClient } from '../lib/axios';
import type { MedicationTask } from '../types/domain';

export type TaskWithDetails = MedicationTask & {
  patientName: string;
  bedNumber?: string;
  drugName: string;
  dose: string;
  route: string;
  minutesOverdue?: number;
};

export const tasksService = {
  getMedicationTasks: async (params?: { wardId?: string }): Promise<TaskWithDetails[]> => {
    const response = await apiClient.get<TaskWithDetails[]>('/tasks/medication', { params });
    return response.data;
  },

  completeTask: async (taskId: string, actualDoseGiven?: string): Promise<void> => {
    await apiClient.post(`/tasks/medication/${taskId}/complete`, { actualDoseGiven });
  },
};
