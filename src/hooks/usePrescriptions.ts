import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  prescriptionsService,
  type CreatePrescriptionRequest,
  type UpdatePrescriptionRequest,
} from '@/services/prescriptions.service';
import type { PrescriptionEnriched } from '@/types/domain';

export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: ['prescriptions', patientId] as const,
    queryFn: (): Promise<PrescriptionEnriched[]> =>
      prescriptionsService.getPatientPrescriptions(patientId),
    staleTime: 30_000,
    enabled: !!patientId,
  });
}

export function useAddPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: CreatePrescriptionRequest;
    }) => prescriptionsService.addPrescription(patientId, data),
    onSuccess: (_result, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
    },
  });
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      prescriptionId,
      data,
    }: {
      prescriptionId: string;
      patientId: string;
      data: UpdatePrescriptionRequest;
    }) => prescriptionsService.updatePrescription(prescriptionId, data),
    onSuccess: (_result, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
    },
  });
}

export function useDiscontinuePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      prescriptionId,
    }: {
      prescriptionId: string;
      patientId: string;
    }) => prescriptionsService.discontinuePrescription(prescriptionId),
    onSuccess: (_result, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
    },
  });
}
