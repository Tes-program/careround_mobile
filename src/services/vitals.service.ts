import { apiClient } from '../lib/axios';
import type { PatientVitalsEnriched } from '../types/domain';

export interface RecordVitalsRequest {
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  recordedAt?: string;
}

export const vitalsService = {
  getPatientVitals: async (patientId: string): Promise<PatientVitalsEnriched[]> => {
    const response = await apiClient.get<PatientVitalsEnriched[]>(`/patients/${patientId}/vitals`);
    return response.data;
  },

  recordVitals: async (
    patientId: string,
    data: RecordVitalsRequest,
  ): Promise<PatientVitalsEnriched> => {
    const response = await apiClient.post<PatientVitalsEnriched>(
      `/patients/${patientId}/vitals`,
      data,
    );
    return response.data;
  },
};
