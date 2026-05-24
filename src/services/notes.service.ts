import { apiClient } from '../lib/axios';
import type { ClinicalNote, NoteType } from '../types/domain';

export type NoteWithAuthor = ClinicalNote & {
  authorName: string;
  authorRole: string;
};

export interface ConfirmNoteRequest {
  content: string;
  prescriptions?: Array<{
    drugName: string;
    dose: string;
    route: string;
    frequencyString: string;
    frequencyHours: number;
    totalDoses: number;
    startTime: string;
  }>;
}

export const notesService = {
  getPatientNotes: async (patientId: string): Promise<NoteWithAuthor[]> => {
    const response = await apiClient.get<NoteWithAuthor[]>(`/patients/${patientId}/notes`);
    return response.data;
  },

  addNote: async (
    patientId: string,
    noteType: NoteType,
    content: string,
  ): Promise<NoteWithAuthor> => {
    const response = await apiClient.post<NoteWithAuthor>(`/patients/${patientId}/notes`, {
      noteType,
      content,
    });
    return response.data;
  },

  confirmNote: async (patientId: string, data: ConfirmNoteRequest): Promise<void> => {
    await apiClient.post(`/patients/${patientId}/notes/confirm`, data);
  },
};
