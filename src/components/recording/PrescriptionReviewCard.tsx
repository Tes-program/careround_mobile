import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius } from '@/constants/theme';
import type { AiPrescription } from '@/types/domain';

// ── Time chip ─────────────────────────────────────────────────────────────────

function formatTimeChip(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return iso;
  }
}

// ── Inline label + input helper ───────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  style?: object;
}

function InlineField({ label, value, onChange, placeholder, keyboardType = 'default', style }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'IBMPlexSans_600SemiBold',
          color: colors.muted,
          marginBottom: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.line,
          borderRadius: radius.md,
          paddingHorizontal: 10,
          paddingVertical: 8,
          fontSize: 13,
          fontFamily: 'IBMPlexSans_400Regular',
          color: colors.ink,
          backgroundColor: colors.surface,
        }}
      />
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PrescriptionReviewCardProps {
  prescription: AiPrescription;
  onEdit: (updated: AiPrescription) => void;
  onRemove: () => void;
  /** When true, card mounts directly in edit mode (e.g. newly added). */
  isNew?: boolean;
}

export function PrescriptionReviewCard({
  prescription,
  onEdit,
  onRemove,
  isNew = false,
}: PrescriptionReviewCardProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [draft, setDraft] = useState<AiPrescription>(prescription);
  const [errors, setErrors] = useState<{ drugName?: string; dose?: string }>({});

  // Keep draft in sync when the prescription prop changes (e.g. parent resets)
  useEffect(() => {
    if (!isEditing) setDraft(prescription);
  }, [prescription, isEditing]);

  // ── Edit mode ──────────────────────────────────────────────────────────────

  function handleSave() {
    const newErrors: typeof errors = {};
    if (!draft.drugName.trim()) newErrors.drugName = 'Required';
    if (!draft.dose.trim()) newErrors.dose = 'Required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onEdit(draft);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    if (isNew) {
      // Cancelling a brand-new card → remove it
      onRemove();
    } else {
      setDraft(prescription);
      setErrors({});
      setIsEditing(false);
    }
  }

  function set(field: keyof AiPrescription, value: string | number) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  if (isEditing) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.accent,
          borderRadius: radius.lg,
          padding: 14,
          backgroundColor: colors.surface,
          gap: 10,
        }}
      >
        {/* 2-col grid */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InlineField
            label="Drug Name"
            value={draft.drugName}
            onChange={(v) => set('drugName', v)}
            placeholder="e.g. Bisoprolol"
            style={{ flex: 1 }}
          />
          <InlineField
            label="Dose"
            value={draft.dose}
            onChange={(v) => set('dose', v)}
            placeholder="e.g. 1.25mg"
            style={{ flex: 1 }}
          />
        </View>
        {(errors.drugName || errors.dose) ? (
          <Text style={{ fontSize: 12, color: colors.danger, fontFamily: 'IBMPlexSans_400Regular' }}>
            {errors.drugName ?? errors.dose}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InlineField
            label="Route"
            value={draft.route}
            onChange={(v) => set('route', v)}
            placeholder="e.g. Oral"
            style={{ flex: 1 }}
          />
          <InlineField
            label="Frequency (hrs)"
            value={draft.frequencyHours > 0 ? String(draft.frequencyHours) : ''}
            onChange={(v) => set('frequencyHours', parseInt(v, 10) || 0)}
            placeholder="e.g. 24"
            keyboardType="numeric"
            style={{ flex: 1 }}
          />
        </View>

        <InlineField
          label="Total Doses"
          value={draft.totalDoses > 0 ? String(draft.totalDoses) : ''}
          onChange={(v) => set('totalDoses', parseInt(v, 10) || 0)}
          placeholder="e.g. 7"
          keyboardType="numeric"
        />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Pressable
            onPress={handleCancelEdit}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_500Medium',
                color: colors.ink2,
              }}
            >
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_600SemiBold',
                color: '#fff',
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Remove confirmation ────────────────────────────────────────────────────

  if (confirmRemove) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: radius.lg,
          padding: 14,
          backgroundColor: colors.dangerBg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'IBMPlexSans_500Medium',
            color: colors.danger,
            flex: 1,
          }}
          numberOfLines={1}
        >
          Remove {prescription.drugName}?
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setConfirmRemove(false)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.danger,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_500Medium',
                color: colors.danger,
              }}
            >
              Keep
            </Text>
          </Pressable>
          <Pressable
            onPress={onRemove}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.md,
              backgroundColor: colors.danger,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'IBMPlexSans_600SemiBold',
                color: '#fff',
              }}
            >
              Remove
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.lg,
        padding: 14,
        backgroundColor: colors.surface,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'IBMPlexSans_700Bold',
            color: colors.ink,
            flex: 1,
            marginRight: 8,
          }}
          numberOfLines={1}
        >
          {prescription.drugName}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Edit */}
          <Pressable
            onPress={() => setIsEditing(true)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 15, color: colors.muted }}>✎</Text>
          </Pressable>
          {/* Remove */}
          <Pressable
            onPress={() => setConfirmRemove(true)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 15, color: colors.muted }}>🗑</Text>
          </Pressable>
        </View>
      </View>

      {/* Dose & route */}
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'IBMPlexSans_400Regular',
          color: colors.ink2,
          marginBottom: 2,
        }}
      >
        {prescription.dose}
        {prescription.route ? ` — ${prescription.route}` : ''}
      </Text>

      {/* Frequency & total doses */}
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'IBMPlexSans_400Regular',
          color: colors.muted,
          marginBottom: 10,
        }}
      >
        {prescription.frequencyString}
        {prescription.totalDoses > 0 ? ` · ${prescription.totalDoses} doses` : ''}
      </Text>

      {/* Time chips */}
      {prescription.administrationTimes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {prescription.administrationTimes.map((t, i) => (
            <View
              key={i}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.sm,
                backgroundColor: colors.surface3,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'IBMPlexMono_400Regular',
                  color: colors.muted,
                }}
              >
                {formatTimeChip(t)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
