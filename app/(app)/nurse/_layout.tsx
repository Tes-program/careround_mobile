/**
 * Nurse bottom-tab navigator.
 * - Tasks tab: shows badge with count of OVERDUE + DUE_SOON tasks
 * - Patients tab: nurse patient list
 *
 * The badge is computed by subscribing to the ['tasks'] query cache so it
 * stays in sync with the auto-polling in the tasks screen without issuing
 * a separate network request.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, fontFamily } from '@/constants/theme';
import { classifyTask } from '@/utils/tasks';
import { useNotificationHandler } from '@/hooks/useNotificationHandler';
import { useBadgeSync } from '@/hooks/useBadgeSync';
import { configureAndroidChannel } from '@/services/notifications.service';
import { Toast } from '@/components/ui';
import type { MedicationTaskEnriched } from '@/types/domain';

// ── Inline SVG icons (react-native-svg — already a project dep) ────────────────

function ClipboardListIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <Path d="M12 11h4" />
      <Path d="M12 16h4" />
      <Path d="M8 11h.01" />
      <Path d="M8 16h.01" />
    </Svg>
  );
}

function UsersIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

// ── Badge count helper ────────────────────────────────────────────────────────

function computeBadge(tasks: MedicationTaskEnriched[]): number {
  return tasks.filter((t) => {
    const g = classifyTask(t);
    return g === 'OVERDUE' || g === 'DUE_SOON';
  }).length;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function NurseLayout() {
  const queryClient = useQueryClient();

  // ── Notification hooks (nurse-only) ─────────────────────────────────────────
  // useNotificationHandler: foreground toast + navigation on tap
  // useBadgeSync: keeps app icon badge in sync with overdue task count
  const { toastProps } = useNotificationHandler();
  useBadgeSync();

  // ── Android notification channel ─────────────────────────────────────────────
  // Create the HIGH-importance "medication_alerts" channel once when the nurse
  // layout mounts. Android is idempotent — safe to call on every app launch.
  // No-op on iOS.
  useEffect(() => {
    void configureAndroidChannel();
  }, []);

  // ── Tab bar badge: OVERDUE + DUE_SOON tasks ──────────────────────────────────
  // Initialise badge from whatever is in the cache right now
  const [badgeCount, setBadgeCount] = useState<number>(() => {
    const cached = queryClient.getQueryData<MedicationTaskEnriched[]>(['tasks']) ?? [];
    return computeBadge(cached);
  });

  // Subscribe to the query cache so the badge updates whenever the tasks
  // query resolves (including the 30-second background refetch in tasks screen).
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Re-read badge count whenever any change occurs on the tasks query
      if (event.query.queryKey[0] === 'tasks') {
        const tasks =
          queryClient.getQueryData<MedicationTaskEnriched[]>(['tasks']) ?? [];
        setBadgeCount(computeBadge(tasks));
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  return (
    // View wrapper allows the absolutely-positioned Toast to float above the Tabs
    <View style={{ flex: 1 }}>
      {/* Foreground notification toast — floats above all tab screens */}
      <Toast {...toastProps} />

      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamily.sansMedium,
        },
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <ClipboardListIcon color={color as string} size={size} />
          ),
          tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger },
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <UsersIcon color={color as string} size={size} />
          ),
        }}
      />
      {/* Hide the index redirect screen from the tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
    </View>
  );
}
