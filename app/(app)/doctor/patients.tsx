import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button, EmptyState, Input } from '@/components/ui';
import { PatientCard } from '@/components/patients/PatientCard';
import { PatientCardSkeleton } from '@/components/patients/PatientCardSkeleton';
import { ScreenErrorBoundary } from '@/components/errors/ScreenErrorBoundary';
import { usePatients } from '@/hooks/usePatients';
import { useAuthStore } from '@/store/auth.store';
import { sortByAcuity } from '@/utils/acuity';
import { userInitials } from '@/utils/format';
import { DEMO_MODE } from '@/lib/demo';
import type { AcuityColor, Patient } from '@/types/domain';

type AcuityFilter = 'ALL' | AcuityColor;

// ── Acuity pill colours ──────────────────────────────────────────────────────
const ACUITY_HEX: Record<AcuityColor, string> = {
  RED: '#dc2626',
  AMBER: '#f59e0b',
  GREEN: '#22c55e',
};

interface AcuityPillProps {
  label: string;
  active: boolean;
  color: string; // hex
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
      <Text
        style={{ color: active ? '#ffffff' : color, fontSize: 12, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const ItemSeparator = () => <View style={{ height: 12 }} />;
const keyExtractor = (item: Patient) => item.id;
const getItemType = () => 'patient-card' as const;

function DoctorPatientsContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [acuityFilter, setAcuityFilter] = useState<AcuityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: patients, isLoading, isError, refetch, isRefetching } = usePatients();

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    refetch().catch(() => {});
  }, [refetch]);

  const renderPatient = useCallback(
    ({ item }: { item: Patient }) => (
      <PatientCard
        patient={item}
        role="DOCTOR"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push({
            pathname: '/(app)/doctor/patients/[id]',
            params: { id: item.id },
          });
        }}
      />
    ),
    [router],
  );

  const admittedCount = useMemo(
    () => (patients ?? ([] as Patient[])).filter((p: Patient) => p.status === 'ADMITTED').length,
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
      sub="Patients will appear here when admitted by an admin."
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
          {/* All pill — uses theme ink colour */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAcuityFilter('ALL');
            }}
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAcuityFilter(acuityFilter === color ? 'ALL' : color);
              }}
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

      {/* Patient list — ListEmptyComponent keeps pull-to-refresh working */}
      <FlashList
        data={filteredPatients}
        keyExtractor={keyExtractor}
        renderItem={renderPatient}
        getItemType={getItemType}
        removeClippedSubviews
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
        ListEmptyComponent={emptyComponent}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

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
          {/* Logo mark — teal rounded square with "C" */}
          <View className="w-7 h-7 rounded-lg bg-cr-accent items-center justify-center">
            <Text className="text-white font-display-bold text-sm">C</Text>
          </View>
          <Text className="font-display-bold text-cr-accent text-base">CareRound</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {DEMO_MODE && (
            <View style={{ backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontFamily: 'IBMPlexSans_700Bold', color: '#b45309' }}>DEMO</Text>
            </View>
          )}
          {/* User initials avatar */}
          <View className="w-9 h-9 rounded-full bg-cr-accent items-center justify-center">
            <Text className="text-white font-sans-bold text-sm">{initials}</Text>
          </View>
        </View>
      </View>

      {/* Title + subtitle */}
      <View className="mt-2">
        <Text className="text-xl font-sans-bold text-cr-ink">My Patients</Text>
        <Text className="text-sm text-cr-muted mt-0.5">{count} admitted</Text>
      </View>
    </View>
  );
}

export default function DoctorPatientsScreen() {
  return (
    <ScreenErrorBoundary>
      <DoctorPatientsContent />
    </ScreenErrorBoundary>
  );
}
