import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cr-bg">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="text-sm font-sans text-cr-muted mt-3">Loading session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) return null;

  return <Slot />;
}
