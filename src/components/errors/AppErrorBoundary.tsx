import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { colors, fontFamily, fontSize, radius } from '@/constants/theme';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[AppErrorBoundary] Unhandled render error:', error, info);
  }

  private handleRestart = (): void => {
    Updates.reloadAsync().catch(() => {
      // Fallback: reset state so at least the tree re-renders
      this.setState({ hasError: false, error: null });
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 32 }}
          edges={['top', 'bottom']}
        >
          <Ionicons name="bug-outline" size={48} color={colors.danger} />
          <Text
            style={{
              fontFamily: fontFamily.sansBold,
              fontSize: fontSize.xl,
              color: colors.ink,
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.sm,
              color: colors.muted,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            The app encountered an unexpected error.
          </Text>
          <Pressable
            onPress={this.handleRestart}
            style={({ pressed }) => ({
              backgroundColor: colors.danger,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: radius.md,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: fontFamily.sansSemiBold,
                fontSize: fontSize.sm,
                color: '#fff',
              }}
            >
              Restart App
            </Text>
          </Pressable>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
