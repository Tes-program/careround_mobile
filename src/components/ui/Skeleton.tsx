import React, { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { radius } from '@/constants/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  className?: string;
}

const BASE_COLOR = '#e2e8f0';
const SHIMMER_COLOR = '#f1f5f9';

export function Skeleton({
  width,
  height,
  borderRadius = radius.md,
  className = '',
}: SkeletonProps) {
  // translateX runs from -width to +width to create the shimmer sweep
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(translateX);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shimmerStyle = useAnimatedStyle(() => {
    // Resolve width: if string (e.g. '100%') use a large pixel offset as approximation
    const resolvedWidth = typeof width === 'number' ? width : 400;
    return {
      transform: [{ translateX: translateX.value * resolvedWidth }],
    };
  });

  return (
    <View
      className={className}
      style={{
        width: width as DimensionValue,
        height,
        borderRadius,
        backgroundColor: BASE_COLOR,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '100%',
          },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          colors={[BASE_COLOR, SHIMMER_COLOR, BASE_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
