import { AxiosError } from 'axios';
import { apiClient } from '../lib/axios';
import type {
  AiProcessingResult,
  ClinicalNoteEnriched,
  ConfirmNoteRequest,
  NoteType,
} from '../types/domain';

export interface AddNoteRequest {
  noteType: NoteType;
  content: string;
}

export const notesService = {
  getPatientNotes: async (patientId: string): Promise<ClinicalNoteEnriched[]> => {
    const response = await apiClient.get<ClinicalNoteEnriched[]>(`/patients/${patientId}/notes`);
    return response.data;
  },

  addNote: async (
    patientId: string,
    noteType: NoteType,
    content: string,
  ): Promise<ClinicalNoteEnriched> => {
    const response = await apiClient.post<ClinicalNoteEnriched>(`/patients/${patientId}/notes`, {
      noteType,
      content,
    });
    return response.data;
  },

  processVoiceNote: async (
    audioUri: string,
    patientId: string,
  ): Promise<AiProcessingResult> => {
    const extension = audioUri.split('.').pop() ?? 'm4a';
    const mimeType = extension === 'm4a' ? 'audio/m4a' : `audio/${extension}`;

    const formData = new FormData();
    // React Native FormData file object — cast needed because RN's FormData
    // accepts { uri, type, name } but the TypeScript type expects Blob.
    formData.append('audio', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${extension}`,
    } as unknown as Blob);
    formData.append('patient_id', patientId);
    formData.append('current_time', new Date().toISOString());

    const response = await apiClient.post<AiProcessingResult>(
      '/ai/process-voice-note',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000, // AI processing can take up to 30 s
      },
    );
    return response.data;
  },

  confirmNote: async (
    patientId: string,
    data: ConfirmNoteRequest,
  ): Promise<ClinicalNoteEnriched> => {
    const response = await apiClient.post<ClinicalNoteEnriched>(
      `/patients/${patientId}/notes/confirm`,
      data,
    );
    return response.data;
  },
};

// ── Helper exported for ProcessingScreen ─────────────────────────────────────

export function voiceNoteErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (!err.response) {
      return 'No internet connection. Please check your network and try again.';
    }
    if (err.response.status === 503) {
      return 'The AI service is warming up. Please wait a moment and try again.';
    }
  }
  return 'Processing failed. Please try again.';
}
