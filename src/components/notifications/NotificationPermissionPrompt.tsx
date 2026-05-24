/**
 * NotificationPermissionPrompt
 * Full-screen explanation modal shown once before requesting the OS
 * notification permission dialog. Appears on the nurse's first visit to the
 * task list screen (controlled by the cr_notif_prompted SecureStore flag).
 */
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius } from '@/constants/theme';

export interface NotificationPermissionPromptProps {
  onAllow: () => void;
  onSkip: () => void;
}

export function NotificationPermissionPrompt({
  onAllow,
  onSkip,
}: NotificationPermissionPromptProps) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* Bell icon */}
        <Text style={{ fontSize: 80, marginBottom: 32 }}>🔔</Text>

        {/* Title */}
        <Text
          style={{
            fontFamily: fontFamily.sansBold,
            fontSize: fontSize['2xl'],
            color: colors.ink,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Stay on top of medication tasks
        </Text>

        {/* Body */}
        <Text
          style={{
            fontFamily: fontFamily.sans,
            fontSize: fontSize.sm,
            color: colors.ink2,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 20,
            marginBottom: 32,
          }}
        >
          CareRound will notify you when a medication task becomes overdue so
          no dose is missed.
        </Text>

        {/* Primary: Enable Notifications */}
        <Pressable
          onPress={onAllow}
          style={({ pressed }) => ({
            width: '100%',
            backgroundColor: colors.accent,
            borderRadius: radius.lg,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 12,
            opacity: pressed ? 0.85 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Enable Notifications"
        >
          <Text
            style={{
              fontFamily: fontFamily.sansSemiBold,
              fontSize: fontSize.base,
              color: '#ffffff',
            }}
          >
            Enable Notifications
          </Text>
        </Pressable>

        {/* Ghost: Not now */}
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => ({
            width: '100%',
            paddingVertical: 14,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text
            style={{
              fontFamily: fontFamily.sansMedium,
              fontSize: fontSize.base,
              color: colors.muted,
            }}
          >
            Not now
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
