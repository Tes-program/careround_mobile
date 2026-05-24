import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'destructive';
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        onPress={onClose}
      >
        {/* Panel — stop propagation to backdrop */}
        <Pressable
          onPress={() => {
            /* intentionally empty — prevents backdrop dismiss */
          }}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            width: '100%',
            maxWidth: 360,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.16,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontFamily: 'IBMPlexSans_600SemiBold',
                color: colors.ink,
                flex: 1,
                marginRight: 12,
              }}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={{ fontSize: 22, color: colors.muted, lineHeight: 24, marginTop: -2 }}
              >
                ×
              </Text>
            </Pressable>
          </View>

          {/* Body */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
            {typeof body === 'string' ? (
              <Text style={{ fontSize: 15, color: colors.ink2, lineHeight: 22 }}>{body}</Text>
            ) : (
              body
            )}
          </View>

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            <View style={{ flex: 1 }}>
              <Button variant="outline" size="md" onPress={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant={variant} size="md" onPress={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
