import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { STORAGE_KEYS } from '@/types/domain';
import type { Role } from '@/types/domain';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { colors } from '@/constants/theme';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_ROUTES: Record<Exclude<Role, 'ADMIN'>, string> = {
  DOCTOR: '/(app)/doctor/patients',
  NURSE: '/(app)/nurse/tasks',
  SUPERVISOR: '/(app)/supervisor/dashboard',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  hospitalCode?: string;
  email?: string;
  password?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validate(hospitalCode: string, email: string, password: string): FormErrors {
  const e: FormErrors = {};
  if (!hospitalCode.trim() || hospitalCode.trim().length < 2) {
    e.hospitalCode = 'Hospital code must be at least 2 characters';
  }
  if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
    e.email = 'Enter a valid email address';
  }
  if (!password) {
    e.password = 'Password is required';
  }
  return e;
}

function getApiErrorMessage(error: unknown): string {
  // Type-narrow without importing axios to keep the login bundle lean
  const e = error as { response?: { status?: number } };
  if (!e?.response) return 'No internet connection. Please check your network.';
  const s = e.response.status;
  if (s === 401) return 'Invalid credentials. Please check your details.';
  if (s === 403) return 'Your account has been deactivated. Contact your administrator.';
  if (s !== undefined && s >= 500) return 'Something went wrong. Please try again.';
  return 'Something went wrong. Please try again.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [hospitalCode, setHospitalCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Change handlers — clear errors as the user types ──────────────────────

  const handleHospitalCodeChange = (text: string) => {
    setHospitalCode(text.toUpperCase());
    if (apiError) setApiError(null);
    if (errors.hospitalCode) setErrors((e) => ({ ...e, hospitalCode: undefined }));
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (apiError) setApiError(null);
    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (apiError) setApiError(null);
    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    Keyboard.dismiss();

    const validationErrors = validate(hospitalCode, email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const jwt = await authService.login(hospitalCode.trim(), email.trim(), password);

      if (jwt.role === 'ADMIN') {
        setApiError('Admin access is not available on mobile.');
        return; // finally still fires → setIsLoading(false)
      }

      // Store tokens before getMe() so the axios request interceptor can attach
      // Authorization: Bearer <token> on the /users/me call automatically.
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, jwt.accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, jwt.refreshToken),
      ]);

      const user = await authService.getMe();

      // setAuth stores all 4 keys again (same values) — idempotent — then sets Zustand state.
      await setAuth(user, jwt.role, jwt.accessToken, jwt.refreshToken);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(ROLE_ROUTES[jwt.role as Exclude<Role, 'ADMIN'>] as any);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setApiError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cr-bg"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View className="items-center mb-8">
            <Ionicons name="pulse-outline" size={28} color={colors.accent} />
            <View className="flex-row mt-2">
              <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: 28, color: colors.ink }}>
                Care
              </Text>
              <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: 28, color: colors.accent }}>
                Round
              </Text>
            </View>
          </View>

          {/* ── Headlines ── */}
          <Text className="text-xl font-sans-semibold text-cr-ink mb-1">
            Sign in to your account
          </Text>
          <Text className="text-sm font-sans text-cr-muted mb-6">
            Enter your hospital code and credentials to continue.
          </Text>

          {/* ── Form fields ── */}
          <View style={{ gap: 16 }}>
            <Input
              label="Hospital Code"
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="e.g. STMARYS"
              value={hospitalCode}
              onChangeText={handleHospitalCodeChange}
              error={errors.hospitalCode}
              returnKeyType="next"
            />
            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@hospital.com"
              value={email}
              onChangeText={handleEmailChange}
              error={errors.email}
              returnKeyType="next"
            />
            <Input
              label="Password"
              secureTextEntry
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* ── Error banner ── */}
          {apiError ? (
            <View
              className="mt-4 p-3 rounded-lg border"
              style={{ backgroundColor: colors.dangerBg, borderColor: colors.danger }}
            >
              <Text className="text-sm font-sans" style={{ color: colors.danger }}>
                {apiError}
              </Text>
            </View>
          ) : null}

          {/* ── Submit button ── */}
          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
            onPress={handleSubmit}
            className="mt-6"
          >
            Sign In
          </Button>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
