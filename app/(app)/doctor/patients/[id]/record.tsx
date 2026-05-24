/**
 * Flow controller for the doctor voice-recording flow.
 * Rendered as a full-screen modal; manages the three-step sequence:
 *   recording → processing → review
 *
 * Android back button behaviour:
 *   recording  → opens cancel confirmation sheet (handled inside RecordingScreen)
 *   processing → back is disabled (API call in flight)
 *   review     → returns to recording step
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
import { ReviewScreen } from '@/components/recording/ReviewScreen';
import type { AiProcessingResult } from '@/types/domain';

type RecordStep = 'recording' | 'processing' | 'review';

const DOCTOR_PROCESSING_STEPS = [
  'Transcribing',
  'Structuring\nnote',
  'Extracting\nprescriptions',
];

export default function RecordFlowScreen() {
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
        // Disable back during API call
        return true;
      }
      if (step === 'review') {
        // Return to recording step
        handleReviewBack();
        return true;
      }
      // On 'recording' step: let RecordingScreen's own back handler (cancel sheet) deal with it.
      // We return false so the bottom sheet can intercept it if open.
      return false;
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
    // Return to recording step so the doctor can re-record
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
          steps={DOCTOR_PROCESSING_STEPS}
          onDone={handleProcessingDone}
          onError={handleProcessingError}
        />
      )}

      {step === 'review' && aiResult && (
        <ReviewScreen
          patientId={patientId}
          patientName={patientName}
          bedNumber={bedNumber}
          result={aiResult}
          onSaved={handleSaved}
          onBack={handleReviewBack}
        />
      )}

      {/* Toast sits above all steps for processing errors */}
      <Toast {...toastProps} />
    </View>
  );
}
