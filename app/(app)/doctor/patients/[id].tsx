import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PatientDetailShell } from '@/components/patients/PatientDetailShell';
import { ScreenErrorBoundary } from '@/components/errors/ScreenErrorBoundary';

export default function DoctorPatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenErrorBoundary>
      <PatientDetailShell patientId={id ?? ''} role="DOCTOR" />
    </ScreenErrorBoundary>
  );
}
