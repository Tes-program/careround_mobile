/**
 * Shared NativeWind class string constants for consistent typography.
 * Use these instead of inline className strings to ensure design-token compliance.
 */
export const textStyles = {
  /** All page/screen titles — xl bold ink, Sora display font */
  pageTitle: 'text-xl font-display-bold text-cr-ink',
  /** Section headers — xs bold uppercase tracked, muted */
  sectionLabel: 'text-xs font-sans-bold uppercase tracking-widest text-cr-muted',
  /** Standard body copy */
  body: 'text-sm font-sans text-cr-ink2',
  /** Helper text, timestamps, metadata */
  meta: 'text-xs font-sans text-cr-muted',
  /** Badge / chip text */
  chipLabel: 'text-xs font-sans-semibold uppercase',
  /** Monospace values (VHI score, timer) */
  mono: 'font-mono',
} as const;
