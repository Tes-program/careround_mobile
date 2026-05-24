import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import type { AdministrationSlot } from '@/types/domain';

// ── State resolution ──────────────────────────────────────────────────────────

type SlotState = 'completed' | 'overdue' | 'due_soon' | 'upcoming';

function resolveState(slot: AdministrationSlot): SlotState {
  if (slot.completedAt) return 'completed';
  const now = Date.now();
  const scheduled = new Date(slot.scheduledTime).getTime();
  const diffMin = (scheduled - now) / 60_000;
  if (diffMin < 0) return 'overdue';
  if (diffMin <= 30) return 'due_soon';
  return 'upcoming';
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATE_STYLE: Record<
  SlotState,
  { bg: string; text: string; suffix: string }
> = {
  completed: { bg: '#16a34a', text: '#ffffff', suffix: ' ✓' },
  overdue:   { bg: '#dc2626', text: '#ffffff', suffix: ' !' },
  due_soon:  { bg: '#d97706', text: '#ffffff', suffix: '' },
  upcoming:  { bg: colors.surface3, text: colors.muted, suffix: '' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface TimeChipProps {
  slot: AdministrationSlot;
}

export function TimeChip({ slot }: TimeChipProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const state = resolveState(slot);
  const s = STATE_STYLE[state];

  return (
    <>
      <Pressable
        onLongPress={() => {
          if (state === 'completed' && slot.completedByName) {
            setTooltipVisible(true);
          }
        }}
        style={{
          backgroundColor: s.bg,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          alignSelf: 'flex-start',
          marginBottom: 3,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: s.text,
            fontFamily: 'IBMPlexMono_400Regular',
          }}
        >
          {fmtTime(slot.scheduledTime)}{s.suffix}
        </Text>
      </Pressable>

      {/* Long-press tooltip */}
      <Modal
        transparent
        animationType="fade"
        visible={tooltipVisible}
        onRequestClose={() => setTooltipVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setTooltipVisible(false)}
        >
          <View
            style={{
              backgroundColor: colors.ink,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
              maxWidth: 260,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, lineHeight: 18 }}>
              Administered by {slot.completedByName}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
