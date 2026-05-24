/**
 * NurseReviewScreen — simplified voice-note review for nurses.
 *
 * No SOAP fields, no prescriptions.
 * Pre-fills the raw transcription in a plain textarea; nurse picks
 * HANDOVER_NOTE or NURSING_REPORT before saving.
 */
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAddNote } from '@/hooks/useNotes';
import { useToast } from '@/hooks/useToast';
import { Button, Toast } from '@/components/ui';
import { colors, fontFamily, fontSize, radius, spacing } from '@/constants/theme';
import type { NoteType } from '@/types/domain';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NurseReviewScreenProps {
  patientId: string;
  patientName: string;
  bedNumber?: string;
  transcription: string;
  onSaved: () => void;
  onBack: () => void;
}

// ── Note type config ──────────────────────────────────────────────────────────

type NurseNoteType = Extract<NoteType, 'HANDOVER_NOTE' | 'NURSING_REPORT'>;

const NURSE_NOTE_TYPES: NurseNoteType[] = ['HANDOVER_NOTE', 'NURSING_REPORT'];

const NOTE_TYPE_LABELS: Record<NurseNoteType, string> = {
  HANDOVER_NOTE: 'Handover Note',
  NURSING_REPORT: 'Nursing Report',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function NurseReviewScreen({
  patientId,
  patientName,
  bedNumber,
  transcription,
  onSaved,
  onBack,
}: NurseReviewScreenProps) {
  const [selectedNoteType, setSelectedNoteType] = useState<NurseNoteType>('HANDOVER_NOTE');
  const [editedText, setEditedText] = useState(transcription);

  const addNoteMutation = useAddNote();
  const { showToast, toastProps } = useToast();

  async function handleSave() {
    const trimmed = editedText.trim();
    if (!trimmed) return;

    try {
      await addNoteMutation.mutateAsync({
        patientId,
        noteType: selectedNoteType,
        content: trimmed,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSaved();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showToast({
        message: 'Failed to save note. Please try again.',
        type: 'error',
      });
    }
  }

  const isSaving = addNoteMutation.isPending;
  const canSave = editedText.trim().length > 0 && !isSaving;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <Toast {...toastProps} />

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
        }}
      >
        {/* Title row */}
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text
            style={{
              fontFamily: fontFamily.sansBold,
              fontSize: fontSize.base,
              color: colors.ink,
            }}
          >
            Review Note
          </Text>
        </View>

        {/* Patient info */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: fontFamily.sansMedium,
              fontSize: fontSize.sm,
              color: colors.ink2,
            }}
          >
            {patientName}
            {bedNumber ? ` · Bed ${bedNumber}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: 120, // space for sticky bottom bar
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Note type selector */}
        <View>
          <Text
            style={{
              fontFamily: fontFamily.sansBold,
              fontSize: fontSize.xs,
              color: colors.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Note Type
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {NURSE_NOTE_TYPES.map((type) => {
              const active = selectedNoteType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedNoteType(type)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: radius.full,
                    backgroundColor: active ? colors.accent : colors.surface3,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.line,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fontFamily.sansMedium,
                      fontSize: fontSize.sm,
                      color: active ? '#fff' : colors.ink2,
                    }}
                  >
                    {NOTE_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Note text area */}
        <View>
          <Text
            style={{
              fontFamily: fontFamily.sansBold,
              fontSize: fontSize.xs,
              color: colors.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Note
          </Text>

          <TextInput
            value={editedText}
            onChangeText={setEditedText}
            placeholder="Write your note here…"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={{
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.lg,
              padding: spacing[3],
              minHeight: 240,
              fontFamily: fontFamily.sans,
              fontSize: fontSize.sm,
              color: colors.ink,
              backgroundColor: colors.surface,
              lineHeight: 22,
            }}
          />

          {/* Character count */}
          <Text
            style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.xs,
              color: colors.muted,
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {editedText.length} characters
          </Text>
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ─────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            variant="outline"
            size="md"
            onPress={onBack}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </View>

        <View style={{ flex: 2 }}>
          <Button
            variant="primary"
            size="md"
            onPress={handleSave}
            disabled={!canSave}
            loading={isSaving}
          >
            Save Note
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
