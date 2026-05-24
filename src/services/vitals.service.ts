import { apiClient } from '../lib/axios';
import type { PatientVitals } from '../types/domain';

export interface RecordVitalsRequest {
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  recordedAt?: string;
}

export type VitalsWithNurse = PatientVitals & { recordedByName: string };

export const vitalsService = {
  getPatientVitals: async (patientId: string): Promise<VitalsWithNurse[]> => {
    const response = await apiClient.get<VitalsWithNurse[]>(`/patients/${patientId}/vitals`);
    return response.data;
  },

  recordVitals: async (patientId: string, data: RecordVitalsRequest): Promise<VitalsWithNurse> => {
    const response = await apiClient.post<VitalsWithNurse>(`/patients/${patientId}/vitals`, data);
    return response.data;
  },
};
