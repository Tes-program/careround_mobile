import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import * as Haptics from 'expo-haptics';
import { usePatientVitals } from '@/hooks/useVitals';
import { useRecordVitals } from '@/hooks/useVitals';
import { Button, EmptyState, Skeleton, VhiBadge } from '@/components/ui';
import { computeVhi, countFilledVitals } from '@/utils/vhi';
import { formatDateTime } from '@/utils/format';
import { colors } from '@/constants/theme';
import type { PatientVitalsEnriched, VhiStatus } from '@/types/domain';

// ── Types ─────────────────────────────────────────────────────────────────────

type Range = '24h' | '48h' | '7d' | 'full';

// Index signature required by CartesianChart's RawData extends Record<string, unknown>
type ChartPoint = {
  ts: number;
  pulse: number | null;
  systolicBp: number | null;
  respRate: number | null;
  temp: number | null;
  spo2: number | null;
  [key: string]: unknown;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '48h', label: '48h' },
  { key: '7d', label: '7d' },
  { key: 'full', label: 'Full' },
];

const LINE_CONFIG = [
  { key: 'pulse' as const, label: 'Pulse', color: '#ef4444' },
  { key: 'systolicBp' as const, label: 'Sys BP', color: '#f97316' },
  { key: 'respRate' as const, label: 'Resp', color: '#3b82f6' },
  { key: 'temp' as const, label: 'Temp', color: '#a855f7' },
  { key: 'spo2' as const, label: 'SpO₂', color: '#14b8a6' },
] as const;

const VHI_CARD_BG: Record<VhiStatus, string> = {
  STABLE: '#f0fdf4',
  WATCH: '#fffbeb',
  CRITICAL: '#fef2f2',
};

const VHI_GUIDANCE: Record<VhiStatus, string> = {
  STABLE: 'Routine monitoring.',
  WATCH: 'Inform the floor doctor or re-check in 2 hours.',
  CRITICAL: 'Urgent medical attention required immediately.',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterByRange(
  vitals: PatientVitalsEnriched[],
  range: Range,
): PatientVitalsEnriched[] {
  if (range === 'full') return vitals;
  const hours = range === '24h' ? 24 : range === '48h' ? 48 : 24 * 7;
  const cutoff = Date.now() - hours * 3_600_000;
  return vitals.filter((v) => new Date(v.recordedAt).getTime() >= cutoff);
}

function toChartData(vitals: PatientVitalsEnriched[]): ChartPoint[] {
  return vitals.map((v) => ({
    ts: new Date(v.recordedAt).getTime() / 1000, // seconds
    pulse: v.pulse ?? null,
    systolicBp: v.systolicBp ?? null,
    respRate: v.respiratoryRate ?? null,
    temp: v.temperature ?? null,
    spo2: v.spo2 ?? null,
  }));
}

function scoreColor(score: number): string {
  if (score === 0) return colors.ink;
  if (score <= 2) return '#d97706';
  return '#dc2626';
}

function scoreSemibold(score: number): string {
  return score === 0 ? 'IBMPlexSans_400Regular' : 'IBMPlexSans_600SemiBold';
}

function fmtAxisDate(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ── Chart legend ──────────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 8,
      }}
    >
      {LINE_CONFIG.map((cfg) => (
        <View
          key={cfg.key}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
        >
          <View
            style={{
              width: 20,
              height: 3,
              backgroundColor: cfg.color,
              borderRadius: 2,
            }}
          />
          <Text style={{ fontSize: 11, color: colors.muted }}>{cfg.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Vitals table ──────────────────────────────────────────────────────────────

function VitalsTable({ vitals }: { vitals: PatientVitalsEnriched[] }) {
  // Reverse-chronological
  const sorted = [...vitals].reverse();

  const cols = [
    'Time',
    'Pulse',
    'Sys BP',
    'Dia BP',
    'Resp',
    'Temp',
    'SpO₂',
    'VHI',
    'By',
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface2,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineStrong,
          }}
        >
          {cols.map((c) => (
            <View
              key={c}
              style={{
                width: c === 'Time' ? 140 : c === 'By' ? 120 : 70,
                paddingHorizontal: 8,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'IBMPlexSans_600SemiBold',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {c}
              </Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {sorted.map((v) => {
          const vhi = computeVhi(v);
          return (
            <View
              key={v.id}
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              {/* Time */}
              <View style={{ width: 140, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, color: colors.ink2 }}>
                  {formatDateTime(v.recordedAt)}
                </Text>
              </View>

              {/* Pulse */}
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: scoreColor(vhi.pulse),
                    fontFamily: scoreSemibold(vhi.pulse),
                  }}
                >
                  {v.pulse ?? '—'}
                </Text>
              </View>

              {/* Sys BP */}
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: scoreColor(vhi.systolicBp),
                    fontFamily: scoreSemibold(vhi.systolicBp),
                  }}
                >
                  {v.systolicBp ?? '—'}
                </Text>
              </View>

              {/* Dia BP (not scored) */}
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: colors.ink }}>
                  {v.diastolicBp ?? '—'}
                </Text>
              </View>

              {/* Resp Rate */}
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: scoreColor(vhi.respiratoryRate),
                    fontFamily: scoreSemibold(vhi.respiratoryRate),
                  }}
                >
                  {v.respiratoryRate ?? '—'}
                </Text>
              </View>

              {/* Temp */}
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: scoreColor(vhi.temperature),
                    fontFamily: scoreSemibold(vhi.temperature),
                  }}
                >
                  {v.temperature ?? '—'}
                </Text>
              </View>

              {/* SpO2 */}
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: scoreColor(vhi.spo2),
                    fontFamily: scoreSemibold(vhi.spo2),
                  }}
                >
                  {v.spo2 ?? '—'}
                </Text>
              </View>

              {/* VHI */}
              <View
                style={{
                  width: 70,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: scoreColor(vhi.total),
                    fontFamily: scoreSemibold(vhi.total),
                  }}
                >
                  {vhi.total} · {vhi.status[0]}
                </Text>
              </View>

              {/* By */}
              <View style={{ width: 120, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Text
                  style={{ fontSize: 12, color: colors.muted }}
                  numberOfLines={1}
                >
                  {v.recordedByName}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Record Vitals modal ───────────────────────────────────────────────────────

interface VitalsInput {
  pulse: string;
  systolicBp: string;
  diastolicBp: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
}

const EMPTY_VITALS: VitalsInput = {
  pulse: '',
  systolicBp: '',
  diastolicBp: '',
  respiratoryRate: '',
  temperature: '',
  spo2: '',
};

function RecordVitalsModal({
  visible,
  patientId,
  onClose,
}: {
  visible: boolean;
  patientId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<VitalsInput>(EMPTY_VITALS);
  const recordMutation = useRecordVitals();

  React.useEffect(() => {
    if (visible) setForm(EMPTY_VITALS);
  }, [visible]);

  // Live VHI
  const filledCount = countFilledVitals(form);
  const liveVhi =
    filledCount >= 2
      ? computeVhi({
          pulse: form.pulse ? Number(form.pulse) : undefined,
          systolicBp: form.systolicBp ? Number(form.systolicBp) : undefined,
          respiratoryRate: form.respiratoryRate
            ? Number(form.respiratoryRate)
            : undefined,
          temperature: form.temperature ? Number(form.temperature) : undefined,
          spo2: form.spo2 ? Number(form.spo2) : undefined,
        })
      : null;

  async function handleSave() {
    // Warn if CRITICAL VHI is detected before saving
    if (liveVhi?.status === 'CRITICAL') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    try {
      await recordMutation.mutateAsync({
        patientId,
        data: {
          pulse: form.pulse ? Number(form.pulse) : undefined,
          systolicBp: form.systolicBp ? Number(form.systolicBp) : undefined,
          diastolicBp: form.diastolicBp ? Number(form.diastolicBp) : undefined,
          respiratoryRate: form.respiratoryRate
            ? Number(form.respiratoryRate)
            : undefined,
          temperature: form.temperature ? Number(form.temperature) : undefined,
          spo2: form.spo2 ? Number(form.spo2) : undefined,
          recordedAt: new Date().toISOString(),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
    } catch {
      /* handled */
    }
  }

  const vhiCardBg = liveVhi ? VHI_CARD_BG[liveVhi.status] : colors.surface3;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
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
            maxHeight: '94%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'IBMPlexSans_700Bold',
                color: colors.ink,
              }}
            >
              Record Vitals
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 24, color: colors.muted, lineHeight: 26 }}>
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Live VHI preview panel */}
            <View
              style={{
                backgroundColor: vhiCardBg,
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: liveVhi
                  ? liveVhi.status === 'STABLE'
                    ? '#bbf7d0'
                    : liveVhi.status === 'WATCH'
                    ? '#fde68a'
                    : '#fecaca'
                  : colors.line,
              }}
            >
              {!liveVhi ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  Fill in vitals to see score
                </Text>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.muted,
                      fontFamily: 'IBMPlexSans_600SemiBold',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 8,
                    }}
                  >
                    Vitals Health Index
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 42,
                        fontFamily: 'Sora_700Bold',
                        color: colors.ink,
                        lineHeight: 48,
                      }}
                    >
                      {liveVhi.total}
                    </Text>
                    <VhiBadge score={liveVhi.total} status={liveVhi.status} />
                  </View>
                  <Text
                    style={{ fontSize: 13, color: colors.ink2, lineHeight: 19 }}
                  >
                    {VHI_GUIDANCE[liveVhi.status]}
                  </Text>

                  {/* Critical warning */}
                  {liveVhi.status === 'CRITICAL' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        backgroundColor: colors.dangerBg,
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 10,
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 14, marginTop: 1 }}>🚨</Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: colors.danger,
                          fontFamily: 'IBMPlexSans_500Medium',
                          lineHeight: 19,
                        }}
                      >
                        This patient will be flagged as Critical. A supervisor
                        alert will be sent.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Input grid — 2 columns */}
            {(
              [
                { label: 'Pulse', key: 'pulse' as const, unit: 'bpm' },
                {
                  label: 'Systolic BP',
                  key: 'systolicBp' as const,
                  unit: 'mmHg',
                },
                {
                  label: 'Diastolic BP',
                  key: 'diastolicBp' as const,
                  unit: 'mmHg',
                  hint: 'Stored for reference — not scored',
                },
                {
                  label: 'Resp Rate',
                  key: 'respiratoryRate' as const,
                  unit: 'br/min',
                },
                {
                  label: 'Temperature',
                  key: 'temperature' as const,
                  unit: '°C',
                },
                { label: 'SpO₂', key: 'spo2' as const, unit: '%' },
              ] as const
            ).reduce<React.ReactNode[]>((rows, field, i, arr) => {
              if (i % 2 === 0) {
                const next = arr[i + 1];
                rows.push(
                  <View
                    key={field.key}
                    style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}
                  >
                    <VitalInput
                      label={field.label}
                      unit={field.unit}
                      hint={(field as { hint?: string }).hint}
                      value={form[field.key]}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, [field.key]: v }))
                      }
                    />
                    {next ? (
                      <VitalInput
                        label={next.label}
                        unit={next.unit}
                        hint={(next as { hint?: string }).hint}
                        value={form[next.key]}
                        onChange={(v) =>
                          setForm((f) => ({ ...f, [next.key]: v }))
                        }
                      />
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                  </View>,
                );
              }
              return rows;
            }, [])}

            {/* Buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 4,
                paddingBottom: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  size="md"
                  onPress={onClose}
                  disabled={recordMutation.isPending}
                >
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleSave}
                  loading={recordMutation.isPending}
                  disabled={filledCount === 0 || recordMutation.isPending}
                >
                  Record
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function VitalInput({
  label,
  unit,
  hint,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
        {label} <Text style={{ color: colors.muted }}>({unit})</Text>
      </Text>
      {hint ? (
        <Text
          style={{
            fontSize: 10,
            color: colors.muted,
            fontStyle: 'italic',
            marginBottom: 3,
          }}
          numberOfLines={2}
        >
          {hint}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={label === 'Temperature' ? 'decimal-pad' : 'numeric'}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 8,
          fontSize: 14,
          color: colors.ink,
          fontFamily: 'IBMPlexSans_400Regular',
          backgroundColor: colors.surface2,
        }}
      />
    </View>
  );
}

// ── VitalsTab ─────────────────────────────────────────────────────────────────

interface VitalsTabProps {
  patientId: string;
  canWrite: boolean;
}

export function VitalsTab({ patientId, canWrite }: VitalsTabProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 32;

  const [range, setRange] = useState<Range>('48h');
  const [recordVisible, setRecordVisible] = useState(false);

  const { data: vitals = [], isLoading } = usePatientVitals(patientId);

  // Load font for axis labels (optional — labels won't show if null)
  const axisFont = useFont(IBMPlexMono_400Regular, 10);

  const filtered = filterByRange(vitals, range);
  const chartData = toChartData(filtered);

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
          <Button
            variant="primary"
            size="sm"
            onPress={() => setRecordVisible(true)}
          >
            Record Vitals
          </Button>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="100%" height={220} />
          <Skeleton width="100%" height={100} />
        </View>
      ) : vitals.length === 0 ? (
        <EmptyState
          message="No vitals recorded"
          sub="Record the first set of vitals to see the chart."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Range filter buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            {RANGE_OPTIONS.map((opt) => {
              const active = range === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setRange(opt.key)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.line,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'IBMPlexSans_500Medium',
                      color: active ? '#fff' : colors.ink2,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <ChartLegend />

          {/* Chart */}
          {chartData.length < 2 ? (
            <View
              style={{
                height: 220,
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.muted, fontStyle: 'italic' }}>
                Not enough data for the selected range.
              </Text>
            </View>
          ) : (
            <View
              style={{
                height: 220,
                paddingHorizontal: 16,
              }}
            >
              <CartesianChart
                data={chartData}
                xKey="ts"
                yKeys={['pulse', 'systolicBp', 'respRate', 'temp', 'spo2']}
                domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
                axisOptions={{
                  font: axisFont,
                  formatXLabel: fmtAxisDate,
                  labelColor: colors.muted,
                  lineColor: colors.line,
                  tickCount: Math.min(chartData.length, 5),
                }}
              >
                {({ points }) => (
                  <>
                    <Line
                      points={points.pulse}
                      color="#ef4444"
                      strokeWidth={2}
                      connectMissingData
                    />
                    <Line
                      points={points.systolicBp}
                      color="#f97316"
                      strokeWidth={2}
                      connectMissingData
                    />
                    <Line
                      points={points.respRate}
                      color="#3b82f6"
                      strokeWidth={2}
                      connectMissingData
                    />
                    <Line
                      points={points.temp}
                      color="#a855f7"
                      strokeWidth={2}
                      connectMissingData
                    />
                    <Line
                      points={points.spo2}
                      color="#14b8a6"
                      strokeWidth={2}
                      connectMissingData
                    />
                  </>
                )}
              </CartesianChart>
            </View>
          )}

          {/* Vitals table */}
          <View
            style={{
              marginTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.line,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                fontFamily: 'IBMPlexSans_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              All Readings
            </Text>
            <VitalsTable vitals={vitals} />
          </View>
        </ScrollView>
      )}

      {/* Record Vitals modal */}
      <RecordVitalsModal
        visible={recordVisible}
        patientId={patientId}
        onClose={() => setRecordVisible(false)}
      />
    </View>
  );
}
