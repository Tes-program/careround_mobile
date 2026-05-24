import { apiClient } from '../lib/axios';
import type { PrescriptionEnriched } from '../types/domain';

export interface CreatePrescriptionRequest {
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  clinicalNoteId?: string;
}

export interface UpdatePrescriptionRequest {
  drugName?: string;
  dose?: string;
  route?: string;
  frequencyString?: string;
  frequencyHours?: number;
  totalDoses?: number;
}

export const prescriptionsService = {
  getPatientPrescriptions: async (patientId: string): Promise<PrescriptionEnriched[]> => {
    const response = await apiClient.get<PrescriptionEnriched[]>(
      `/patients/${patientId}/prescriptions`,
    );
    return response.data;
  },

  addPrescription: async (
    patientId: string,
    data: CreatePrescriptionRequest,
  ): Promise<PrescriptionEnriched> => {
    const response = await apiClient.post<PrescriptionEnriched>(
      `/patients/${patientId}/prescriptions`,
      data,
    );
    return response.data;
  },

  updatePrescription: async (
    prescriptionId: string,
    data: UpdatePrescriptionRequest,
  ): Promise<PrescriptionEnriched> => {
    const response = await apiClient.put<PrescriptionEnriched>(
      `/prescriptions/${prescriptionId}`,
      data,
    );
    return response.data;
  },

  discontinuePrescription: async (prescriptionId: string): Promise<PrescriptionEnriched> => {
    const response = await apiClient.put<PrescriptionEnriched>(
      `/prescriptions/${prescriptionId}/discontinue`,
    );
    return response.data;
  },
};
