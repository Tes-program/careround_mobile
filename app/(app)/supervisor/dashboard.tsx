import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, fontFamily } from '@/constants/theme';
import { Skeleton } from '@/components/ui';
import { useSupervisorDashboard } from '@/hooks/useSupervisorDashboard';
import { useAuthStore } from '@/store/auth.store';
import { ScreenErrorBoundary } from '@/components/errors/ScreenErrorBoundary';
import { SupervisorStatCard } from '@/components/supervisor/SupervisorStatCard';
import { OverdueAlertPanel } from '@/components/supervisor/OverdueAlertPanel';
import { HourlyChart } from '@/components/supervisor/HourlyChart';
import { PatientGridCard } from '@/components/supervisor/PatientGridCard';
import { DEMO_MODE } from '@/lib/demo';
import type { Patient } from '@/types/domain';

// ── Live dot component ────────────────────────────────────────────────────────

function LiveDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 750 }),
        withTiming(1.0, { duration: 750 }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Animated.View
        style={[
          animatedStyle,
          { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
        ]}
      />
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fontFamily.sansSemiBold,
          color: colors.success,
        }}
      >
        Live
      </Text>
    </View>
  );
}

// ── Progress bar component ────────────────────────────────────────────────────

function RefreshProgressBar({ visible }: { visible: boolean }) {
  const { width: screenWidth } = useWindowDimensions();
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progressWidth.value = 0;
      progressWidth.value = withTiming(screenWidth, { duration: 8000 });
    } else {
      cancelAnimation(progressWidth);
      progressWidth.value = withTiming(0, { duration: 200 });
    }
    return () => {
      cancelAnimation(progressWidth);
    };
  }, [visible, progressWidth, screenWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'transparent',
        zIndex: 10,
      }}
    >
      <Animated.View style={[animatedStyle, { height: 2, backgroundColor: colors.accent }]} />
    </View>
  );
}

// ── Updated flash ─────────────────────────────────────────────────────────────

function UpdatedFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fontFamily.sansMedium,
          color: colors.accent,
          marginLeft: 6,
        }}
      >
        ↻ Updated
      </Text>
    </Animated.View>
  );
}

// ── Seconds-ago counter ───────────────────────────────────────────────────────

function useSecondsAgo(date: Date | null): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!date) return;
    const update = () => {
      setSeconds(Math.floor((Date.now() - date.getTime()) / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [date]);

  return seconds;
}

// ── Skeleton loading state ────────────────────────────────────────────────────

function DashboardSkeleton({ screenWidth }: { screenWidth: number }) {
  const cardW = Math.floor((screenWidth - 44) / 2);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Stat cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Skeleton width={cardW} height={110} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={110} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={110} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={110} borderRadius={radius.lg} />
      </View>
      {/* Overdue panel */}
      <Skeleton width="100%" height={80} borderRadius={radius.lg} />
      <View style={{ height: 20 }} />
      {/* Chart */}
      <Skeleton width="100%" height={200} borderRadius={radius.lg} />
      <View style={{ height: 20 }} />
      {/* Patient grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Skeleton width={cardW} height={80} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={80} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={80} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={80} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={80} borderRadius={radius.lg} />
        <Skeleton width={cardW} height={80} borderRadius={radius.lg} />
      </View>
    </ScrollView>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function DashboardError() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="warning-outline" color={colors.danger} size={48} />
      <Text
        style={{
          fontSize: fontSize.base,
          fontFamily: fontFamily.sansSemiBold,
          color: colors.ink,
          marginTop: 16,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Failed to load dashboard
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          fontFamily: fontFamily.sans,
          color: colors.muted,
          textAlign: 'center',
        }}
      >
        Pull down to retry
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

function SupervisorDashboardContent() {
  const { width: screenWidth } = useWindowDimensions();
  const logout = useAuthStore((s) => s.logout);
  const {
    metrics,
    isLoading,
    isError,
    refetchPatients,
    refetchTasks,
    lastUpdatedAt,
    isFetchingPatients,
    isFetchingTasks,
  } = useSupervisorDashboard();

  const secondsAgo = useSecondsAgo(lastUpdatedAt);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);
  const prevMetricsRef = useRef<string | null>(null);
  const updatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFetching = isFetchingPatients || isFetchingTasks;

  // Detect background data changes
  useEffect(() => {
    if (!metrics) return;
    const serialised = JSON.stringify({
      overdueCount: metrics.overdueCount,
      admittedCount: metrics.admittedCount,
      completedTodayCount: metrics.completedTodayCount,
    });
    if (prevMetricsRef.current !== null && prevMetricsRef.current !== serialised) {
      setShowUpdated(true);
      if (updatedTimerRef.current) clearTimeout(updatedTimerRef.current);
      updatedTimerRef.current = setTimeout(() => setShowUpdated(false), 1500);
    }
    prevMetricsRef.current = serialised;
  }, [metrics]);

  useEffect(() => {
    return () => {
      if (updatedTimerRef.current) clearTimeout(updatedTimerRef.current);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRefreshing(true);
    await Promise.all([refetchPatients(), refetchTasks()]);
    setRefreshing(false);
  }, [refetchPatients, refetchTasks]);

  const currentHour = new Date().getHours();
  const cardMinWidth = Math.floor((screenWidth - 44) / 2);

  // ── Header ──────────────────────────────────────────────────────────────────

  const Header = (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        height: 72,
        paddingHorizontal: 16,
        justifyContent: 'center',
      }}
    >
      {/* Progress bar at top of header */}
      <RefreshProgressBar visible={isFetching} />

      {/* Row 1: title + sign out */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.displayBold,
              color: colors.ink,
            }}
          >
            CareRound — Supervisor
          </Text>
          {DEMO_MODE && (
            <View style={{ backgroundColor: colors.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.sansBold, color: colors.warn }}>DEMO</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => logout()} hitSlop={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="log-out-outline" color={colors.muted} size={14} />
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fontFamily.sans,
                color: colors.muted,
              }}
            >
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Row 2: last updated + live indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: fontSize.xs,
              fontFamily: fontFamily.sans,
              color: colors.muted,
            }}
          >
            {lastUpdatedAt ? `Last updated ${secondsAgo}s ago` : 'Loading…'}
          </Text>
          <UpdatedFlash show={showUpdated} />
        </View>
        <LiveDot />
      </View>
    </View>
  );

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        {Header}
        <DashboardSkeleton screenWidth={screenWidth} />
      </SafeAreaView>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────

  if (isError || !metrics) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        {Header}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          contentContainerStyle={{ flex: 1 }}
        >
          <DashboardError />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Dashboard content ────────────────────────────────────────────────────────

  const overdueVariant = metrics.overdueCount > 0 ? 'danger' : 'neutral';
  const atRiskVariant = metrics.atRiskCount > 0 ? 'warn' : 'neutral';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Sticky header */}
      {Header}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Stat cards — 2×2 grid */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flex: 1, minWidth: cardMinWidth }}>
              <SupervisorStatCard
                label="Admitted"
                value={metrics.admittedCount}
                sublabel="patients"
                icon={<Ionicons name="medical-outline" />}
                variant="neutral"
              />
            </View>
            <View style={{ flex: 1, minWidth: cardMinWidth }}>
              <SupervisorStatCard
                label="Overdue Meds"
                value={metrics.overdueCount}
                sublabel="tasks"
                icon={<Ionicons name="warning-outline" />}
                variant={overdueVariant}
              />
            </View>
            <View style={{ flex: 1, minWidth: cardMinWidth }}>
              <SupervisorStatCard
                label="At Risk"
                value={metrics.atRiskCount}
                sublabel="patients"
                icon={<Ionicons name="stats-chart-outline" />}
                variant={atRiskVariant}
              />
            </View>
            <View style={{ flex: 1, minWidth: cardMinWidth }}>
              <SupervisorStatCard
                label="Completed"
                value={metrics.completedTodayCount}
                sublabel="today"
                icon={<Ionicons name="checkmark-circle-outline" />}
                variant="success"
              />
            </View>
          </View>
        </View>

        {/* 2. Overdue alert panel */}
        <View style={{ marginBottom: 20 }}>
          <OverdueAlertPanel tasks={metrics.overdueTasks} />
        </View>

        {/* 3. Hourly chart */}
        <View style={{ marginBottom: 20 }}>
          <HourlyChart data={metrics.hourlyData} currentHour={currentHour} />
        </View>

        {/* 4. Patient grid */}
        <View style={{ marginBottom: 24 }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Ionicons name="people-outline" color={colors.ink} size={16} />
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fontFamily.sansSemiBold,
                color: colors.ink,
              }}
            >
              Admitted Patients ({metrics.admittedCount})
            </Text>
          </View>

          {metrics.patientsSorted.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="people-outline" color={colors.muted} size={32} />
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontFamily: fontFamily.sans,
                  color: colors.muted,
                  marginTop: 8,
                }}
              >
                No admitted patients
              </Text>
            </View>
          ) : (
            <FlatList<Patient>
              data={metrics.patientsSorted}
              numColumns={2}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => <PatientGridCard patient={item} />}
              columnWrapperStyle={{ gap: 12 }}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SupervisorDashboardScreen() {
  return (
    <ScreenErrorBoundary>
      <SupervisorDashboardContent />
    </ScreenErrorBoundary>
  );
}
