/**
 * Nurse voice-recording flow controller.
 *
 * Steps: recording → processing (1 step: Transcribing) → review
 *
 * Differences from the doctor flow:
 *  - ProcessingScreen receives steps={['Transcribing your note']} (1 step only)
 *  - ReviewScreen is NurseReviewScreen (plain text, no SOAP / prescriptions)
 *
 * Android back button behaviour:
 *   recording  → cancel confirmation (handled in RecordingScreen)
 *   processing → disabled (API in flight)
 *   review     → back to recording step
 */
import React, { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePatient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui';
import { patientFullName } from '@/utils/format';
import { RecordingScreen } from '@/components/recording/RecordingScreen';
import { ProcessingScreen } from '@/components/recording/ProcessingScreen';
import { NurseReviewScreen } from '@/components/recording/NurseReviewScreen';
import type { AiProcessingResult } from '@/types/domain';

type RecordStep = 'recording' | 'processing' | 'review';

const NURSE_PROCESSING_STEPS = ['Transcribing your note'];

export default function NurseRecordFlowScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = id ?? '';

  const { data: patient } = usePatient(patientId);
  const patientName = patient ? patientFullName(patient) : '';
  const bedNumber = patient?.bedNumber;

  const [step, setStep] = useState<RecordStep>('recording');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiProcessingResult | null>(null);

  const { showToast, toastProps } = useToast();

  // ── Android back button ────────────────────────────────────────────────────
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'processing') {
        return true; // Disable during API call
      }
      if (step === 'review') {
        handleReviewBack();
        return true;
      }
      return false; // Let RecordingScreen handle via cancel sheet
    });
    return () => subscription.remove();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStop(uri: string) {
    setAudioUri(uri);
    setStep('processing');
  }

  function handleProcessingDone(result: AiProcessingResult) {
    setAiResult(result);
    setStep('review');
  }

  function handleProcessingError(message: string) {
    showToast({ message, type: 'error' });
    setStep('recording');
  }

  function handleSaved() {
    router.back();
  }

  function handleReviewBack() {
    setAudioUri(null);
    setAiResult(null);
    setStep('recording');
  }

  return (
    <View style={{ flex: 1 }}>
      {step === 'recording' && (
        <RecordingScreen
          patientId={patientId}
          patientName={patientName}
          bedNumber={bedNumber}
          onStop={handleStop}
          onCancel={() => router.back()}
        />
      )}

      {step === 'processing' && audioUri && (
        <ProcessingScreen
          audioUri={audioUri}
          patientId={patientId}
          steps={NURSE_PROCESSING_STEPS}
          onDone={handleProcessingDone}
          onError={handleProcessingError}
        />
      )}

      {step === 'review' && aiResult && (
        <NurseReviewScreen
          patientId={patientId}
          patientName={patientName}
          bedNumber={bedNumber}
          transcription={aiResult.rawTranscription}
          onSaved={handleSaved}
          onBack={handleReviewBack}
        />
      )}

      <Toast {...toastProps} />
    </View>
  );
}
