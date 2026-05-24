import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const BAR_COUNT = 28;
const BAR_WIDTH = 4;
const BAR_GAP = 3;
const CONTAINER_H = 64;
const MIN_H_RATIO = 0.2;

// ── Per-bar config (computed once on first render) ────────────────────────────

interface BarConfig {
  maxH: number;
  minH: number;
  duration: number; // ms for one half-swing
  startDelay: number; // ms initial delay to stagger phase
}

// ── Individual animated bar ───────────────────────────────────────────────────

interface WaveBarProps {
  config: BarConfig;
  active: boolean;
}

const WaveBar = memo(function WaveBar({ config, active }: WaveBarProps) {
  const { maxH, minH, duration, startDelay } = config;
  const height = useSharedValue(minH);

  useEffect(() => {
    if (active) {
      height.value = withDelay(
        startDelay,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration, easing: Easing.inOut(Easing.sin) }),
            withTiming(minH, { duration, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(minH, { duration: 300 });
    }
    return () => {
      cancelAnimation(height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          backgroundColor: colors.accent,
          borderRadius: BAR_WIDTH / 2,
          alignSelf: 'center',
        },
        style,
      ]}
    />
  );
});

// ── Public component ──────────────────────────────────────────────────────────

interface WaveformProps {
  active: boolean;
}

export function Waveform({ active }: WaveformProps) {
  // Seed randomness once at mount — useMemo with [] keeps it stable.
  const barConfigs = useMemo<BarConfig[]>(
    () =>
      Array.from({ length: BAR_COUNT }, () => ({
        maxH: (0.8 + Math.random() * 0.2) * CONTAINER_H,
        minH: MIN_H_RATIO * CONTAINER_H,
        duration: 350 + Math.floor(Math.random() * 350), // 350–700 ms
        startDelay: Math.floor(Math.random() * 450), // 0–450 ms phase offset
      })),
    [],
  );

  return (
    <View
      style={{
        height: CONTAINER_H,
        flexDirection: 'row',
        alignItems: 'center',
        gap: BAR_GAP,
      }}
    >
      {barConfigs.map((cfg, i) => (
        <WaveBar key={i} config={cfg} active={active} />
      ))}
    </View>
  );
}
