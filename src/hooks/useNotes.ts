import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesService } from '@/services/notes.service';
import type { ClinicalNoteEnriched, ConfirmNoteRequest, NoteType } from '@/types/domain';

export function usePatientNotes(patientId: string) {
  return useQuery({
    queryKey: ['notes', patientId] as const,
    queryFn: (): Promise<ClinicalNoteEnriched[]> => notesService.getPatientNotes(patientId),
    staleTime: 60_000,
    enabled: !!patientId,
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      noteType,
      content,
    }: {
      patientId: string;
      noteType: NoteType;
      content: string;
    }) => notesService.addNote(patientId, noteType, content),
    onSuccess: (_result, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
    },
  });
}

export function useConfirmNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: ConfirmNoteRequest;
    }) => notesService.confirmNote(patientId, data),
    onSuccess: (_result, { patientId }) => {
      // Invalidate all caches that the server populates after confirmation
      void queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Both query key shapes used for the patient detail screen
      void queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
