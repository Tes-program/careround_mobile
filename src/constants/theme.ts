export const colors = {
  bg: '#edf1f6',
  surface: '#ffffff',
  surface2: '#f6f8fb',
  surface3: '#eef2f7',
  ink: '#0f172a',
  ink2: '#334155',
  muted: '#64748b',
  line: '#dbe3ed',
  lineStrong: '#c6d2df',
  brand: '#0b5cab',
  brandInk: '#083f74',
  accent: '#0e7490',
  success: '#15803d',
  warn: '#b45309',
  danger: '#b91c1c',
  dangerBg: '#fee2e2',
  amberBg: '#fef3c7',
  greenBg: '#dcfce7',
  acuity: {
    red: '#dc2626',
    amber: '#f59e0b',
    green: '#22c55e',
  },
} as const;

export const fontFamily = {
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  sansBold: 'IBMPlexSans_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  display: 'Sora_400Regular',
  displaySemiBold: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
} as const;
