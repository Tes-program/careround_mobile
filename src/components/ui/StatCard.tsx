import React from 'react';
import { Text, View } from 'react-native';

type StatVariant = 'neutral' | 'green' | 'amber' | 'red';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: StatVariant;
  className?: string;
}

const variantBg: Record<StatVariant, string> = {
  neutral: 'bg-cr-surface',
  green: 'bg-cr-green-bg',
  amber: 'bg-cr-amber-bg',
  red: 'bg-cr-danger-bg',
};

const variantValue: Record<StatVariant, string> = {
  neutral: 'text-cr-ink',
  green: 'text-cr-success',
  amber: 'text-cr-warn',
  red: 'text-cr-danger',
};

export function StatCard({ label, value, sub, variant = 'neutral', className = '' }: StatCardProps) {
  return (
    <View
      className={`rounded-xl px-4 py-3 ${variantBg[variant]} ${className}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <Text className="text-xs font-sans-medium text-cr-muted mb-1">{label}</Text>
      <Text className={`text-2xl font-display-bold ${variantValue[variant]}`}>{value}</Text>
      {sub ? <Text className="text-xs text-cr-muted mt-0.5 font-sans">{sub}</Text> : null}
    </View>
  );
}
