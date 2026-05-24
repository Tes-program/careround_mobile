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
  hydrateFromStorage: () => Promise<void>;
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
    } catch {
      await get().clearAuth();
    }
  },
}));
