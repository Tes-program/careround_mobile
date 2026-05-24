import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, radius } from '@/constants/theme';

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
}

export class ScreenErrorBoundary extends React.Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ScreenErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ScreenErrorBoundary] Screen render error:', error, info);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            backgroundColor: colors.bg,
          }}
        >
          <Ionicons name="warning-outline" size={32} color={colors.danger} />
          <Text
            style={{
              fontFamily: fontFamily.sansSemiBold,
              fontSize: fontSize.base,
              color: colors.ink,
              marginTop: 12,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            This screen failed to load
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: radius.md,
              paddingHorizontal: 20,
              paddingVertical: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: fontFamily.sansMedium,
                fontSize: fontSize.sm,
                color: colors.accent,
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
