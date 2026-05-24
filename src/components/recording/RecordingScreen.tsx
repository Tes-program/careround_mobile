import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';
import { Waveform } from './Waveform';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecordingScreenProps {
  patientId: string;
  patientName: string;
  bedNumber?: string;
  onStop: (audioUri: string) => void;
  onCancel: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecordingScreen({
  patientName,
  bedNumber,
  onStop,
  onCancel,
}: RecordingScreenProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);

  // Permission state
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied'>(
    'checking',
  );

  // Recording state
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false); // false = paused
  const [isStopping, setIsStopping] = useState(false);

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer control ────────────────────────────────────────────────────────

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function pauseTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ── Permission + recording setup ─────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const { status } = await Audio.requestPermissionsAsync();
      if (!mounted) return;

      if (status !== 'granted') {
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );

        if (!mounted) {
          await recording.stopAndUnloadAsync();
          return;
        }

        recordingRef.current = recording;
        setIsRecording(true);
        startTimer();
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }

    setup();

    return () => {
      mounted = false;
      pauseTimer();
      // Clean up recording if still active on unmount
      const rec = recordingRef.current;
      if (rec) {
        rec.stopAndUnloadAsync().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pause / Resume ───────────────────────────────────────────────────────

  async function handlePauseResume() {
    const rec = recordingRef.current;
    if (!rec) return;
    try {
      if (isRecording) {
        await rec.pauseAsync();
        pauseTimer();
        setIsRecording(false);
      } else {
        await rec.startAsync();
        startTimer();
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Pause/Resume error:', err);
    }
  }

  // ── Stop & Save ──────────────────────────────────────────────────────────

  async function handleStop() {
    const rec = recordingRef.current;
    if (!rec || isStopping) return;
    setIsStopping(true);
    pauseTimer();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      if (uri) {
        onStop(uri);
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsStopping(false);
    }
  }

  // ── Cancel (bottom sheet) ────────────────────────────────────────────────

  function handleCancelPress() {
    // Pause recording while confirming
    const rec = recordingRef.current;
    if (rec && isRecording) {
      rec.pauseAsync().catch(() => {});
      pauseTimer();
      setIsRecording(false);
    }
    sheetRef.current?.expand();
  }

  function handleKeepRecording() {
    sheetRef.current?.close();
    // Resume recording
    const rec = recordingRef.current;
    if (rec && !isRecording) {
      rec.startAsync().catch(() => {});
      startTimer();
      setIsRecording(true);
    }
  }

  function handleDiscard() {
    sheetRef.current?.close();
    const rec = recordingRef.current;
    if (rec) {
      rec.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    pauseTimer();
    onCancel();
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  // ── Permission denied screen ─────────────────────────────────────────────

  if (permissionStatus === 'checking') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#030712',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#030712',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'IBMPlexSans_400Regular',
            color: '#fff',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          Microphone access is required to record consultations.
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'IBMPlexSans_600SemiBold',
              color: '#fff',
            }}
          >
            Open Settings
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Main recording UI ────────────────────────────────────────────────────

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <View
        style={{
          flex: 1,
          backgroundColor: '#030712',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_600SemiBold',
                color: '#fff',
              }}
              numberOfLines={1}
            >
              {patientName}
            </Text>
            {bedNumber ? (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'IBMPlexSans_400Regular',
                  color: '#94a3b8',
                  marginTop: 1,
                }}
              >
                Bed {bedNumber}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={handleCancelPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'IBMPlexSans_500Medium',
                color: '#94a3b8',
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>

        {/* ── Center: waveform + timer ──────────────────────────────────── */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          <Waveform active={isRecording} />

          {/* Timer */}
          <Text
            style={{
              fontSize: 48,
              fontFamily: 'IBMPlexMono_400Regular',
              color: '#fff',
              marginTop: 24,
              letterSpacing: 2,
            }}
          >
            {formatTime(seconds)}
          </Text>

          {/* Paused label */}
          {!isRecording && (
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'IBMPlexSans_400Regular',
                color: '#94a3b8',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginTop: 8,
              }}
            >
              Paused
            </Text>
          )}
        </View>

        {/* ── Bottom controls ───────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            paddingHorizontal: 24,
            paddingBottom: 32,
          }}
        >
          {/* Pause / Resume */}
          <Pressable
            onPress={handlePauseResume}
            disabled={isStopping}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#475569',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || isStopping ? 0.6 : 1,
            })}
            accessibilityLabel={isRecording ? 'Pause recording' : 'Resume recording'}
          >
            <Text style={{ fontSize: 20, color: '#cbd5e1' }}>
              {isRecording ? '⏸' : '▶'}
            </Text>
          </Pressable>

          {/* Stop & Save */}
          <Pressable
            onPress={handleStop}
            disabled={isStopping}
            style={({ pressed }) => ({
              height: 56,
              minWidth: 160,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: colors.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed || isStopping ? 0.7 : 1,
            })}
            accessibilityLabel="Stop and save recording"
          >
            {isStopping ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16, color: '#fff' }}>■</Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'IBMPlexSans_600SemiBold',
                    color: '#fff',
                  }}
                >
                  Stop & Save
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Cancel confirmation bottom sheet ─────────────────────────────── */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['30%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.line }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontFamily: 'IBMPlexSans_700Bold',
              color: colors.ink,
              marginBottom: 6,
            }}
          >
            Discard recording?
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'IBMPlexSans_400Regular',
              color: colors.muted,
              marginBottom: 24,
            }}
          >
            The audio will not be saved.
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleKeepRecording}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 13,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.accent,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'IBMPlexSans_600SemiBold',
                  color: colors.accent,
                }}
              >
                Keep Recording
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDiscard}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 13,
                borderRadius: 10,
                backgroundColor: colors.danger,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'IBMPlexSans_600SemiBold',
                  color: '#fff',
                }}
              >
                Discard
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
