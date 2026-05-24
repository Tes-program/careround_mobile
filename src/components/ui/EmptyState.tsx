import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  message,
  sub,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center p-8 ${className}`}>
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text className="text-lg font-sans-semibold text-cr-ink text-center mb-2">{message}</Text>
      {sub ? <Text className="text-sm text-cr-muted text-center mb-4">{sub}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="px-5 py-2.5 bg-cr-brand rounded-lg active:bg-cr-brand-ink"
        >
          <Text className="text-white font-sans-semibold text-sm">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
