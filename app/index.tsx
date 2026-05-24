import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types/domain';

const ROLE_ROUTES: Record<Role, string> = {
  DOCTOR: '/(app)/doctor/patients',
  NURSE: '/(app)/nurse/tasks',
  SUPERVISOR: '/(app)/supervisor/dashboard',
  ADMIN: '/login',
};

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore((s) => s.role);
  const navigationState = useRootNavigationState();

  // Navigation stack not yet mounted — wait before redirecting
  if (!navigationState?.key) return null;

  // Auth hydration still in progress — splash screen is still visible
  if (isLoading) return null;

  if (isAuthenticated && role) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={ROLE_ROUTES[role] as any} />;
  }

  return <Redirect href="/login" />;
}
