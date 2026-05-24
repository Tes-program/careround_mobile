import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { ConfirmModal, Skeleton, Toast } from '@/components/ui';
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt';
import { ScreenErrorBoundary } from '@/components/errors/ScreenErrorBoundary';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskSectionHeader } from '@/components/tasks/TaskSectionHeader';
import { useMedicationTasks, useCompleteTask } from '@/hooks/useTasks';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth.store';
import { useNavigationStore } from '@/store/navigation.store';
import { DEMO_MODE } from '@/lib/demo';
import { userInitials } from '@/utils/format';
import {
  classifyTask,
  formatScheduledTime,
  groupTasks,
  pendingTaskCount,
  type TaskGroup,
} from '@/utils/tasks';
import { colors, fontFamily, fontSize, radius, spacing } from '@/constants/theme';
import { STORAGE_KEYS } from '@/types/domain';
import type { MedicationTaskEnriched } from '@/types/domain';

// ── List item union type ───────────────────────────────────────────────────────

type ListItem =
  | { type: 'section-header'; group: TaskGroup; count: number; isOpen: boolean }
  | { type: 'task'; task: MedicationTaskEnriched; group: TaskGroup }
  | { type: 'empty-section'; group: TaskGroup };

// ── Skeleton card (loading placeholder) ───────────────────────────────────────

function TaskCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        marginHorizontal: 16,
        overflow: 'hidden',
        elevation: 1,
      }}
    >
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.line }} />
      <View style={{ paddingLeft: 16, paddingRight: 14, paddingTop: 12, paddingBottom: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Skeleton width={8} height={8} borderRadius={4} />
          <Skeleton width="55%" height={13} borderRadius={4} />
          <Skeleton width="18%" height={18} borderRadius={radius.sm} />
        </View>
        <Skeleton width="72%" height={12} borderRadius={4} />
        <Skeleton width="48%" height={12} borderRadius={4} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Skeleton width={72} height={26} borderRadius={radius.md} />
        </View>
      </View>
    </View>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

interface SummaryBarProps {
  overdueCount: number;
  dueSoonCount: number;
  upcomingCount: number;
}

function SummaryBar({ overdueCount, dueSoonCount, upcomingCount }: SummaryBarProps) {
  const total = overdueCount + dueSoonCount + upcomingCount;

  if (total === 0) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          paddingVertical: 10,
          paddingHorizontal: 16,
          backgroundColor: colors.greenBg,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.success,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.sansMedium,
            fontSize: fontSize.sm,
            color: colors.success,
          }}
        >
          ✓ All tasks completed
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      <Text style={{ fontFamily: fontFamily.sansMedium, fontSize: fontSize.xs, color: colors.danger }}>
        🔴 {overdueCount} overdue
      </Text>
      <Text style={{ color: colors.line, fontSize: fontSize.xs }}>·</Text>

      <Text style={{ fontFamily: fontFamily.sansMedium, fontSize: fontSize.xs, color: colors.warn }}>
        🟡 {dueSoonCount} due soon
      </Text>
      <Text style={{ color: colors.line, fontSize: fontSize.xs }}>·</Text>

      <Text style={{ fontFamily: fontFamily.sansMedium, fontSize: fontSize.xs, color: colors.muted }}>
        ⚪ {upcomingCount} upcoming
      </Text>
    </View>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

interface TaskListHeaderProps {
  initials: string;
  pendingCount: number;
}

function TaskListHeader({ initials, pendingCount }: TaskListHeaderProps) {
  const subtitleColor =
    pendingCount === 0 ? colors.success : pendingCount === 1 ? colors.warn : colors.danger;
  const subtitleText =
    pendingCount === 0
      ? 'All caught up'
      : pendingCount === 1
        ? '1 task needs attention'
        : `${pendingCount} tasks need attention`;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
        paddingBottom: spacing[3],
      }}
    >
      {/* Logo row + avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.lg,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontFamily: fontFamily.displayBold,
                fontSize: fontSize.sm,
              }}
            >
              C
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fontFamily.displayBold,
              color: colors.accent,
              fontSize: fontSize.base,
            }}
          >
            CareRound
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {DEMO_MODE && (
            <View style={{ backgroundColor: colors.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.sansBold, color: colors.warn }}>DEMO</Text>
            </View>
          )}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontFamily: fontFamily.sansBold,
                fontSize: fontSize.sm,
              }}
            >
              {initials}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 6 }}>
        <Text
          style={{
            fontFamily: fontFamily.sansBold,
            fontSize: fontSize.xl,
            color: colors.ink,
          }}
        >
          My Tasks
        </Text>
        <Text
          style={{
            fontFamily: fontFamily.sans,
            fontSize: fontSize.sm,
            color: subtitleColor,
            marginTop: 2,
          }}
        >
          {subtitleText}
        </Text>
      </View>
    </View>
  );
}

// ── List item key extractor (outside render to prevent re-render) ─────────────
const taskListKeyExtractor = (item: ListItem, index: number): string => {
  if (item.type === 'section-header') return `hdr-${item.group}`;
  if (item.type === 'task') return `task-${item.task.id}`;
  return `empty-${item.group}-${index}`;
};

// ── Main screen ───────────────────────────────────────────────────────────────

function NurseTasksContent() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const registerDeviceToken = useAuthStore((s) => s.registerDeviceToken);
  const initials = user ? userInitials(user) : '?';

  const router = useRouter();

  // ── Notification highlighting (deep-link from notification tap) ───────────
  // highlightTaskId can arrive via URL params (foreground/background tap) or
  // via the navigation store (killed-state launch).
  const params = useLocalSearchParams();
  const urlHighlightId =
    typeof params.highlightTaskId === 'string' && params.highlightTaskId !== ''
      ? params.highlightTaskId
      : null;
  const pendingHighlightTaskId = useNavigationStore((s) => s.pendingHighlightTaskId);
  const setPendingHighlightTaskId = useNavigationStore((s) => s.setPendingHighlightTaskId);

  // Merge: prefer URL param, fall back to navigation store
  const activeHighlightId = urlHighlightId ?? pendingHighlightTaskId ?? null;

  // Ref to the FlashList so we can scroll programmatically
  const flashListRef = useRef<FlashListRef<ListItem>>(null);
  // Always-current snapshot of listItems — updated each render before effects run
  const listItemsRef = useRef<ListItem[]>([]);

  // Notification permission prompt (shown once, on first task-screen visit)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const { tasks, isLoading, isError, refetch } = useMedicationTasks();
  const { mutate: completeTask } = useCompleteTask();

  const { showToast, toastProps } = useToast();

  const [localTick, setLocalTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Notification permission prompt — show once on first visit ─────────────
  useEffect(() => {
    if (role !== 'NURSE') return;
    async function checkPrompt() {
      const [prompted, denied] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.NOTIF_PROMPTED),
        SecureStore.getItemAsync(STORAGE_KEYS.NOTIF_DENIED),
      ]);
      if (!prompted && !denied) {
        setShowNotifPrompt(true);
      }
    }
    void checkPrompt();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAllowNotifications = useCallback(async () => {
    await SecureStore.setItemAsync(STORAGE_KEYS.NOTIF_PROMPTED, '1');
    setShowNotifPrompt(false);
    // registerDeviceToken now knows prompted=true and will request OS permission
    void registerDeviceToken();
  }, [registerDeviceToken]);

  const handleSkipNotifications = useCallback(async () => {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.NOTIF_PROMPTED, '1'),
      SecureStore.setItemAsync(STORAGE_KEYS.NOTIF_DENIED, '1'),
    ]);
    setShowNotifPrompt(false);
  }, []);

  // ── Deep-link highlight: scroll to task + clear after 2.5 s ──────────────
  useEffect(() => {
    if (!activeHighlightId) return;

    // Find the task's index in the flat list so we can scroll to it.
    // listItems is computed below but we re-derive the index here using the
    // same source data to avoid a circular dependency on listItems.
    const scrollTimer = setTimeout(() => {
      // listItemsRef.current is kept in sync each render (see below).
      const idx = listItemsRef.current.findIndex(
        (item) => item.type === 'task' && item.task.id === activeHighlightId,
      );
      if (idx >= 0) {
        try {
          flashListRef.current?.scrollToIndex({ index: idx, animated: true });
        } catch {
          // scrollToIndex can throw if the list is empty or index is out of range
        }
      }
    }, 350);

    // Clear the highlight param after 2.5 seconds
    const clearTimer = setTimeout(() => {
      if (urlHighlightId) {
        router.setParams({ highlightTaskId: '' } as never);
      }
      setPendingHighlightTaskId(null);
    }, 2500);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [activeHighlightId]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => groupTasks(tasks), [tasks, localTick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pending = useMemo(() => pendingTaskCount(tasks), [tasks, localTick]);

  const prevOverdueIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(groups.OVERDUE.map((t) => t.id));

    if (prevOverdueIdsRef.current.size > 0) {
      for (const id of currentIds) {
        if (!prevOverdueIdsRef.current.has(id)) {
          const task = groups.OVERDUE.find((t) => t.id === id);
          if (task) {
            showToast({
              message: `⚠ New overdue task: ${task.drugName} for ${task.patientName}`,
              type: 'error',
            });
          }
        }
      }
    }

    prevOverdueIdsRef.current = currentIds;
  }, [groups.OVERDUE]); // eslint-disable-line react-hooks/exhaustive-deps

  const [openSections, setOpenSections] = useState<Record<TaskGroup, boolean>>({
    OVERDUE: true,
    DUE_SOON: true,
    UPCOMING: true,
    COMPLETED: false,
  });

  const toggleSection = useCallback((group: TaskGroup) => {
    if (group === 'OVERDUE') return;
    setOpenSections((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const [confirmTask, setConfirmTask] = useState<MedicationTaskEnriched | null>(null);
  const [actualDose, setActualDose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    refetch().catch(() => {});
  }, [refetch]);

  const handleMarkDonePress = useCallback((task: MedicationTaskEnriched) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActualDose(task.dose);
    setConfirmTask(task);
  }, []);

  const handleConfirmAdminister = useCallback(() => {
    if (!confirmTask) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    completeTask(
      { taskId: confirmTask.id, actualDoseGiven: actualDose || undefined },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          setConfirmTask(null);
        },
        onError: () => {
          setIsSubmitting(false);
          setConfirmTask(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showToast({ message: 'Failed to mark task as done. Please try again.', type: 'error' });
        },
      },
    );
  }, [confirmTask, actualDose, completeTask, showToast]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmTask(null);
    setActualDose('');
  }, []);

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    const order: TaskGroup[] = ['OVERDUE', 'DUE_SOON', 'UPCOMING', 'COMPLETED'];

    for (const g of order) {
      const groupTasks = groups[g];
      if (groupTasks.length === 0) continue;

      const isOpen = g === 'OVERDUE' ? true : openSections[g];
      items.push({ type: 'section-header', group: g, count: groupTasks.length, isOpen });

      if (isOpen) {
        for (const task of groupTasks) {
          items.push({ type: 'task', task, group: g });
        }
      }
    }

    return items;
  }, [groups, openSections]);

  // Keep the ref current so the highlight scroll-effect can find item indices
  // without capturing a stale listItems closure.
  listItemsRef.current = listItems;

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'section-header') {
        return (
          <TaskSectionHeader
            group={item.group}
            count={item.count}
            isOpen={item.isOpen}
            onToggle={() => toggleSection(item.group)}
          />
        );
      }

      if (item.type === 'task') {
        return (
          <View style={{ marginBottom: 10 }}>
            <TaskCard
              task={item.task}
              group={item.group}
              onMarkDone={handleMarkDonePress}
              isHighlighted={item.task.id === activeHighlightId}
            />
          </View>
        );
      }

      return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.xs, color: colors.muted }}>
            No tasks in this section.
          </Text>
        </View>
      );
    },
    [toggleSection, handleMarkDonePress, activeHighlightId],
  );

  const getItemType = useCallback((item: ListItem) => {
    if (item.type === 'section-header') return 'header';
    if (item.type === 'task') return 'task';
    return 'empty';
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <TaskListHeader initials={initials} pendingCount={0} />
        <View style={{ gap: 10, paddingTop: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <TaskListHeader initials={initials} pendingCount={0} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: colors.danger,
              backgroundColor: colors.dangerBg,
              borderRadius: radius.xl,
              padding: 20,
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.sansSemiBold,
                fontSize: fontSize.base,
                color: colors.danger,
                textAlign: 'center',
              }}
            >
              Failed to load tasks
            </Text>
            <Text
              onPress={() => refetch()}
              style={{
                fontFamily: fontFamily.sansMedium,
                fontSize: fontSize.sm,
                color: colors.brand,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: colors.brand,
                borderRadius: radius.md,
              }}
            >
              Retry
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const confirmModalBody = confirmTask ? (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: fontFamily.sans,
          fontSize: fontSize.sm,
          color: colors.ink2,
          lineHeight: 20,
        }}
      >
        {confirmTask.drugName} {confirmTask.dose} for {confirmTask.patientName}
        {confirmTask.bedNumber ? ` (Bed ${confirmTask.bedNumber})` : ''}
        {'\n'}
        Scheduled: {formatScheduledTime(confirmTask.scheduledTime)}
      </Text>

      <View>
        <Text
          style={{
            fontFamily: fontFamily.sansMedium,
            fontSize: fontSize.xs,
            color: colors.muted,
            marginBottom: 4,
          }}
        >
          Actual dose given (optional)
        </Text>
        <TextInput
          value={actualDose}
          onChangeText={setActualDose}
          placeholder={`e.g. ${confirmTask.dose}`}
          placeholderTextColor={colors.muted}
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 9,
            fontFamily: fontFamily.sans,
            fontSize: fontSize.sm,
            color: colors.ink,
            backgroundColor: colors.surface2,
          }}
        />
      </View>
    </View>
  ) : null;

  const hasAnyTask = tasks.length > 0;
  const allDone = hasAnyTask && tasks.every((t: MedicationTaskEnriched) => classifyTask(t) === 'COMPLETED');

  const ListEmptyComponent = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
      {allDone ? (
        <>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={{ fontFamily: fontFamily.sansBold, fontSize: fontSize.xl, color: colors.ink, textAlign: 'center' }}>
            All caught up
          </Text>
          <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.sm, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
            No pending tasks for this shift.
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
          <Text style={{ fontFamily: fontFamily.sansBold, fontSize: fontSize.xl, color: colors.ink, textAlign: 'center' }}>
            No tasks assigned
          </Text>
          <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.sm, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
            Tasks will appear here when prescriptions are confirmed by a doctor.
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toastProps} />

      {/* Notification permission prompt — shown once on first visit */}
      {showNotifPrompt && (
        <NotificationPermissionPrompt
          onAllow={handleAllowNotifications}
          onSkip={handleSkipNotifications}
        />
      )}

      <TaskListHeader initials={initials} pendingCount={pending} />

      <SummaryBar
        overdueCount={groups.OVERDUE.length}
        dueSoonCount={groups.DUE_SOON.length}
        upcomingCount={groups.UPCOMING.length}
      />

      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
        <FlashList
          ref={flashListRef}
          data={listItems}
          renderItem={renderItem}
          keyExtractor={taskListKeyExtractor}
          getItemType={getItemType}
          removeClippedSubviews
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          refreshing={false}
          onRefresh={handleRefresh}
        />
      </Animated.View>

      <ConfirmModal
        visible={!!confirmTask}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmAdminister}
        title="Mark as administered?"
        body={confirmModalBody ?? ''}
        confirmLabel="Confirm Administration"
        cancelLabel="Cancel"
        variant="primary"
        loading={isSubmitting}
      />
    </SafeAreaView>
  );
}

export default function NurseTasksScreen() {
  return (
    <ScreenErrorBoundary>
      <NurseTasksContent />
    </ScreenErrorBoundary>
  );
}
