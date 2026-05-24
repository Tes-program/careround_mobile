import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontSize } from '@/constants/theme';
import type { MedicationTaskEnriched } from '@/types/domain';

interface OverdueAlertPanelProps {
  tasks: MedicationTaskEnriched[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getMinutesOverdue(task: MedicationTaskEnriched): number {
  if (task.minutesOverdue != null) return task.minutesOverdue;
  return Math.max(0, Math.floor((Date.now() - new Date(task.scheduledTime).getTime()) / 60_000));
}

export function OverdueAlertPanel({ tasks }: OverdueAlertPanelProps) {
  if (tasks.length === 0) {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={{
          backgroundColor: colors.greenBg,
          borderWidth: 1,
          borderColor: colors.success + '60',
          borderRadius: radius.lg,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          gap: 10,
        }}
      >
        <Ionicons name="checkmark-circle" color={colors.success} size={18} />
        <Text
          style={{
            fontSize: fontSize.sm,
            fontFamily: 'IBMPlexSans_600SemiBold',
            color: colors.success,
          }}
        >
          No overdue medication tasks
        </Text>
      </Animated.View>
    );
  }

  const plural = tasks.length === 1 ? 'Task' : 'Tasks';

  return (
    <Animated.View
      entering={SlideInDown.duration(300).springify().damping(20)}
      exiting={FadeOut.duration(200)}
      style={{
        backgroundColor: colors.dangerBg,
        borderWidth: 1,
        borderColor: colors.danger + '60',
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 14,
          paddingBottom: 10,
        }}
      >
        <Ionicons name="warning" color={colors.danger} size={16} />
        <Text
          style={{
            fontSize: fontSize.sm,
            fontFamily: 'IBMPlexSans_600SemiBold',
            color: colors.danger,
          }}
        >
          {tasks.length} Overdue {plural}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.danger + '30' }} />

      {/* Task list */}
      <ScrollView style={{ maxHeight: 240 }} scrollEnabled={tasks.length > 3}>
        {tasks.map((task, index) => (
          <View key={task.id}>
            <View style={{ padding: 14 }}>
              {/* Patient name + bed */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    fontFamily: 'IBMPlexSans_500Medium',
                    color: colors.ink,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {task.patientName}
                </Text>
                {task.bedNumber ? (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      backgroundColor: colors.surface3,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.xs,
                        fontFamily: 'IBMPlexSans_400Regular',
                        color: colors.muted,
                      }}
                    >
                      Bed {task.bedNumber}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Drug info */}
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontFamily: 'IBMPlexSans_400Regular',
                  color: colors.ink2,
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {task.drugName} {task.dose} {task.route}
              </Text>

              {/* Due time + minutes late */}
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontFamily: 'IBMPlexSans_600SemiBold',
                  color: colors.danger,
                }}
              >
                Due {formatTime(task.scheduledTime)} · {getMinutesOverdue(task)}m late
              </Text>
            </View>

            {/* Divider between rows */}
            {index < tasks.length - 1 && (
              <View style={{ height: 1, backgroundColor: colors.danger + '20', marginHorizontal: 14 }} />
            )}
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
