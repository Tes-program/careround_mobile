import { apiClient } from '../lib/axios';
import type { MedicationTaskEnriched } from '../types/domain';

export const tasksService = {
  getMedicationTasks: async (params?: { wardId?: string }): Promise<MedicationTaskEnriched[]> => {
    const response = await apiClient.get<MedicationTaskEnriched[]>('/medication-tasks', { params });
    return response.data;
  },

  completeTask: async (
    taskId: string,
    actualDoseGiven?: string,
  ): Promise<MedicationTaskEnriched> => {
    const response = await apiClient.put<MedicationTaskEnriched>(
      `/medication-tasks/${taskId}/complete`,
      actualDoseGiven ? { actualDoseGiven } : {},
    );
    return response.data;
  },
};
