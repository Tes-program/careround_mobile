import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/constants/theme';
import type { ToastType } from '@/hooks/useToast';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const BG: Record<ToastType, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.ink,
};

export function Toast({ message, type, visible, onHide, duration = 3000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (visible) {
      // Slide in
      translateY.value = withTiming(0, { duration: 280 });
      // Schedule slide-out
      hideTimerRef.current = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 280 }, (finished) => {
          if (finished) runOnJS(onHide)();
        });
      }, duration);
    } else {
      translateY.value = withTiming(-120, { duration: 280 });
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        {
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          backgroundColor: BG[type],
          borderRadius: radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 12,
          zIndex: 9999,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
        },
        animStyle,
      ]}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 14,
          fontFamily: 'IBMPlexSans_500Medium',
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
