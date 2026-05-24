import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, fontFamily, fontSize, radius } from '@/constants/theme';
import { formatScheduledTime, overdueMinutes, type TaskGroup } from '@/utils/tasks';
import type { MedicationTaskEnriched } from '@/types/domain';

interface TaskCardProps {
  task: MedicationTaskEnriched;
  group: TaskGroup;
  onMarkDone: (task: MedicationTaskEnriched) => void;
  /** When true, briefly flashes an amber background to draw the nurse's eye. */
  isHighlighted?: boolean;
}

// ── Style maps ─────────────────────────────────────────────────────────────────

const LEFT_BORDER_COLOR: Record<TaskGroup, string> = {
  OVERDUE: '#dc2626',
  DUE_SOON: '#f59e0b',
  UPCOMING: colors.line,
  COMPLETED: '#15803d',
};

const STATUS_DOT_COLOR: Record<TaskGroup, string> = {
  OVERDUE: '#dc2626',
  DUE_SOON: '#f59e0b',
  UPCOMING: colors.line,
  COMPLETED: '#15803d',
};

// ── Status dot with optional pulse animation ──────────────────────────────────

function StatusDot({ group }: { group: TaskGroup }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (group === 'OVERDUE') {
      scale.value = withRepeat(withTiming(1.4, { duration: 700 }), -1, true);
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }
    return () => {
      cancelAnimation(scale);
    };
  }, [group, scale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: STATUS_DOT_COLOR[group],
          marginTop: 1,
          flexShrink: 0,
        },
        dotStyle,
      ]}
    />
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function TaskCard({ task, group, onMarkDone, isHighlighted = false }: TaskCardProps) {
  const router = useRouter();
  const isCompleted = group === 'COMPLETED';

  // Amber flash overlay — driven by isHighlighted prop
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (isHighlighted) {
      // Fade in → hold → fade out
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 700 }),
        withTiming(0, { duration: 500 }),
      );
    }
  }, [isHighlighted]); // eslint-disable-line react-hooks/exhaustive-deps

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));
  const overdueMins = group === 'OVERDUE' ? overdueMinutes(task.scheduledTime) : 0;
  const dueSoonMins =
    group === 'DUE_SOON'
      ? Math.max(1, Math.ceil((new Date(task.scheduledTime).getTime() - Date.now()) / 60_000))
      : 0;

  const completedAtStr = task.completedAt
    ? (() => {
        const d = new Date(task.completedAt);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      })()
    : null;

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          marginHorizontal: 16,
          overflow: 'hidden',
          opacity: isCompleted ? 0.6 : 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Left accent border — 4px, full height */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: LEFT_BORDER_COLOR[group],
          }}
        />

        {/* Amber highlight flash overlay — briefly visible when task is highlighted
            via a notification tap. pointerEvents="none" so it never blocks touches. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.amberBg,
            },
            flashStyle,
          ]}
        />

        {/* Card content */}
        <View style={{ paddingLeft: 16, paddingRight: 14, paddingTop: 12, paddingBottom: 12 }}>
          {/* Row 1: Patient name (tappable) + bed chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <StatusDot group={group} />

            {/* Tappable patient name — navigates to nurse patient detail */}
            <Pressable
              onPress={() =>
                router.push(`/(app)/nurse/patients/${task.patientId}` as never)
              }
              style={{ flex: 1 }}
              hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
              accessibilityRole="link"
              accessibilityLabel={`View patient ${task.patientName}`}
            >
              <Text
                style={{
                  fontFamily: fontFamily.sansSemiBold,
                  fontSize: fontSize.sm,
                  color: colors.accent,
                  textDecorationLine: 'underline',
                }}
                numberOfLines={1}
              >
                {task.patientName}
              </Text>
            </Pressable>

            {task.bedNumber ? (
              <View
                style={{
                  backgroundColor: colors.surface3,
                  borderRadius: radius.sm,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.sans,
                    fontSize: fontSize.xs,
                    color: colors.muted,
                  }}
                >
                  Bed {task.bedNumber}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Row 2: Drug · dose · route */}
          <Text
            style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.sm,
              color: colors.ink2,
              marginLeft: 16,
              marginBottom: 6,
            }}
          >
            {task.drugName} · {task.dose} · {task.route}
          </Text>

          {/* Row 3: Scheduled time + overdue / due-soon badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 5,
              marginLeft: 16,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted }}>🕐</Text>
            <Text
              style={{
                fontFamily: fontFamily.sans,
                fontSize: fontSize.xs,
                color: colors.muted,
              }}
            >
              {formatScheduledTime(task.scheduledTime)}
            </Text>

            {group === 'OVERDUE' && (
              <>
                <Text style={{ fontSize: 10, color: colors.danger }}>·</Text>
                <Text style={{ fontSize: 10 }}>⚠️</Text>
                <Text
                  style={{
                    fontFamily: fontFamily.sansMedium,
                    fontSize: fontSize.xs,
                    color: colors.danger,
                  }}
                >
                  {overdueMins}m overdue
                </Text>
              </>
            )}

            {group === 'DUE_SOON' && (
              <>
                <Text style={{ fontSize: 10, color: colors.warn }}>·</Text>
                <Text
                  style={{
                    fontFamily: fontFamily.sansMedium,
                    fontSize: fontSize.xs,
                    color: colors.warn,
                  }}
                >
                  Due in {dueSoonMins}m
                </Text>
              </>
            )}
          </View>

          {/* Row 4: Footer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            {isCompleted ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.success, lineHeight: 16 }}>
                  ✓
                </Text>
                <Text
                  style={{
                    fontFamily: fontFamily.sans,
                    fontSize: fontSize.xs,
                    color: colors.success,
                  }}
                >
                  Given at {completedAtStr}
                  {task.completedByName ? ` · ${task.completedByName}` : ''}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => onMarkDone(task)}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: colors.accent,
                  borderRadius: radius.md,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.sansMedium,
                    fontSize: fontSize.xs,
                    color: colors.accent,
                  }}
                >
                  Mark Done
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
