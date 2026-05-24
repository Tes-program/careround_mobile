import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { usePatient } from '@/hooks/usePatients';
import { usePatientVitals } from '@/hooks/useVitals';
import { usePatientNotes } from '@/hooks/useNotes';
import { usePatientPrescriptions } from '@/hooks/usePrescriptions';
import { VitalsMiniCard } from '@/components/patients/VitalsMiniCard';
import { NoteCard } from '@/components/patients/NoteCard';
import { Skeleton, VhiBadge } from '@/components/ui';
import { computeVhi } from '@/utils/vhi';
import { timeAgo } from '@/utils/format';
import { colors } from '@/constants/theme';
import type { AdmissionType, ClinicalNoteEnriched, Patient, PatientVitalsEnriched, PrescriptionEnriched, VhiStatus } from '@/types/domain';

// ── Design helpers ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        color: colors.muted,
        fontFamily: 'IBMPlexSans_700Bold',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {text}
    </Text>
  );
}

const ADMISSION_STYLE: Record<
  AdmissionType,
  { bg: string; text: string }
> = {
  EMERGENCY: { bg: colors.dangerBg, text: colors.danger },
  ELECTIVE: { bg: '#dbeafe', text: '#1d4ed8' },
  TRANSFER: { bg: colors.amberBg, text: colors.warn },
};

const VHI_CARD_BG: Record<VhiStatus, string> = {
  STABLE: '#f0fdf4',
  WATCH: '#fffbeb',
  CRITICAL: '#fef2f2',
};

const VHI_CARD_BORDER: Record<VhiStatus, string> = {
  STABLE: '#bbf7d0',
  WATCH: '#fde68a',
  CRITICAL: '#fecaca',
};

const VHI_GUIDANCE: Record<VhiStatus, string> = {
  STABLE: 'Routine monitoring.',
  WATCH: 'Inform the floor doctor or re-check in 2 hours.',
  CRITICAL: 'Urgent medical attention required immediately.',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  patientId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OverviewTab({ patientId }: OverviewTabProps) {
  const { data: patientRaw } = usePatient(patientId);
  const patient = patientRaw as Patient | undefined;
  const { data: vitals = [] as PatientVitalsEnriched[] } = usePatientVitals(patientId);
  const { data: notes = [] as ClinicalNoteEnriched[] } = usePatientNotes(patientId);
  const { data: prescriptions = [] as PrescriptionEnriched[] } = usePatientPrescriptions(patientId);

  // Latest entry is last in the chronologically-sorted array
  const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null;
  const activeMeds = prescriptions.filter((p: PrescriptionEnriched) => p.status === 'ACTIVE');

  const vhi = latestVitals ? computeVhi(latestVitals) : null;

  return (
    <ScrollView
      className="flex-1 bg-cr-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── ADMISSION SUMMARY ─────────────────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel text="Admission Summary" />
        {!patient ? (
          <Skeleton width="100%" height={140} />
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 14,
              gap: 12,
            }}
          >
            {/* Primary diagnosis */}
            <View>
              <Text
                style={{ fontSize: 11, color: colors.muted, marginBottom: 3 }}
              >
                Primary Diagnosis
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'IBMPlexSans_500Medium',
                  color: colors.ink,
                }}
              >
                {patient.primaryDiagnosis ?? 'Not recorded'}
              </Text>
            </View>

            {/* Admission type chip */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                Admission Type
              </Text>
              <View
                style={{
                  backgroundColor: ADMISSION_STYLE[patient.admissionType].bg,
                  paddingHorizontal: 9,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'IBMPlexSans_600SemiBold',
                    color: ADMISSION_STYLE[patient.admissionType].text,
                  }}
                >
                  {patient.admissionType}
                </Text>
              </View>
            </View>

            {/* Previous conditions */}
            <View>
              <Text
                style={{ fontSize: 11, color: colors.muted, marginBottom: 5 }}
              >
                Previous Conditions
              </Text>
              {patient.previousConditions ? (
                <View
                  style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                >
                  {patient.previousConditions.split(',').map((c: string, i: number) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: colors.surface3,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.ink2 }}>
                        {c.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    fontStyle: 'italic',
                  }}
                >
                  None recorded
                </Text>
              )}
            </View>

            {/* Allergies */}
            <View>
              <Text
                style={{ fontSize: 11, color: colors.muted, marginBottom: 5 }}
              >
                Allergies
              </Text>
              {patient.allergies ? (
                <View
                  style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                >
                  {patient.allergies.split(',').map((a: string, i: number) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: colors.dangerBg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{ fontSize: 12, color: colors.danger }}
                      >
                        {a.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    fontStyle: 'italic',
                  }}
                >
                  None recorded
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── LATEST VITALS ─────────────────────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel text="Latest Vitals" />

        {!latestVitals ? (
          /* Amber warning banner */
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.amberBg,
              borderRadius: 10,
              padding: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: '#fde68a',
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_500Medium',
                color: colors.warn,
              }}
            >
              No vitals recorded
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {/* Row 1: Pulse · Sys BP · Dia BP */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <VitalsMiniCard
                label="Pulse"
                value={latestVitals.pulse}
                unit="bpm"
                score={vhi?.pulse}
              />
              <VitalsMiniCard
                label="Sys BP"
                value={latestVitals.systolicBp}
                unit="mmHg"
                score={vhi?.systolicBp}
              />
              <VitalsMiniCard
                label="Dia BP"
                value={latestVitals.diastolicBp}
                unit="mmHg"
              />
            </View>
            {/* Row 2: Resp · Temp · SpO₂ */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <VitalsMiniCard
                label="Resp Rate"
                value={latestVitals.respiratoryRate}
                unit="br/min"
                score={vhi?.respiratoryRate}
              />
              <VitalsMiniCard
                label="Temp"
                value={latestVitals.temperature}
                unit="°C"
                score={vhi?.temperature}
              />
              <VitalsMiniCard
                label="SpO₂"
                value={latestVitals.spo2}
                unit="%"
                score={vhi?.spo2}
              />
            </View>

            {/* VHI summary card */}
            {vhi && (
              <View
                style={{
                  backgroundColor: VHI_CARD_BG[vhi.status],
                  borderRadius: 10,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: VHI_CARD_BORDER[vhi.status],
                  gap: 6,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 40,
                      fontFamily: 'Sora_700Bold',
                      color: colors.ink,
                      lineHeight: 44,
                    }}
                  >
                    {vhi.total}
                  </Text>
                  <VhiBadge score={vhi.total} status={vhi.status} />
                </View>
                <Text
                  style={{ fontSize: 13, color: colors.ink2, lineHeight: 19 }}
                >
                  {VHI_GUIDANCE[vhi.status]}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  Recorded {timeAgo(latestVitals.recordedAt)} by{' '}
                  {latestVitals.recordedByName}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── MOST RECENT NOTE ──────────────────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel text="Most Recent Note" />
        {!latestNote ? (
          <Text
            style={{ fontSize: 13, color: colors.muted, fontStyle: 'italic' }}
          >
            No notes recorded.
          </Text>
        ) : (
          <NoteCard note={latestNote} />
        )}
      </View>

      {/* ── ACTIVE MEDICATIONS ────────────────────────────────────────────── */}
      <View>
        <SectionLabel text="Active Medications" />
        {activeMeds.length === 0 ? (
          <Text
            style={{ fontSize: 13, color: colors.muted, fontStyle: 'italic' }}
          >
            No active medications.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {activeMeds.map((rx: PrescriptionEnriched) => (
              <View
                key={rx.id}
                style={{
                  backgroundColor: '#ccfbf1',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#99f6e4',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'IBMPlexSans_500Medium',
                    color: colors.accent,
                  }}
                >
                  {rx.drugName} {rx.dose}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
