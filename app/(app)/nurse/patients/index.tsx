/**
 * Nurse patient list screen.
 *
 * Identical filter/search/sort logic to the doctor list, with two differences:
 *  1. Navigation routes to `/(app)/nurse/patients/${id}`
 *  2. Each PatientCard receives `taskSummary` computed from the cached
 *     ['tasks'] query — no extra API calls per patient.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Button, EmptyState, Input } from '@/components/ui';
import { PatientCard } from '@/components/patients/PatientCard';
import { PatientCardSkeleton } from '@/components/patients/PatientCardSkeleton';
import { ScreenErrorBoundary } from '@/components/errors/ScreenErrorBoundary';
import { usePatients } from '@/hooks/usePatients';
import { useAuthStore } from '@/store/auth.store';
import { sortByAcuity } from '@/utils/acuity';
import { userInitials } from '@/utils/format';
import { classifyTask } from '@/utils/tasks';
import { DEMO_MODE } from '@/lib/demo';
import type { AcuityColor, MedicationTaskEnriched, Patient } from '@/types/domain';

type AcuityFilter = 'ALL' | AcuityColor;

// ── Acuity pill colours ────────────────────────────────────────────────────────

const ACUITY_HEX: Record<AcuityColor, string> = {
  RED: '#dc2626',
  AMBER: '#f59e0b',
  GREEN: '#22c55e',
};

interface AcuityPillProps {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}

function AcuityPill({ label, active, color, onPress }: AcuityPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? color : '#ffffff',
        borderColor: color,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: active ? '#ffffff' : color, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Per-patient task summary helper ──────────────────────────────────────────

interface TaskSummary {
  overdue: number;
  dueSoon: number;
  total: number;
}

function buildTaskSummaryMap(
  tasks: MedicationTaskEnriched[],
): Map<string, TaskSummary> {
  const map = new Map<string, TaskSummary>();

  for (const task of tasks) {
    const group = classifyTask(task);
    if (group === 'COMPLETED') continue; // don't count completed tasks

    const current = map.get(task.patientId) ?? { overdue: 0, dueSoon: 0, total: 0 };
    current.total += 1;
    if (group === 'OVERDUE') current.overdue += 1;
    if (group === 'DUE_SOON') current.dueSoon += 1;
    map.set(task.patientId, current);
  }

  return map;
}

// ── Header ────────────────────────────────────────────────────────────────────

interface PatientListHeaderProps {
  initials: string;
  count: number;
}

function PatientListHeader({ initials, count }: PatientListHeaderProps) {
  return (
    <View className="bg-cr-surface border-b border-cr-line px-4 pt-4 pb-3">
      {/* Logo row + avatar */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-lg bg-cr-accent items-center justify-center">
            <Text className="text-white font-display-bold text-sm">C</Text>
          </View>
          <Text className="font-display-bold text-cr-accent text-base">CareRound</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {DEMO_MODE && (
            <View style={{ backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontFamily: 'IBMPlexSans_700Bold', color: '#b45309' }}>DEMO</Text>
            </View>
          )}
          <View className="w-9 h-9 rounded-full bg-cr-accent items-center justify-center">
            <Text className="text-white font-sans-bold text-sm">{initials}</Text>
          </View>
        </View>
      </View>

      <View className="mt-2">
        <Text className="text-xl font-sans-bold text-cr-ink">Patients</Text>
        <Text className="text-sm text-cr-muted mt-0.5">{count} admitted</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const nursePatientKeyExtractor = (item: Patient) => item.id;
const nursePatientGetItemType = () => 'patient-card' as const;
const NursePatientSeparator = () => <View style={{ height: 12 }} />;

function NursePatientsContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [acuityFilter, setAcuityFilter] = useState<AcuityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: patients, isLoading, isError, refetch, isRefetching } = usePatients();

  // Read cached tasks without triggering a new fetch — used for task summaries
  const taskSummaryMap = useMemo(() => {
    const tasks =
      queryClient.getQueryData<MedicationTaskEnriched[]>(['tasks']) ?? [];
    return buildTaskSummaryMap(tasks);
  }, [queryClient]);

  const admittedCount = useMemo(
    () =>
      (patients ?? ([] as Patient[])).filter(
        (p: Patient) => p.status === 'ADMITTED',
      ).length,
    [patients],
  );

  const filteredPatients = useMemo<Patient[]>(() => {
    if (!patients) return [];

    let list: Patient[] = patients.filter((p: Patient) => p.status === 'ADMITTED');

    if (acuityFilter !== 'ALL') {
      list = list.filter((p: Patient) => p.acuityColor === acuityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p: Patient) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.hospitalNumber.toLowerCase().includes(q) ||
          (p.primaryDiagnosis ?? '').toLowerCase().includes(q),
      );
    }

    return sortByAcuity(list);
  }, [patients, acuityFilter, searchQuery]);

  const initials = user ? userInitials(user) : '?';
  const hasActiveFilter = acuityFilter !== 'ALL' || searchQuery.length > 0;

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    refetch().catch(() => {});
  }, [refetch]);

  const renderNursePatient = useCallback(
    ({ item }: { item: Patient }) => (
      <PatientCard
        patient={item}
        role="NURSE"
        taskSummary={taskSummaryMap.get(item.id)}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push({
            pathname: '/(app)/nurse/patients/[id]',
            params: { id: item.id },
          });
        }}
      />
    ),
    [router, taskSummaryMap],
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cr-bg" edges={['top']}>
        <PatientListHeader initials={initials} count={0} />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-cr-bg" edges={['top']}>
        <PatientListHeader initials={initials} count={0} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full border border-cr-danger bg-cr-danger-bg rounded-xl p-4 items-center gap-3">
            <Text className="text-base font-sans-semibold text-cr-danger text-center">
              Failed to load patients
            </Text>
            <Button variant="outline" size="sm" onPress={() => refetch()}>
              Retry
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const emptyComponent = hasActiveFilter ? (
    <EmptyState
      message="No patients match your filter"
      sub="Try adjusting your search or acuity filter."
    />
  ) : (
    <EmptyState
      message="No admitted patients"
      sub="Patients will appear here when admitted."
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-cr-bg" edges={['top']}>
      {/* Header */}
      <PatientListHeader initials={initials} count={admittedCount} />

      {/* Filter row */}
      <View className="bg-cr-surface border-b border-cr-line px-4 pt-3 pb-3">
        {/* Acuity pills */}
        <View className="flex-row gap-2 flex-wrap">
          <Pressable
            onPress={() => setAcuityFilter('ALL')}
            style={{
              backgroundColor: acuityFilter === 'ALL' ? '#0f172a' : '#ffffff',
              borderColor: acuityFilter === 'ALL' ? '#0f172a' : '#dbe3ed',
              borderWidth: 1,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: acuityFilter === 'ALL' ? '#ffffff' : '#0f172a',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              All
            </Text>
          </Pressable>

          {(['RED', 'AMBER', 'GREEN'] as AcuityColor[]).map((color) => (
            <AcuityPill
              key={color}
              label={color}
              active={acuityFilter === color}
              color={ACUITY_HEX[color]}
              onPress={() => setAcuityFilter(acuityFilter === color ? 'ALL' : color)}
            />
          ))}
        </View>

        {/* Search input */}
        <View className="mt-2">
          <Input
            placeholder="Search by name, hospital number, diagnosis…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Patient list */}
      <FlashList
        data={filteredPatients}
        estimatedItemSize={88}
        keyExtractor={nursePatientKeyExtractor}
        renderItem={renderNursePatient}
        getItemType={nursePatientGetItemType}
        removeClippedSubviews
        ItemSeparatorComponent={NursePatientSeparator}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
        ListEmptyComponent={emptyComponent}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

export default function NursePatientsScreen() {
  return (
    <ScreenErrorBoundary>
      <NursePatientsContent />
    </ScreenErrorBoundary>
  );
}
