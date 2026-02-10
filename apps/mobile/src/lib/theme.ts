// ============================================================================
// 1Ummah Mobile — Dark Theme
// Mirrors the web app's color palette and design tokens.
// ============================================================================

export const colors = {
  /** Main background */
  bg: '#0a0a0f',
  /** Card / surface background */
  bgCard: '#13131a',
  /** Hover / pressed state background */
  bgHover: '#1a1a24',
  /** Primary brand accent (blue) */
  brand: '#1DA1F2',
  /** Primary text */
  text: '#e7e9ea',
  /** Secondary / supporting text */
  textSecondary: '#8b8fa3',
  /** Muted / placeholder text */
  textMuted: '#6b6f85',
  /** Border / divider */
  border: '#1e1e2a',
  /** Destructive / error */
  danger: '#f43f5e',
  /** Success */
  success: '#22c55e',
  /** Warning */
  warning: '#eab308',
} as const;

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 48px */
  '4xl': 48,
} as const;

export const fontSize = {
  /** 12px */
  xs: 12,
  /** 14px */
  sm: 14,
  /** 16px */
  base: 16,
  /** 18px */
  lg: 18,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 30px */
  '3xl': 30,
} as const;

export const borderRadius = {
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 9999px — pill shape */
  full: 9999,
} as const;

// Re-export a single theme object for convenience
const theme = { colors, spacing, fontSize, borderRadius } as const;
export default theme;
