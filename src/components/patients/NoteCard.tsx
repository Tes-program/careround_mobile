import React from 'react';
import { Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';
import type { ClinicalNoteEnriched, NoteType } from '@/types/domain';

// ── Constants ─────────────────────────────────────────────────────────────────

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  WARD_ROUND_NOTE: 'Ward Round',
  PROGRESS_NOTE: 'Progress Note',
  ADMISSION_NOTE: 'Admission',
  DISCHARGE_NOTE: 'Discharge',
  HANDOVER_NOTE: 'Handover',
  NURSING_REPORT: 'Nursing Report',
};

const BORDER_COLOR: Record<NoteType, string> = {
  WARD_ROUND_NOTE: colors.accent,
  PROGRESS_NOTE: colors.accent,
  ADMISSION_NOTE: '#3b82f6',
  DISCHARGE_NOTE: '#a855f7',
  HANDOVER_NOTE: '#f59e0b',
  NURSING_REPORT: '#f59e0b',
};

const BADGE_BG: Record<NoteType, string> = {
  WARD_ROUND_NOTE: '#ccfbf1',
  PROGRESS_NOTE: '#ccfbf1',
  ADMISSION_NOTE: '#dbeafe',
  DISCHARGE_NOTE: '#f3e8ff',
  HANDOVER_NOTE: '#fef3c7',
  NURSING_REPORT: '#fef3c7',
};

const BADGE_TEXT: Record<NoteType, string> = {
  WARD_ROUND_NOTE: colors.accent,
  PROGRESS_NOTE: colors.accent,
  ADMISSION_NOTE: '#1d4ed8',
  DISCHARGE_NOTE: '#7e22ce',
  HANDOVER_NOTE: colors.warn,
  NURSING_REPORT: colors.warn,
};

// ── SOAP parser ───────────────────────────────────────────────────────────────

interface SoapContent {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

function tryParseSoap(content: string): SoapContent | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      ('subjective' in parsed ||
        'objective' in parsed ||
        'assessment' in parsed ||
        'plan' in parsed)
    ) {
      return parsed as SoapContent;
    }
  } catch {
    // plain text
  }
  return null;
}

// ── SOAP field renderer ───────────────────────────────────────────────────────

function SoapField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'IBMPlexSans_600SemiBold',
          color: colors.ink2,
          marginBottom: 2,
        }}
      >
        {label}:
      </Text>
      <Text style={{ fontSize: 13, color: colors.ink2, lineHeight: 19 }}>{value}</Text>
    </View>
  );
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: ClinicalNoteEnriched;
}

export function NoteCard({ note }: NoteCardProps) {
  const borderColor = BORDER_COLOR[note.noteType];
  const soap = tryParseSoap(note.content);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        {/* Author */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'IBMPlexSans_600SemiBold',
              color: colors.ink,
            }}
          >
            {note.authorName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {note.authorRole} · {formatDateTime(note.createdAt)}
          </Text>
        </View>

        {/* Type badge + AI chip */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View
            style={{
              backgroundColor: BADGE_BG[note.noteType],
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'IBMPlexSans_600SemiBold',
                color: BADGE_TEXT[note.noteType],
              }}
            >
              {NOTE_TYPE_LABELS[note.noteType]}
            </Text>
          </View>

          {note.isAiGenerated && (
            <View
              style={{
                backgroundColor: '#e0f2fe',
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'IBMPlexSans_600SemiBold',
                  color: '#0284c7',
                }}
              >
                AI
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      <View style={{ padding: 12 }}>
        {soap ? (
          <>
            {soap.subjective ? (
              <SoapField label="Subjective" value={soap.subjective} />
            ) : null}
            {soap.objective ? (
              <SoapField label="Objective" value={soap.objective} />
            ) : null}
            {soap.assessment ? (
              <SoapField label="Assessment" value={soap.assessment} />
            ) : null}
            {soap.plan ? <SoapField label="Plan" value={soap.plan} /> : null}
          </>
        ) : (
          <Text style={{ fontSize: 13, color: colors.ink2, lineHeight: 20 }}>
            {note.content}
          </Text>
        )}
      </View>
    </View>
  );
}
