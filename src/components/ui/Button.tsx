import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';
import { colors } from '@/constants/theme';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantContainer: Record<ButtonVariant, string> = {
  primary: 'bg-cr-brand active:bg-cr-brand-ink',
  outline: 'border border-cr-brand active:bg-cr-surface-2',
  ghost: 'active:bg-cr-surface-2',
  destructive: 'bg-cr-danger active:bg-red-700',
};

const variantText: Record<ButtonVariant, string> = {
  primary: 'text-white',
  outline: 'text-cr-brand',
  ghost: 'text-cr-brand',
  destructive: 'text-white',
};

const sizeContainer: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-md',
  md: 'px-4 py-2.5 rounded-lg',
  lg: 'px-6 py-3 rounded-xl',
};

const sizeText: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const spinnerColor: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  outline: colors.brand,
  ghost: colors.brand,
  destructive: '#ffffff',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${variantContainer[variant]} ${sizeContainer[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor[variant]} />
      ) : (
        <Text className={`font-sans-semibold ${variantText[variant]} ${sizeText[size]}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
