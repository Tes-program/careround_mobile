/**
 * PatientDetailShell — shared patient detail UI used by both doctor and nurse.
 *
 * Doctor:  canWrite on Notes ✓   Medications ✓   Vitals ✗
 * Nurse:   canWrite on Notes ✓   Medications ✗   Vitals ✓
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AcuityBadge, EmptyState, Skeleton } from '@/components/ui';
import { PatientTabBar } from '@/components/patients/PatientTabBar';
import type { PatientTab } from '@/components/patients/PatientTabBar';
import { OverviewTab } from '@/components/patients/tabs/OverviewTab';
import { NotesTab } from '@/components/patients/tabs/NotesTab';
import { MedicationsTab } from '@/components/patients/tabs/MedicationsTab';
import { VitalsTab } from '@/components/patients/tabs/VitalsTab';
import { usePatient } from '@/hooks/usePatients';
import { ageFromDob, patientFullName, timeAgo } from '@/utils/format';
import type { AcuityColor, PatientGender } from '@/types/domain';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PatientDetailShellProps {
  patientId: string;
  role: 'DOCTOR' | 'NURSE';
}

// ── Header skeleton ───────────────────────────────────────────────────────────

function PatientDetailHeaderSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View className="bg-cr-surface border-b border-cr-line px-4 pt-4 pb-3">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onBack} className="p-1">
          <Text className="text-cr-accent text-lg">‹</Text>
        </Pressable>
        <View className="flex-1 flex-row items-center justify-between">
          <Skeleton width="55%" height={22} borderRadius={6} />
          <Skeleton width={60} height={22} borderRadius={11} />
        </View>
      </View>
      <View className="mt-2 ml-8">
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
      <View className="mt-1.5 ml-8">
        <Skeleton width="30%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

// ── Header (loaded) ───────────────────────────────────────────────────────────

interface PatientDetailHeaderProps {
  patientName: string;
  acuityColor: AcuityColor;
  age: number;
  gender: PatientGender;
  bedNumber?: string;
  admissionDate: string;
  onBack: () => void;
}

function PatientDetailHeader({
  patientName,
  acuityColor,
  age,
  gender,
  bedNumber,
  admissionDate,
  onBack,
}: PatientDetailHeaderProps) {
  const genderLabel =
    gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : 'Other';

  return (
    <View className="bg-cr-surface border-b border-cr-line px-4 pt-4 pb-3">
      {/* Row 1: Back + name + acuity badge */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onBack}
          className="p-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text className="text-cr-accent text-2xl leading-none">‹</Text>
        </Pressable>

        <View className="flex-1 flex-row items-center justify-between gap-2">
          <Text
            className="text-xl font-sans-bold text-cr-ink flex-1"
            numberOfLines={1}
          >
            {patientName}
          </Text>
          <AcuityBadge color={acuityColor} />
        </View>
      </View>

      {/* Row 2: Age · gender · bed */}
      <View className="flex-row items-center gap-2 mt-1 ml-9">
        <Text className="text-sm text-cr-ink-2">
          {age} yrs, {genderLabel}
        </Text>
        {bedNumber ? (
          <>
            <Text className="text-cr-muted">·</Text>
            <View className="px-2 py-0.5 rounded-md bg-cr-surface-3">
              <Text className="text-xs text-cr-muted">Bed {bedNumber}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Row 3: Admitted time */}
      <View className="mt-1 ml-9">
        <Text className="text-sm text-cr-muted">
          Admitted {timeAgo(admissionDate)}
        </Text>
      </View>
    </View>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function PatientDetailShell({ patientId, role }: PatientDetailShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PatientTab>('overview');

  const { data: patient, isLoading, isError } = usePatient(patientId);

  const handleBack = () => router.back();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cr-bg" edges={['top']}>
        <PatientDetailHeaderSkeleton onBack={handleBack} />
        <PatientTabBar activeTab={activeTab} onChange={setActiveTab} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-cr-muted">Loading patient…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────
  if (isError || !patient) {
    return (
      <SafeAreaView className="flex-1 bg-cr-bg" edges={['top']}>
        <View className="bg-cr-surface border-b border-cr-line px-4 pt-4 pb-3">
          <Pressable
            onPress={handleBack}
            className="flex-row items-center gap-1"
          >
            <Text className="text-cr-accent text-2xl leading-none">‹</Text>
            <Text className="text-sm text-cr-accent font-sans-medium">Back</Text>
          </Pressable>
        </View>
        <EmptyState
          message="Patient not found"
          sub="This patient may have been discharged or removed."
          actionLabel="Go back"
          onAction={handleBack}
        />
      </SafeAreaView>
    );
  }

  // ── Loaded ───────────────────────────────────────────────────────────────
  const age = ageFromDob(patient.dateOfBirth);

  return (
    <SafeAreaView className="flex-1 bg-cr-bg" edges={['top']}>
      {/* Fixed header */}
      <PatientDetailHeader
        patientName={patientFullName(patient)}
        acuityColor={patient.acuityColor}
        age={age}
        gender={patient.gender}
        bedNumber={patient.bedNumber}
        admissionDate={patient.admissionDate}
        onBack={handleBack}
      />

      {/* Custom tab bar */}
      <PatientTabBar activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content — each tab manages its own scroll */}
      {activeTab === 'overview' && <OverviewTab patientId={patientId} />}
      {activeTab === 'notes' && (
        <NotesTab
          patientId={patientId}
          canWrite={true}
          role={role}
        />
      )}
      {activeTab === 'medications' && (
        <MedicationsTab
          patientId={patientId}
          canWrite={role === 'DOCTOR'}
        />
      )}
      {activeTab === 'vitals' && (
        <VitalsTab
          patientId={patientId}
          canWrite={role === 'NURSE'}
        />
      )}
    </SafeAreaView>
  );
}
