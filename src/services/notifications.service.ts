/**
 * notifications.service.ts
 * Owns all FCM / push-notification logic:
 *   - Permission request
 *   - Token retrieval
 *   - Notification handler configuration
 *   - Payload parsing
 *   - Badge management
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ── Payload shape sent by careround-notification service ──────────────────────

export interface NotificationData {
  taskId: string;
  patientId: string;
  patientName: string;
  drugName: string;
  dose: string;
  minutesOverdue: string;
  type: 'MEDICATION_TASK_OVERDUE';
}

// ── Permission ────────────────────────────────────────────────────────────────

/**
 * Request notification permission from the OS.
 * Returns true if granted; false otherwise.
 * Silently returns false on simulators/emulators.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the Expo push token (routes through Expo's push gateway).
 * Requires the EAS project ID from app config.
 * Returns null if unavailable.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const cfg = Constants.expoConfig as Record<string, unknown> | null | undefined;
    const extra = cfg?.['extra'] as Record<string, unknown> | null | undefined;
    const eas = extra?.['eas'] as Record<string, unknown> | null | undefined;
    const projectId = (eas?.['projectId'] ?? cfg?.['projectId']) as string | undefined;
    if (!projectId) return null;
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Returns the raw FCM device push token used by the careround-notification
 * service to call Firebase Admin SDK directly.
 * Returns null on failure — never throws.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const result = await Notifications.getDevicePushTokenAsync();
    return result.data;
  } catch {
    return null;
  }
}

// ── Notification handler ──────────────────────────────────────────────────────

/**
 * Configure how notifications behave when the app is foregrounded.
 * Must be called once before any notification can arrive — call at module
 * level in the root layout so it is set up before navigation mounts.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ── Payload parsing ───────────────────────────────────────────────────────────

/**
 * Safely extract and validate the NotificationData from a notification.
 * Returns null if the payload is missing required fields or is not a
 * MEDICATION_TASK_OVERDUE event.
 */
export function parseNotificationData(
  notification: Notifications.Notification,
): NotificationData | null {
  try {
    const raw = notification.request.content.data as Record<string, unknown> | null | undefined;
    if (!raw) return null;
    if (raw['type'] !== 'MEDICATION_TASK_OVERDUE') return null;

    const taskId = raw['taskId'];
    const patientId = raw['patientId'];
    const patientName = raw['patientName'];
    const drugName = raw['drugName'];
    const dose = raw['dose'];
    const minutesOverdue = raw['minutesOverdue'];

    if (!taskId || !patientId || !patientName || !drugName || !dose || !minutesOverdue) return null;

    return {
      taskId: String(taskId),
      patientId: String(patientId),
      patientName: String(patientName),
      drugName: String(drugName),
      dose: String(dose),
      minutesOverdue: String(minutesOverdue),
      type: 'MEDICATION_TASK_OVERDUE',
    };
  } catch {
    return null;
  }
}

// ── Badge ─────────────────────────────────────────────────────────────────────

/** Set the app icon badge count. Silently no-ops on failure. */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // fail silently
  }
}

/** Clear the app icon badge. Silently no-ops on failure. */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // fail silently
  }
}
