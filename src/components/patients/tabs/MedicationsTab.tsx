import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  usePatientPrescriptions,
  useAddPrescription,
  useUpdatePrescription,
  useDiscontinuePrescription,
} from '@/hooks/usePrescriptions';
import { TimeChip } from '@/components/patients/TimeChip';
import { Button, ConfirmModal, EmptyState, Skeleton } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { AdministrationSlot, PrescriptionEnriched } from '@/types/domain';
import type { CreatePrescriptionRequest, UpdatePrescriptionRequest } from '@/services/prescriptions.service';

// ── Layout constants ──────────────────────────────────────────────────────────

const LEFT_COL = 200;
const DAY_COL = 90;
const HEADER_H = 44;
const ROW_H = 100;
const ROW_H_DISC = 72;

// ── Date helpers ──────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface DayColumn {
  dateStr: string;   // YYYY-MM-DD
  label: string;     // "Mon 19"
  isToday: boolean;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDayColumns(): DayColumn[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cols: DayColumn[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    cols.push({
      dateStr: toDateStr(d),
      label: `${DAY_LABELS[d.getDay()]} ${d.getDate()}`,
      isToday: i === 0,
    });
  }
  return cols;
}

function slotsForDay(
  slots: AdministrationSlot[],
  dateStr: string,
): AdministrationSlot[] {
  return slots.filter((s) => s.scheduledTime.startsWith(dateStr));
}

// ── Medication form modal ─────────────────────────────────────────────────────

interface MedFormState {
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: string;
  totalDoses: string;
  startTime: Date;
}

const EMPTY_FORM: MedFormState = {
  drugName: '',
  dose: '',
  route: '',
  frequencyString: '',
  frequencyHours: '12',
  totalDoses: '6',
  startTime: new Date(),
};

function fromPrescription(rx: PrescriptionEnriched): MedFormState {
  return {
    drugName: rx.drugName,
    dose: rx.dose,
    route: rx.route,
    frequencyString: rx.frequencyString,
    frequencyHours: String(rx.frequencyHours),
    totalDoses: String(rx.totalDoses),
    startTime: new Date(rx.startTime),
  };
}

interface MedFormModalProps {
  visible: boolean;
  title: string;
  initialState: MedFormState;
  loading: boolean;
  onClose: () => void;
  onSave: (form: MedFormState) => void;
}

function MedFormModal({
  visible,
  title,
  initialState,
  loading,
  onClose,
  onSave,
}: MedFormModalProps) {
  const [form, setForm] = useState<MedFormState>(initialState);
  const [showPicker, setShowPicker] = useState(false);

  // Reset when modal opens
  React.useEffect(() => {
    if (visible) setForm(initialState);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  function field(label: string, key: keyof MedFormState, opts?: { numeric?: boolean; hint?: string }) {
    const value = key === 'startTime' ? '' : String(form[key]);
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{label}</Text>
        {opts?.hint ? (
          <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4, fontStyle: 'italic' }}>
            {opts.hint}
          </Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
          keyboardType={opts?.numeric ? 'numeric' : 'default'}
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

  const valid =
    form.drugName.trim() &&
    form.dose.trim() &&
    form.route.trim() &&
    form.frequencyHours.trim() &&
    form.totalDoses.trim();

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
              {title}
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
            {field('Drug Name', 'drugName')}
            {field('Dose', 'dose')}
            {field('Route', 'route')}
            {field('Frequency Description', 'frequencyString')}
            {field('Frequency (hours between doses)', 'frequencyHours', { numeric: true })}
            {field('Total Doses', 'totalDoses', { numeric: true })}

            {/* Start Time */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                Start Time
              </Text>
              <Pressable
                onPress={() => setShowPicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  backgroundColor: colors.surface2,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.ink }}>
                  {form.startTime.toLocaleString()}
                </Text>
              </Pressable>
            </View>

            {showPicker && (
              <DateTimePicker
                value={form.startTime}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_e, date) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (date) setForm((f) => ({ ...f, startTime: date }));
                }}
              />
            )}

            {/* Footer buttons */}
            <View
              style={{ flexDirection: 'row', gap: 12, marginTop: 4, paddingBottom: 8 }}
            >
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  size="md"
                  onPress={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  size="md"
                  onPress={() => onSave(form)}
                  loading={loading}
                  disabled={!valid || loading}
                >
                  Save
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── MAR Table ─────────────────────────────────────────────────────────────────

interface MARTableProps {
  prescriptions: PrescriptionEnriched[];
  days: DayColumn[];
  canWrite: boolean;
  onEdit: (rx: PrescriptionEnriched) => void;
  onDiscontinue: (rx: PrescriptionEnriched) => void;
}

function MARTable({ prescriptions, days, canWrite, onEdit, onDiscontinue }: MARTableProps) {
  return (
    /* Outer vertical scroll */
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row' }}>
        {/* ── Sticky left column ── */}
        <View
          style={{
            width: LEFT_COL,
            borderRightWidth: 1,
            borderRightColor: colors.lineStrong,
          }}
        >
          {/* Header cell */}
          <View
            style={{
              height: HEADER_H,
              backgroundColor: colors.surface2,
              borderBottomWidth: 1,
              borderBottomColor: colors.lineStrong,
              justifyContent: 'center',
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'IBMPlexSans_600SemiBold',
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Medication
            </Text>
          </View>

          {/* Medication rows */}
          {prescriptions.map((rx) => {
            const isDisc = rx.status === 'DISCONTINUED';
            const rowH = isDisc ? ROW_H_DISC : ROW_H;
            return (
              <View
                key={rx.id}
                style={{
                  height: rowH,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  justifyContent: 'space-between',
                  opacity: isDisc ? 0.5 : 1,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'IBMPlexSans_600SemiBold',
                      color: colors.ink,
                    }}
                    numberOfLines={1}
                  >
                    {rx.drugName} {rx.dose}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}
                    numberOfLines={1}
                  >
                    {rx.route} · {rx.frequencyString}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.muted }}
                    numberOfLines={1}
                  >
                    {rx.totalDoses} doses · {rx.confirmedByName}
                  </Text>
                </View>

                {/* Action row */}
                {isDisc ? (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: colors.surface3,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      Discontinued
                    </Text>
                  </View>
                ) : canWrite ? (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable onPress={() => onEdit(rx)}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.accent,
                          fontFamily: 'IBMPlexSans_500Medium',
                        }}
                      >
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => onDiscontinue(rx)}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.danger,
                          fontFamily: 'IBMPlexSans_500Medium',
                        }}
                      >
                        Discontinue
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* ── Scrollable day columns ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Day header row */}
            <View
              style={{
                flexDirection: 'row',
                height: HEADER_H,
                backgroundColor: colors.surface2,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineStrong,
              }}
            >
              {days.map((day) => (
                <View
                  key={day.dateStr}
                  style={{
                    width: DAY_COL,
                    height: HEADER_H,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: day.isToday ? '#e0f7fa' : 'transparent',
                    borderLeftWidth: day.isToday ? 2 : 0,
                    borderLeftColor: colors.accent,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: day.isToday ? 'IBMPlexSans_600SemiBold' : 'IBMPlexSans_400Regular',
                      color: day.isToday ? colors.accent : colors.muted,
                    }}
                  >
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {prescriptions.map((rx) => {
              const isDisc = rx.status === 'DISCONTINUED';
              const rowH = isDisc ? ROW_H_DISC : ROW_H;
              return (
                <View
                  key={rx.id}
                  style={{
                    flexDirection: 'row',
                    height: rowH,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                    opacity: isDisc ? 0.5 : 1,
                  }}
                >
                  {days.map((day) => {
                    const slots = slotsForDay(rx.administrationTimes, day.dateStr);
                    return (
                      <View
                        key={day.dateStr}
                        style={{
                          width: DAY_COL,
                          height: rowH,
                          backgroundColor: day.isToday ? '#f0fdfa' : 'transparent',
                          borderLeftWidth: day.isToday ? 2 : 0,
                          borderLeftColor: day.isToday ? colors.accent : 'transparent',
                          padding: 4,
                          justifyContent: 'flex-start',
                        }}
                      >
                        {slots.map((slot, i) => (
                          <TimeChip key={i} slot={slot} />
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

// ── MedicationsTab ────────────────────────────────────────────────────────────

interface MedicationsTabProps {
  patientId: string;
  canWrite: boolean;
}

export function MedicationsTab({ patientId, canWrite }: MedicationsTabProps) {
  const days = React.useMemo(() => buildDayColumns(), []);

  const [addVisible, setAddVisible] = useState(false);
  const [editRx, setEditRx] = useState<PrescriptionEnriched | null>(null);
  const [discontinueRx, setDiscontinueRx] = useState<PrescriptionEnriched | null>(null);

  const { data: prescriptions = [], isLoading } = usePatientPrescriptions(patientId);
  const addMutation = useAddPrescription();
  const updateMutation = useUpdatePrescription();
  const discontinueMutation = useDiscontinuePrescription();

  async function handleAdd(form: MedFormState) {
    const req: CreatePrescriptionRequest = {
      drugName: form.drugName.trim(),
      dose: form.dose.trim(),
      route: form.route.trim(),
      frequencyString: form.frequencyString.trim(),
      frequencyHours: Number(form.frequencyHours),
      totalDoses: Number(form.totalDoses),
      startTime: form.startTime.toISOString(),
    };
    try {
      await addMutation.mutateAsync({ patientId, data: req });
      setAddVisible(false);
    } catch {
      /* handled */
    }
  }

  async function handleUpdate(form: MedFormState) {
    if (!editRx) return;
    const req: UpdatePrescriptionRequest = {
      drugName: form.drugName.trim(),
      dose: form.dose.trim(),
      route: form.route.trim(),
      frequencyString: form.frequencyString.trim(),
      frequencyHours: Number(form.frequencyHours),
      totalDoses: Number(form.totalDoses),
    };
    try {
      await updateMutation.mutateAsync({ prescriptionId: editRx.id, patientId, data: req });
      setEditRx(null);
    } catch {
      /* handled */
    }
  }

  async function handleDiscontinue() {
    if (!discontinueRx) return;
    try {
      await discontinueMutation.mutateAsync({
        prescriptionId: discontinueRx.id,
        patientId,
      });
      setDiscontinueRx(null);
    } catch {
      /* handled */
    }
  }

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
            variant="outline"
            size="sm"
            onPress={() => setAddVisible(true)}
          >
            + Add Medication
          </Button>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={{ padding: 16, gap: 8 }}>
          <Skeleton width="100%" height={44} />
          <Skeleton width="100%" height={100} />
          <Skeleton width="100%" height={100} />
        </View>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          message="No medications prescribed"
          sub="Prescriptions will appear here after a ward round."
        />
      ) : (
        <MARTable
          prescriptions={prescriptions}
          days={days}
          canWrite={canWrite}
          onEdit={(rx) => setEditRx(rx)}
          onDiscontinue={(rx) => setDiscontinueRx(rx)}
        />
      )}

      {/* Add medication modal */}
      <MedFormModal
        visible={addVisible}
        title="Add Medication"
        initialState={EMPTY_FORM}
        loading={addMutation.isPending}
        onClose={() => setAddVisible(false)}
        onSave={handleAdd}
      />

      {/* Edit medication modal */}
      <MedFormModal
        visible={!!editRx}
        title="Edit Medication"
        initialState={editRx ? fromPrescription(editRx) : EMPTY_FORM}
        loading={updateMutation.isPending}
        onClose={() => setEditRx(null)}
        onSave={handleUpdate}
      />

      {/* Discontinue confirm */}
      <ConfirmModal
        visible={!!discontinueRx}
        onClose={() => setDiscontinueRx(null)}
        onConfirm={handleDiscontinue}
        title={`Discontinue ${discontinueRx?.drugName ?? ''}?`}
        body="All future scheduled doses will be cancelled."
        confirmLabel="Discontinue"
        variant="destructive"
        loading={discontinueMutation.isPending}
      />
    </View>
  );
}
