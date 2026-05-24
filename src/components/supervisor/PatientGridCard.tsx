import React from 'react';
import { View, Text } from 'react-native';
import { AcuityStrip } from '@/components/ui';
import { colors, radius, fontSize } from '@/constants/theme';
import type { Patient } from '@/types/domain';

interface PatientGridCardProps {
  patient: Patient;
}

const CARD_BG: Record<string, string> = {
  RED: '#fef2f2',
  AMBER: '#fffbeb',
  GREEN: colors.surface,
};

const CARD_BORDER: Record<string, string> = {
  RED: '#fecaca',
  AMBER: '#fde68a',
  GREEN: colors.line,
};

export function PatientGridCard({ patient }: PatientGridCardProps) {
  const bg = CARD_BG[patient.acuityColor] ?? colors.surface;
  const border = CARD_BORDER[patient.acuityColor] ?? colors.line;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: radius.lg,
        overflow: 'hidden',
        minHeight: 80,
      }}
    >
      {/* Acuity strip on the left */}
      <AcuityStrip color={patient.acuityColor} />

      {/* Content */}
      <View style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
        <Text
          style={{
            fontSize: fontSize.sm,
            fontFamily: 'IBMPlexSans_600SemiBold',
            color: colors.ink,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {patient.firstName} {patient.lastName}
        </Text>

        {patient.bedNumber ? (
          <Text
            style={{
              fontSize: fontSize.xs,
              fontFamily: 'IBMPlexSans_400Regular',
              color: colors.muted,
              marginBottom: 3,
            }}
          >
            Bed {patient.bedNumber}
          </Text>
        ) : null}

        {patient.primaryDiagnosis ? (
          <Text
            style={{
              fontSize: fontSize.xs,
              fontFamily: 'IBMPlexSans_400Regular',
              color: colors.ink2,
            }}
            numberOfLines={1}
          >
            {patient.primaryDiagnosis}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
