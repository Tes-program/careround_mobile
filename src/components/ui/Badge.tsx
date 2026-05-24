import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';
import type { AcuityColor, VhiStatus } from '@/types/domain';

type BadgeVariant = 'red' | 'amber' | 'green' | 'blue' | 'neutral' | 'teal';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantBg: Record<BadgeVariant, string> = {
  red: 'bg-cr-danger-bg',
  amber: 'bg-cr-amber-bg',
  green: 'bg-cr-green-bg',
  blue: 'bg-blue-100',
  neutral: 'bg-cr-surface-3',
  teal: 'bg-teal-100',
};

const variantText: Record<BadgeVariant, string> = {
  red: 'text-cr-danger',
  amber: 'text-cr-warn',
  green: 'text-cr-success',
  blue: 'text-blue-700',
  neutral: 'text-cr-ink-2',
  teal: 'text-cr-accent',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${variantBg[variant]} ${className}`}>
      <Text className={`text-xs font-sans-semibold ${variantText[variant]}`}>{children}</Text>
    </View>
  );
}

const ACUITY_VARIANT: Record<AcuityColor, BadgeVariant> = {
  RED: 'red',
  AMBER: 'amber',
  GREEN: 'green',
};

export function AcuityBadge({ color }: { color: AcuityColor }) {
  return <Badge variant={ACUITY_VARIANT[color]}>{color}</Badge>;
}

const VHI_VARIANT: Record<VhiStatus, BadgeVariant> = {
  STABLE: 'green',
  WATCH: 'amber',
  CRITICAL: 'red',
};

export function VhiBadge({ score, status }: { score: number; status: VhiStatus }) {
  return (
    <Badge variant={VHI_VARIANT[status]}>
      VHI {score} · {status}
    </Badge>
  );
}

const ACUITY_STRIP_COLOR: Record<AcuityColor, string> = {
  RED: colors.acuity.red,
  AMBER: colors.acuity.amber,
  GREEN: colors.acuity.green,
};

export function AcuityStrip({ color, className = '' }: { color: AcuityColor; className?: string }) {
  return (
    <View
      className={`w-1.5 self-stretch rounded-l-lg ${className}`}
      style={{ backgroundColor: ACUITY_STRIP_COLOR[color] }}
    />
  );
}
