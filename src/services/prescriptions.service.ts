import { apiClient } from '../lib/axios';
import type { Prescription } from '../types/domain';

export type PrescriptionWithConfirmer = Prescription & { confirmedByName: string };

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
  getPatientPrescriptions: async (patientId: string): Promise<PrescriptionWithConfirmer[]> => {
    const response = await apiClient.get<PrescriptionWithConfirmer[]>(
      `/patients/${patientId}/prescriptions`,
    );
    return response.data;
  },

  addPrescription: async (
    patientId: string,
    data: CreatePrescriptionRequest,
  ): Promise<Prescription> => {
    const response = await apiClient.post<Prescription>(
      `/patients/${patientId}/prescriptions`,
      data,
    );
    return response.data;
  },

  updatePrescription: async (
    prescriptionId: string,
    data: UpdatePrescriptionRequest,
  ): Promise<Prescription> => {
    const response = await apiClient.put<Prescription>(`/prescriptions/${prescriptionId}`, data);
    return response.data;
  },

  discontinuePrescription: async (prescriptionId: string): Promise<void> => {
    await apiClient.delete(`/prescriptions/${prescriptionId}/discontinue`);
  },
};
