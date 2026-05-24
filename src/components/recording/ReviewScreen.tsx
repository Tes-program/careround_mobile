import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useConfirmNote } from '@/hooks/useNotes';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal, Toast } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { formatDate } from '@/utils/format';
import type { AiPrescription, AiProcessingResult, SoapContent } from '@/types/domain';
import { SoapField } from './SoapField';
import { PrescriptionReviewCard } from './PrescriptionReviewCard';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewScreenProps {
  patientId: string;
  patientName: string;
  bedNumber?: string;
  result: AiProcessingResult;
  onSaved: () => void;
  onBack: () => void;
}

// ── Empty prescription template ───────────────────────────────────────────────

function emptyPrescription(): AiPrescription {
  return {
    drugName: '',
    dose: '',
    route: '',
    frequencyString: '',
    frequencyHours: 0,
    totalDoses: 0,
    administrationTimes: [],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReviewScreen({
  patientId,
  patientName,
  bedNumber,
  result,
  onSaved,
  onBack,
}: ReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const confirmNoteMutation = useConfirmNote();
  const { showToast, toastProps } = useToast();

  // Editable state
  const [clinicalNote, setClinicalNote] = useState<SoapContent>(result.clinicalNote);
  const [prescriptions, setPrescriptions] = useState<AiPrescription[]>(result.prescriptions);
  // Track which prescriptions were added via "+ Add" (so cancel = remove)
  const [newIndices, setNewIndices] = useState<Set<number>>(new Set());

  // UI state
  const [rawExpanded, setRawExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Prescription handlers ────────────────────────────────────────────────

  function handleEditPrescription(index: number, updated: AiPrescription) {
    setPrescriptions((prev) => prev.map((p, i) => (i === index ? updated : p)));
    // Once saved, it's no longer "new"
    setNewIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }

  function handleRemovePrescription(index: number) {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
    setNewIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((n) => {
        if (n < index) next.add(n);
        else if (n > index) next.add(n - 1);
        // n === index is dropped
      });
      return next;
    });
  }

  function handleAddPrescription() {
    const nextIndex = prescriptions.length;
    setPrescriptions((prev) => [...prev, emptyPrescription()]);
    setNewIndices((prev) => new Set(prev).add(nextIndex));
  }

  // ── Save flow ────────────────────────────────────────────────────────────

  async function handleConfirmSave() {
    try {
      await confirmNoteMutation.mutateAsync({
        patientId,
        data: {
          rawTranscription: result.rawTranscription,
          clinicalNote,
          prescriptions,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowConfirmModal(false);
      onSaved();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setShowConfirmModal(false);
      showToast({ message: 'Failed to save. Please try again.', type: 'error' });
    }
  }

  // ── Confirmation modal body ──────────────────────────────────────────────

  const modalBody = (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_500Medium',
            color: colors.muted,
            width: 60,
          }}
        >
          Patient
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_400Regular',
            color: colors.ink,
            flex: 1,
          }}
        >
          {patientName}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_500Medium',
            color: colors.muted,
            width: 60,
          }}
        >
          Date
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_400Regular',
            color: colors.ink,
            flex: 1,
          }}
        >
          {formatDate(new Date().toISOString())}
        </Text>
      </View>
      <View
        style={{
          marginTop: 8,
          padding: 12,
          backgroundColor: colors.surface2,
          borderRadius: radius.md,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_400Regular',
            color: colors.ink2,
          }}
        >
          1 clinical note (AI-generated, reviewed)
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_400Regular',
            color: colors.ink2,
          }}
        >
          {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
      edges={['top']}
    >
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'IBMPlexSans_600SemiBold',
            color: colors.ink,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {patientName}
        </Text>
        {bedNumber ? (
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'IBMPlexSans_400Regular',
              color: colors.muted,
            }}
          >
            Bed {bedNumber}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'IBMPlexSans_700Bold',
            color: colors.ink,
            marginTop: 4,
          }}
        >
          Review & Confirm
        </Text>
      </View>

      {/* ── Scrollable body ────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 120 + insets.bottom, // make room for sticky bottom bar
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section: Raw Transcription (collapsible) */}
        <Animated.View layout={LinearTransition.duration(250)}>
          <Pressable
            onPress={() => setRawExpanded((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                width: 16,
                textAlign: 'center',
              }}
            >
              {rawExpanded ? '▾' : '▸'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_500Medium',
                color: colors.ink,
              }}
            >
              Raw Transcription
            </Text>
          </Pressable>

          {rawExpanded && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{
                marginTop: 10,
                padding: 12,
                backgroundColor: colors.surface2,
                borderRadius: radius.lg,
              }}
            >
              <Text
                selectable
                style={{
                  fontSize: 13,
                  fontFamily: 'IBMPlexSans_400Regular',
                  color: colors.ink2,
                  lineHeight: 20,
                }}
              >
                {result.rawTranscription}
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Section: Clinical Note */}
        <View style={{ gap: 16 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'IBMPlexSans_700Bold',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: colors.muted,
            }}
          >
            Clinical Note
          </Text>
          <SoapField
            label="Subjective"
            value={clinicalNote.subjective}
            onChange={(v) => setClinicalNote((n) => ({ ...n, subjective: v }))}
          />
          <SoapField
            label="Objective"
            value={clinicalNote.objective}
            onChange={(v) => setClinicalNote((n) => ({ ...n, objective: v }))}
          />
          <SoapField
            label="Assessment"
            value={clinicalNote.assessment}
            onChange={(v) => setClinicalNote((n) => ({ ...n, assessment: v }))}
          />
          <SoapField
            label="Plan"
            value={clinicalNote.plan}
            onChange={(v) => setClinicalNote((n) => ({ ...n, plan: v }))}
          />
        </View>

        {/* Section: Prescriptions */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'IBMPlexSans_700Bold',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: colors.muted,
            }}
          >
            Prescriptions
          </Text>

          {prescriptions.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_400Regular',
                color: colors.muted,
              }}
            >
              No prescriptions detected.
            </Text>
          ) : (
            prescriptions.map((rx, i) => (
              <PrescriptionReviewCard
                key={i}
                prescription={rx}
                isNew={newIndices.has(i)}
                onEdit={(updated) => handleEditPrescription(i, updated)}
                onRemove={() => handleRemovePrescription(i)}
              />
            ))
          )}

          {/* Add prescription */}
          <Pressable
            onPress={handleAddPrescription}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_500Medium',
                color: colors.accent,
              }}
            >
              + Add Prescription
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ─────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 13,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.line,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'IBMPlexSans_600SemiBold',
              color: colors.ink2,
            }}
          >
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowConfirmModal(true)}
          style={({ pressed }) => ({
            flex: 2,
            paddingVertical: 13,
            borderRadius: 10,
            backgroundColor: colors.accent,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'IBMPlexSans_600SemiBold',
              color: '#fff',
            }}
          >
            Confirm and Save
          </Text>
        </Pressable>
      </View>

      {/* ── Save confirmation modal ───────────────────────────────────── */}
      <ConfirmModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Save consultation note?"
        body={modalBody}
        confirmLabel="Save"
        loading={confirmNoteMutation.isPending}
      />

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <Toast {...toastProps} />
    </SafeAreaView>
  );
}
