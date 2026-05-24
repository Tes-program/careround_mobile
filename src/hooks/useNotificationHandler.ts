/**
 * useNotificationHandler
 * Mounted once in the Nurse layout. Sets up two Expo Notifications listeners:
 *
 * 1. addNotificationReceivedListener — fires while app is foregrounded.
 *    Shows an in-app toast, increments the badge count optimistically, and
 *    invalidates the ['tasks'] query so the list refreshes immediately.
 *
 * 2. addNotificationResponseReceivedListener — fires when the user taps a
 *    notification from any app state (foreground, background, or just launched).
 *    Navigates to the nurse task list with the relevant task highlighted and
 *    clears the badge.
 *
 * Returns toastProps so the nurse layout can render the <Toast /> overlay.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useToast, type ToastProps } from './useToast';
import {
  clearBadge,
  parseNotificationData,
  setBadgeCount,
} from '@/services/notifications.service';
import { classifyTask } from '@/utils/tasks';
import type { MedicationTaskEnriched } from '@/types/domain';

export function useNotificationHandler(): { toastProps: ToastProps } {
  const { showToast, toastProps } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    // Expo Go on Android (SDK 53+) throws when registering notification listeners.
    // Guard with try-catch so the app still runs; push notifications simply won't
    // fire in that environment. Use a development build for full support.
    let foregroundSub: ReturnType<typeof Notifications.addNotificationReceivedListener> | null = null;
    let responseSub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null = null;

    try {
      // ── Listener 1: foreground notification arrived ─────────────────────────
      foregroundSub = Notifications.addNotificationReceivedListener(
        (notification) => {
          const data = parseNotificationData(notification);
          if (!data) return;

          // In-app toast — iOS suppresses the system banner when foregrounded
          showToast({
            message: `⚠ ${data.drugName} ${data.dose} for ${data.patientName} — overdue`,
            type: 'error',
          });

          // Optimistic badge increment: compute current overdue count + 1
          const tasks =
            queryClient.getQueryData<MedicationTaskEnriched[]>(['tasks']) ?? [];
          const currentOverdue = tasks.filter(
            (t) => classifyTask(t) === 'OVERDUE',
          ).length;
          void setBadgeCount(currentOverdue + 1);

          // Invalidate tasks so the list re-fetches immediately
          void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
      );

      // ── Listener 2: user tapped a notification ──────────────────────────────
      responseSub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = parseNotificationData(response.notification);
          if (!data) return;

          // Navigate to task list — highlightTaskId triggers scroll + flash
          router.push({
            pathname: '/(app)/nurse/tasks',
            params: { highlightTaskId: data.taskId },
          } as never);

          void clearBadge();
        },
      );
    } catch {
      // expo-notifications not supported on Android in Expo Go (SDK 53+).
    }

    return () => {
      foregroundSub?.remove();
      responseSub?.remove();
    };
  }, [showToast, queryClient, router]);

  return { toastProps };
}
