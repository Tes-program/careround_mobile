import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { notesService, voiceNoteErrorMessage } from '@/services/notes.service';
import { colors } from '@/constants/theme';
import type { AiProcessingResult } from '@/types/domain';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProcessingScreenProps {
  audioUri: string;
  patientId: string;
  /**
   * Labels for each processing step shown in the visual timeline.
   *
   * Doctor (3 steps): ['Transcribing', 'Structuring\nnote', 'Extracting\nprescriptions']
   * Nurse  (1 step):  ['Transcribing your note']
   */
  steps: string[];
  onDone: (result: AiProcessingResult) => void;
  onError: (message: string) => void;
}

// ── Animated pulsing dot for active step ─────────────────────────────────────

function PulsingDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.accent,
        },
        style,
      ]}
    />
  );
}

// ── Connector line ────────────────────────────────────────────────────────────

interface ConnectorProps {
  done: boolean;
}

function Connector({ done }: ConnectorProps) {
  const bg = useSharedValue<string>(colors.line);

  useEffect(() => {
    bg.value = withTiming(done ? colors.accent : colors.line, { duration: 400 });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({ backgroundColor: bg.value }));

  return (
    <Animated.View
      style={[
        {
          width: 40,
          height: 2,
          marginHorizontal: 4,
          alignSelf: 'center',
          marginTop: -18,
        },
        style,
      ]}
    />
  );
}

// ── Single step circle ────────────────────────────────────────────────────────

type StepState = 'completed' | 'active' | 'upcoming';

interface StepCircleProps {
  state: StepState;
  label: string;
}

function StepCircle({ state, label }: StepCircleProps) {
  const CIRCLE = 36;

  const circleStyle =
    state === 'completed'
      ? {
          width: CIRCLE,
          height: CIRCLE,
          borderRadius: CIRCLE / 2,
          backgroundColor: colors.accent,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        }
      : state === 'active'
        ? {
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            borderWidth: 2,
            borderColor: colors.accent,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
          }
        : {
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            borderWidth: 1.5,
            borderColor: colors.line,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
          };

  return (
    <View style={{ alignItems: 'center', width: 72 }}>
      <View style={circleStyle}>
        {state === 'completed' ? (
          <Text style={{ fontSize: 16, color: '#fff', fontFamily: 'IBMPlexSans_700Bold' }}>
            ✓
          </Text>
        ) : state === 'active' ? (
          <PulsingDot />
        ) : (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.line,
            }}
          />
        )}
      </View>

      <Text
        style={{
          fontSize: 11,
          fontFamily: state === 'active' ? 'IBMPlexSans_500Medium' : 'IBMPlexSans_400Regular',
          color: state === 'active' ? colors.accent : colors.muted,
          textAlign: 'center',
          marginTop: 8,
          maxWidth: 64,
          lineHeight: 14,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProcessingScreen({
  audioUri,
  patientId,
  steps,
  onDone,
  onError,
}: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const lastStepIndex = steps.length - 1;

  // Keep a stable ref for callbacks used in the effect
  const onDoneRef = useRef(onDone);
  const onErrorRef = useRef(onError);
  onDoneRef.current = onDone;
  onErrorRef.current = onError;

  useEffect(() => {
    const state = {
      currentStep: 0,
      apiResult: null as AiProcessingResult | null,
      doneCalled: false,
    };

    function tryProceed() {
      if (
        state.apiResult &&
        state.currentStep >= lastStepIndex &&
        !state.doneCalled
      ) {
        state.doneCalled = true;
        // Small extra beat so the last step is visible before transitioning
        setTimeout(() => onDoneRef.current(state.apiResult!), 600);
      }
    }

    // Fire API call immediately
    notesService
      .processVoiceNote(audioUri, patientId)
      .then((result) => {
        state.apiResult = result;
        tryProceed();
      })
      .catch((err) => {
        onErrorRef.current(voiceNoteErrorMessage(err));
      });

    // Build timers: advance one step every 3 seconds (skips the last index —
    // that's only reached after the API resolves).
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= lastStepIndex; i++) {
      const delay = i * 3000;
      timers.push(
        setTimeout(() => {
          state.currentStep = i;
          setCurrentStep(i);
          tryProceed();
        }, delay),
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stepState(index: number): StepState {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'upcoming';
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
      edges={['top', 'bottom']}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        {/* Step row — connectors are rendered between circles */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 40,
          }}
        >
          {steps.map((label, i) => (
            <React.Fragment key={i}>
              <StepCircle state={stepState(i)} label={label} />
              {i < steps.length - 1 && <Connector done={currentStep > i} />}
            </React.Fragment>
          ))}
        </View>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_400Regular',
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          {steps.length === 1
            ? 'Processing your note…'
            : 'Processing your consultation…'}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'IBMPlexSans_400Regular',
            color: colors.muted,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          Longer recordings may take up to 30 seconds.
        </Text>
      </View>
    </SafeAreaView>
  );
}
