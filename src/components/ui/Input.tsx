import React, { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  className?: string;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  secureTextEntry,
  className = '',
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.line;

  return (
    <View className={className}>
      {label ? (
        <Text className="text-sm font-sans-medium text-cr-ink-2 mb-1.5">{label}</Text>
      ) : null}
      <View
        className="flex-row items-center bg-cr-surface rounded-lg px-3"
        style={{ borderWidth: 1.5, borderColor }}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          {...props}
          secureTextEntry={secure}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className="flex-1 py-3 text-base text-cr-ink font-sans"
          placeholderTextColor={colors.muted}
          style={style}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setSecure((s) => !s)} className="ml-2 p-1">
            <Text className="text-cr-muted text-sm font-sans">{secure ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="text-xs text-cr-danger mt-1 font-sans">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-cr-muted mt-1 font-sans">{hint}</Text>
      ) : null}
    </View>
  );
}
