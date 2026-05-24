import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fontFamily, fontSize, radius } from '@/constants/theme';
import type { TaskGroup } from '@/utils/tasks';

interface TaskSectionHeaderProps {
  group: TaskGroup;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}

const GROUP_LABEL: Record<TaskGroup, string> = {
  OVERDUE: 'Overdue',
  DUE_SOON: 'Due Soon',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Done',
};

const GROUP_COLOR: Record<TaskGroup, string> = {
  OVERDUE: colors.danger,
  DUE_SOON: colors.warn,
  UPCOMING: colors.ink,
  COMPLETED: colors.success,
};

export function TaskSectionHeader({ group, count, isOpen, onToggle }: TaskSectionHeaderProps) {
  // OVERDUE is always locked open — chevron is hidden and toggle is disabled
  const isLocked = group === 'OVERDUE';

  // Chevron rotates: closed = 0°, open = 90°
  const rotation = useSharedValue(isOpen || isLocked ? 90 : 0);

  useEffect(() => {
    rotation.value = withTiming(isOpen || isLocked ? 90 : 0, { duration: 220 });
  }, [isOpen, isLocked, rotation]);

  const chevronAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const color = GROUP_COLOR[group];
  const label = GROUP_LABEL[group];

  return (
    <Pressable
      onPress={isLocked ? undefined : onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
        gap: 6,
        backgroundColor: colors.bg,
      }}
    >
      {/* Chevron — hidden for OVERDUE */}
      {isLocked ? (
        <View style={{ width: 14 }} />
      ) : (
        <Animated.View style={[{ width: 14, alignItems: 'center' }, chevronAnimStyle]}>
          {/* ▶ rotates to ▼ */}
          <Text style={{ fontSize: 10, color: colors.muted, lineHeight: 14 }}>▶</Text>
        </Animated.View>
      )}

      {/* Section label */}
      <Text
        style={{
          fontFamily: fontFamily.sansSemiBold,
          fontSize: fontSize.xs,
          color,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>

      {/* Count badge */}
      <View
        style={{
          backgroundColor: colors.surface3,
          borderRadius: radius.full,
          paddingHorizontal: 7,
          paddingVertical: 2,
          minWidth: 22,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.sansMedium,
            fontSize: fontSize.xs,
            color: colors.muted,
          }}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}
