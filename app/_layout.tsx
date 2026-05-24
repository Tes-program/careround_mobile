import '../global.css';

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { configureNotificationHandler, parseNotificationData } from '@/services/notifications.service';
import { useNavigationStore } from '@/store/navigation.store';
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

SplashScreen.preventAutoHideAsync();

// Configure how notifications are presented while the app is foregrounded.
// Must run before any listener or notification can arrive — module-level call
// ensures this is set up before the component tree mounts.
configureNotificationHandler();

export default function RootLayout() {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setPendingHighlightTaskId = useNavigationStore((s) => s.setPendingHighlightTaskId);

  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    hydrateFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isLoading]);

  // Killed-state notification: app was launched by tapping a notification.
  // getLastNotificationResponseAsync() returns the response that launched the
  // app; we store the taskId in the navigation store so the nurse task list
  // can highlight it on mount.
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = parseNotificationData(response.notification);
        if (!data) return;
        setPendingHighlightTaskId(data.taskId);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* OfflineBanner is absolutely-positioned above all content */}
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
          <OfflineBanner />
        </View>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
