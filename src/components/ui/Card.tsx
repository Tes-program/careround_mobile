import React from 'react';
import { Text, TextProps, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

interface CardTitleProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function Card({ className = '', children, style, ...props }: CardProps) {
  return (
    <View
      className={`bg-cr-surface rounded-xl overflow-hidden ${className}`}
      style={[
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <View className={`px-4 pt-4 pb-2 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <Text className={`text-lg font-sans-semibold text-cr-ink ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <View className={`px-4 pb-4 ${className}`} {...props}>
      {children}
    </View>
  );
}
