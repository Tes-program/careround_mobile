import { useQuery } from '@tanstack/react-query';
import { patientsService } from '@/services/patients.service';
import type { Patient } from '@/types/domain';

export function usePatients(params?: { wardId?: string; status?: string }) {
  return useQuery({
    queryKey: ['patients', params] as const,
    queryFn: (): Promise<Patient[]> => patientsService.getPatients(params),
    staleTime: 30_000, // 30 seconds
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id] as const,
    queryFn: (): Promise<Patient> => patientsService.getPatient(id),
    staleTime: 60_000, // 60 seconds
    enabled: !!id,
  });
}
