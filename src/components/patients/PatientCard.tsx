import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AcuityStrip, VhiBadge } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { timeAgo, patientFullName, ageFromDob } from '@/utils/format';
import type { Patient, VhiStatus } from '@/types/domain';

// ── Task summary (nurse-specific) ─────────────────────────────────────────────

export interface TaskSummary {
  overdue: number;
  dueSoon: number;
  total: number;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PatientCardProps {
  patient: Patient;
  latestVhiScore?: number;
  latestVhiStatus?: VhiStatus;
  latestVitalsAt?: string;
  activeMedCount?: number;
  hasNoteToday?: boolean;
  /** Nurse-only: per-patient task counts computed from the cached tasks query */
  taskSummary?: TaskSummary;
  role: 'DOCTOR' | 'NURSE';
  onPress: () => void;
}

// ── Task summary indicator ─────────────────────────────────────────────────────

function TaskSummaryIndicator({ summary }: { summary: TaskSummary }) {
  if (summary.total === 0) return null;

  if (summary.overdue > 0) {
    return (
      <Text style={{ fontSize: 11, color: colors.danger }}>
        ⚠ {summary.overdue} overdue
      </Text>
    );
  }

  if (summary.dueSoon > 0) {
    return (
      <Text style={{ fontSize: 11, color: colors.warn }}>
        🕐 {summary.dueSoon} due soon
      </Text>
    );
  }

  return (
    <Text style={{ fontSize: 11, color: colors.success }}>
      ✓ All done
    </Text>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PatientCard({
  patient,
  latestVhiScore,
  latestVhiStatus,
  latestVitalsAt,
  activeMedCount,
  hasNoteToday,
  taskSummary,
  role,
  onPress,
}: PatientCardProps) {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const hasVhi = latestVhiScore !== undefined && latestVhiStatus !== undefined;

  const genderLabel =
    patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O';
  const age = ageFromDob(patient.dateOfBirth);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        opacity.value = withTiming(0.7, { duration: 80 });
      }}
      onPressOut={() => {
        opacity.value = withTiming(1, { duration: 120 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Patient: ${patientFullName(patient)}`}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            borderRadius: radius.lg,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
          },
        ]}
        className="bg-cr-surface border border-cr-line flex-row overflow-hidden"
      >
        {/* Acuity strip — 6px left edge */}
        <AcuityStrip color={patient.acuityColor} />

        {/* Card body */}
        <View className="flex-1 px-3 py-3 gap-1">
          {/* Row 1: Name + VHI badge */}
          <View className="flex-row items-center justify-between">
            <Text
              className="text-base font-sans-bold text-cr-ink flex-1 mr-2"
              numberOfLines={1}
            >
              {patientFullName(patient)}
            </Text>
            {hasVhi ? (
              <VhiBadge score={latestVhiScore!} status={latestVhiStatus!} />
            ) : (
              <Text className="text-xs text-cr-muted">No vitals</Text>
            )}
          </View>

          {/* Row 2: Bed chip + age/gender + vitals timestamp */}
          <View className="flex-row items-center gap-2">
            {patient.bedNumber ? (
              <View className="px-2 py-0.5 rounded-md bg-cr-surface-3">
                <Text className="text-xs text-cr-muted">Bed {patient.bedNumber}</Text>
              </View>
            ) : null}
            <Text className="text-xs text-cr-muted">
              {age}y · {genderLabel}
            </Text>
            {latestVitalsAt ? (
              <Text className="text-xs text-cr-muted ml-auto">
                Vitals {timeAgo(latestVitalsAt)}
              </Text>
            ) : null}
          </View>

          {/* Row 3: Diagnosis */}
          {patient.primaryDiagnosis ? (
            <Text
              className="text-sm text-cr-ink-2"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {patient.primaryDiagnosis}
            </Text>
          ) : (
            <Text className="text-sm text-cr-muted italic">No diagnosis recorded</Text>
          )}

          {/* Row 4: Bottom meta */}
          <View className="flex-row items-center gap-3 mt-0.5">
            {activeMedCount !== undefined ? (
              <Text className="text-xs text-cr-muted">
                💊 {activeMedCount} active med{activeMedCount !== 1 ? 's' : ''}
              </Text>
            ) : null}

            {/* Nurse: task summary indicator */}
            {role === 'NURSE' && taskSummary !== undefined ? (
              <TaskSummaryIndicator summary={taskSummary} />
            ) : role === 'DOCTOR' ? (
              /* Doctor: note-today indicator */
              <View className="flex-row items-center gap-1">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: hasNoteToday ? '#0e7490' : 'transparent',
                    borderWidth: hasNoteToday ? 0 : 1.5,
                    borderColor: '#94a3b8',
                  }}
                  accessibilityLabel={hasNoteToday ? 'Note recorded today' : 'No note today'}
                />
                {hasNoteToday ? (
                  <Text className="text-xs text-cr-muted">note today</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
