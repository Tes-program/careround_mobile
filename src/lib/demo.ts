/**
 * Demo mode flag.
 * Set EXPO_PUBLIC_DEMO_MODE=true in your .env to serve mock data instead of hitting the real API.
 * Only active in __DEV__ builds for safety.
 */
export const DEMO_MODE =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
