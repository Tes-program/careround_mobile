import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../types/domain';
import type { User, Role } from '../types/domain';

interface AuthState {
  user: User | null;
  role: Role | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, role: Role, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  /**
   * Register (or re-register) the device's FCM push token with the backend.
   * Fire-and-forget — never blocks or throws; all failures are silent.
   * Respects cr_notif_denied (skips if nurse declined permission).
   * Skips requesting OS permission on first run — the custom in-app prompt
   * (NotificationPermissionPrompt) sets cr_notif_prompted first so the OS
   * dialog only appears after the nurse has seen an explanation.
   */
  registerDeviceToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, role, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
      SecureStore.setItemAsync(STORAGE_KEYS.ROLE, role),
    ]);
    set({ user, role, accessToken, isAuthenticated: true, isLoading: false });

    // Fire-and-forget FCM registration for nurses.
    // registerDeviceToken respects cr_notif_denied and cr_notif_prompted, so
    // on first login it will skip (let the in-app prompt handle it); on
    // subsequent logins it silently re-registers the (possibly rotated) token.
    if (role === 'NURSE') {
      get().registerDeviceToken().catch(() => {});
    }
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
      SecureStore.deleteItemAsync(STORAGE_KEYS.ROLE),
    ]);
    set({ user: null, role: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user });
  },

  setAccessToken: (token) => {
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    set({ accessToken: token });
  },

  logout: async () => {
    // Fire-and-forget — a failed server-side logout must never block local logout.
    // Dynamic import breaks: auth.store → auth.service → axios → auth.store circular dep.
    import('../services/auth.service').then(({ authService }) => {
      authService.logout().catch(() => {});
    });

    await get().clearAuth();

    const { router } = await import('expo-router');
    router.replace('/login');
  },

  hydrateFromStorage: async () => {
    set({ isLoading: true });
    try {
      const [token, roleRaw, userRaw] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.ROLE),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
      ]);

      if (!token || !roleRaw || !userRaw) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Dynamic import breaks the circular dependency with axios.ts at module load time
      const { apiClient } = await import('../lib/axios');
      const response = await apiClient.get<User>('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const liveUser: User = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(liveUser));
      set({
        user: liveUser,
        role: liveUser.role,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Re-register FCM token for nurses in case it has rotated since last login.
      if (liveUser.role === 'NURSE') {
        SecureStore.getItemAsync(STORAGE_KEYS.NOTIF_DENIED).then((denied) => {
          if (!denied) {
            get().registerDeviceToken().catch(() => {});
          }
        });
      }
    } catch {
      await get().clearAuth();
    }
  },

  registerDeviceToken: async () => {
    try {
      // Only physical devices can receive FCM tokens — skip on simulators/emulators
      const { isDevice } = await import('expo-device');
      if (!isDevice) return;

      // Respect previous opt-out
      const denied = await SecureStore.getItemAsync(STORAGE_KEYS.NOTIF_DENIED);
      if (denied) return;

      // Do not show the OS permission dialog until our in-app explanation screen
      // (NotificationPermissionPrompt) has been shown. That screen sets
      // cr_notif_prompted before calling registerDeviceToken().
      // On subsequent calls permission is already granted, so this is a no-op guard.
      const prompted = await SecureStore.getItemAsync(STORAGE_KEYS.NOTIF_PROMPTED);
      if (!prompted) {
        const Notifs = await import('expo-notifications');
        const { status } = await Notifs.getPermissionsAsync();
        if (status !== 'granted') return; // in-app prompt will handle the first request
      }

      const { requestNotificationPermission, getFCMToken } =
        await import('../services/notifications.service');

      const granted = await requestNotificationPermission();
      if (!granted) {
        await SecureStore.setItemAsync(STORAGE_KEYS.NOTIF_DENIED, '1');
        return;
      }

      const token = await getFCMToken();
      if (!token) return;

      const { authService } = await import('../services/auth.service');
      await authService.updateDeviceToken(token);
      await SecureStore.setItemAsync(STORAGE_KEYS.FCM_TOKEN, token);
    } catch {
      // Fail silently — push notification feature degrades gracefully
    }
  },
}));
