import React from 'react';
import { Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface VitalsMiniCardProps {
  label: string;
  value?: number | null;
  unit: string;
  /** Individual NEWS2 score for this parameter — drives the dot colour */
  score?: number;
}

function dotColor(score: number): string {
  if (score === 0) return colors.acuity.green;
  if (score <= 2) return colors.acuity.amber;
  return colors.acuity.red;
}

export function VitalsMiniCard({ label, value, unit, score }: VitalsMiniCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.md,
        paddingVertical: 8,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 72,
      }}
    >
      {/* Score dot — top-right corner */}
      {score !== undefined && (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor(score),
          }}
        />
      )}

      {/* Value */}
      <Text
        style={{
          fontSize: 20,
          fontFamily: 'IBMPlexSans_700Bold',
          color: colors.ink,
        }}
      >
        {value != null ? String(value) : '—'}
      </Text>

      {/* Unit */}
      <Text
        style={{
          fontSize: 10,
          color: colors.muted,
          marginTop: 1,
          textAlign: 'center',
        }}
      >
        {unit}
      </Text>

      {/* Label */}
      <Text
        style={{
          fontSize: 10,
          color: colors.muted,
          marginTop: 1,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
