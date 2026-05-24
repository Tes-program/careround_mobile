import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePatientNotes } from '@/hooks/useNotes';
import { useAddNote } from '@/hooks/useNotes';
import { NoteCard } from '@/components/patients/NoteCard';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { ClinicalNoteEnriched, NoteType } from '@/types/domain';

// ── Note type config ──────────────────────────────────────────────────────────

const DOCTOR_NOTE_TYPES: NoteType[] = [
  'WARD_ROUND_NOTE',
  'PROGRESS_NOTE',
  'ADMISSION_NOTE',
  'DISCHARGE_NOTE',
];

const NURSE_NOTE_TYPES: NoteType[] = [
  'HANDOVER_NOTE',
  'NURSING_REPORT',
];

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  WARD_ROUND_NOTE: 'Ward Round',
  PROGRESS_NOTE: 'Progress Note',
  ADMISSION_NOTE: 'Admission',
  DISCHARGE_NOTE: 'Discharge',
  HANDOVER_NOTE: 'Handover',
  NURSING_REPORT: 'Nursing Report',
};

const NOTE_PLACEHOLDER: Partial<Record<NoteType, string>> = {
  WARD_ROUND_NOTE: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:',
  PROGRESS_NOTE: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:',
  ADMISSION_NOTE: 'Reason for admission:\n\nHistory:\n\nExamination:\n\nPlan:',
  DISCHARGE_NOTE: 'Discharge summary:\n\nDiagnosis:\n\nMedications on discharge:\n\nFollow-up:',
  HANDOVER_NOTE: 'Handover notes:',
  NURSING_REPORT: 'Nursing report:',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface NotesTabProps {
  patientId: string;
  canWrite: boolean;
  /** Controls note type list and mic button destination. Default: 'DOCTOR'. */
  role?: 'DOCTOR' | 'NURSE';
}

export function NotesTab({ patientId, canWrite, role = 'DOCTOR' }: NotesTabProps) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const prevCountRef = useRef(0);

  // Note types available for this role
  const noteTypes = role === 'NURSE' ? NURSE_NOTE_TYPES : DOCTOR_NOTE_TYPES;
  const defaultNoteType = noteTypes[0];

  const [modalVisible, setModalVisible] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>(defaultNoteType);
  const [content, setContent] = useState('');

  const { data: notes = [] as ClinicalNoteEnriched[], isLoading } = usePatientNotes(patientId);
  const addNoteMutation = useAddNote();

  // Auto-scroll to bottom when a new note is added
  useEffect(() => {
    if (notes.length > prevCountRef.current && prevCountRef.current > 0) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return () => clearTimeout(t);
    }
    prevCountRef.current = notes.length;
  }, [notes.length]);

  function openModal() {
    setContent('');
    setNoteType(defaultNoteType);
    setModalVisible(true);
  }

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await addNoteMutation.mutateAsync({ patientId, noteType, content: trimmed });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setModalVisible(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch {
      /* error surfaced by mutation */
    }
  }

  // Recording destination: doctor → full SOAP flow; nurse → simplified flow
  const recordingPath =
    role === 'NURSE'
      ? (`/(app)/nurse/patients/${patientId}/record` as const)
      : (`/(app)/doctor/patients/${patientId}/record` as const);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Action bar */}
      {canWrite && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <Button variant="outline" size="sm" onPress={openModal}>
            + Add Note
          </Button>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={120} />
          ))}
        </View>
      ) : notes.length === 0 ? (
        <EmptyState
          message="No notes yet"
          sub="Record a ward round or add a note to get started."
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: canWrite ? 96 : 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {notes.map((note: ClinicalNoteEnriched) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </ScrollView>
      )}

      {/* ── Floating mic button ──────────────────────────────────────────── */}
      {canWrite && (
        <Pressable
          onPress={() => router.push(recordingPath as never)}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
            elevation: 6,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          })}
          accessibilityLabel="Start voice recording"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 22, color: '#fff' }}>🎙</Text>
        </Pressable>
      )}

      {/* ── Add Note Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '92%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'IBMPlexSans_700Bold',
                  color: colors.ink,
                }}
              >
                Add Note
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 24, color: colors.muted, lineHeight: 26 }}>
                  ×
                </Text>
              </Pressable>
            </View>

            {/* Note type pills — role-aware */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {noteTypes.map((type) => {
                const active = noteType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setNoteType(type)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active ? colors.accent : colors.surface3,
                      borderWidth: 1,
                      borderColor: active ? colors.accent : colors.line,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'IBMPlexSans_500Medium',
                        color: active ? '#fff' : colors.ink2,
                      }}
                    >
                      {NOTE_TYPE_LABELS[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Text input */}
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={NOTE_PLACEHOLDER[noteType] ?? ''}
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 10,
                padding: 12,
                minHeight: 160,
                fontSize: 14,
                color: colors.ink,
                fontFamily: 'IBMPlexSans_400Regular',
                backgroundColor: colors.surface2,
                marginBottom: 6,
              }}
            />

            {/* Character count */}
            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                textAlign: 'right',
                marginBottom: 14,
              }}
            >
              {content.length} characters
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => setModalVisible(false)}
                  disabled={addNoteMutation.isPending}
                >
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleSave}
                  loading={addNoteMutation.isPending}
                  disabled={!content.trim() || addNoteMutation.isPending}
                >
                  Save Note
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
