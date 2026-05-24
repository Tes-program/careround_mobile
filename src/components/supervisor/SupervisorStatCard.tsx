import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, fontSize, fontFamily } from '@/constants/theme';

export type StatCardVariant = 'neutral' | 'danger' | 'warn' | 'success';

interface SupervisorStatCardProps {
  label: string;
  value: number;
  sublabel: string;
  /**
   * Pass an Ionicons element without color/size — the card injects them via
   * React.cloneElement based on the variant.
   * e.g. icon={<Ionicons name="medical-outline" />}
   */
  icon: React.ReactElement<{ color?: string; size?: number; name?: string }>;
  variant: StatCardVariant;
}

const ICON_BG: Record<StatCardVariant, string> = {
  neutral: colors.accent + '26',   // ~15% opacity
  danger:  colors.danger + '26',
  warn:    colors.warn   + '26',
  success: colors.success + '26',
};

const ICON_COLOR: Record<StatCardVariant, string> = {
  neutral: colors.accent,
  danger:  colors.danger,
  warn:    colors.warn,
  success: colors.success,
};

export function SupervisorStatCard({
  label,
  value,
  sublabel,
  icon,
  variant,
}: SupervisorStatCardProps) {
  const scale = useSharedValue(1);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      scale.value = withSequence(
        withTiming(1.15, { duration: 150 }),
        withTiming(1.0,  { duration: 150 }),
      );
    }
  }, [value, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Clone icon to inject color + size
  const coloredIcon = React.cloneElement(icon, {
    color: ICON_COLOR[variant],
    size: 18,
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.lg,
        padding: 16,
      }}
    >
      {/* Icon container */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: ICON_BG[variant],
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        {coloredIcon}
      </View>

      {/* Animated value */}
      <Animated.Text
        style={[
          animatedStyle,
          {
            fontSize: fontSize['3xl'],
            fontFamily: fontFamily.sansBold,
            color: colors.ink,
            lineHeight: 36,
            marginBottom: 4,
          },
        ]}
      >
        {value}
      </Animated.Text>

      {/* Label */}
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fontFamily.sansBold,
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 2,
        }}
      >
        {label}
      </Text>

      {/* Sublabel */}
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fontFamily.sans,
          color: colors.muted,
        }}
      >
        {sublabel}
      </Text>
    </View>
  );
}
