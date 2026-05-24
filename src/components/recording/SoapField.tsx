import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface SoapFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function SoapField({ label, value, onChange }: SoapFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'IBMPlexSans_700Bold',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.muted,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.line,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 13,
          fontFamily: 'IBMPlexSans_400Regular',
          color: colors.ink,
          backgroundColor: colors.surface,
          minHeight: 72, // ~3 lines
        }}
        scrollEnabled={false}
      />
    </View>
  );
}
