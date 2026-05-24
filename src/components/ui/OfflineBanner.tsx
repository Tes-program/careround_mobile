import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { fontFamily, fontSize } from '@/constants/theme';

const BANNER_HEIGHT = 40;

export function OfflineBanner(): React.ReactElement | null {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || !isInternetReachable;
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-BANNER_HEIGHT);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    if (isOffline) {
      wasOffline.current = true;
      cancelAnimation(translateY);
      translateY.value = withTiming(0, { duration: 300 });
    } else if (wasOffline.current) {
      // Only auto-dismiss if we were previously offline
      dismissTimer.current = setTimeout(() => {
        cancelAnimation(translateY);
        translateY.value = withTiming(-BANNER_HEIGHT, { duration: 300 });
      }, 3000);
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [isOffline]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          height: BANNER_HEIGHT,
          backgroundColor: '#1c1917',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 16 }}>📡</Text>
      <Text
        style={{
          fontFamily: fontFamily.sansMedium,
          fontSize: fontSize.sm,
          color: '#fff',
        }}
      >
        No internet connection
      </Text>
    </Animated.View>
  );
}
