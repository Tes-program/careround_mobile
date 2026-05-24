import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vitalsService, type RecordVitalsRequest } from '@/services/vitals.service';
import type { PatientVitalsEnriched } from '@/types/domain';

export function usePatientVitals(patientId: string) {
  return useQuery({
    queryKey: ['vitals', patientId] as const,
    queryFn: (): Promise<PatientVitalsEnriched[]> => vitalsService.getPatientVitals(patientId),
    staleTime: 30_000,
    enabled: !!patientId,
  });
}

export function useRecordVitals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: RecordVitalsRequest;
    }) => vitalsService.recordVitals(patientId, data),
    onSuccess: (_result, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['vitals', patientId] });
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    },
  });
}
