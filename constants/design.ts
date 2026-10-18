/**
 * design.ts — Design tokens shared by every screen.
 *
 * Spacing follows a 4pt grid, radii are generous (soft "editorial" feel),
 * and typography pairs a warm serif (Fraunces) for display text with a
 * crisp geometric sans (Plus Jakarta Sans) for UI text.
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

/** Horizontal page gutter used by every screen. */
export const gutter = space['2xl'];

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 30,
  full: 999,
} as const;

/** Font families registered in app/_layout.tsx via expo-font. */
export const fonts = {
  sans: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extrabold: 'PlusJakartaSans_800ExtraBold',
  },
  serif: {
    regular: 'Fraunces_400Regular',
    medium: 'Fraunces_500Medium',
    semibold: 'Fraunces_600SemiBold',
    bold: 'Fraunces_700Bold',
    italic: 'Fraunces_400Regular_Italic',
    semiboldItalic: 'Fraunces_600SemiBold_Italic',
  },
} as const;

export type SansWeight = keyof typeof fonts.sans;
export type SerifWeight = keyof typeof fonts.serif;

/** Type scale: [fontSize, lineHeight, letterSpacing]. */
export const typeScale = {
  display: { fontSize: 36, lineHeight: 40, letterSpacing: -0.8 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  heading: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  subheading: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 1.4 },
} as const;

export type TypeVariant = keyof typeof typeScale;

/**
 * Soft, layered shadows. `color` should be the theme's shadow colour so that
 * light themes get a tinted glow and dark themes a plain black drop.
 */
export const shadow = (color: string, level: 1 | 2 | 3 | 4 = 2) => {
  const presets = {
    1: { offset: 2, opacity: 0.06, radius: 6, elevation: 1 },
    2: { offset: 6, opacity: 0.08, radius: 14, elevation: 3 },
    3: { offset: 10, opacity: 0.12, radius: 22, elevation: 6 },
    4: { offset: 16, opacity: 0.18, radius: 32, elevation: 10 },
  } as const;
  const p = presets[level];
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: p.offset },
    shadowOpacity: p.opacity,
    shadowRadius: p.radius,
    elevation: p.elevation,
  };
};

/** Reading statuses used throughout the app (stored verbatim in the DB). */
export const READING_STATUSES = ['Ingin Baca', 'Sedang Dibaca', 'Selesai', 'Ditunda'] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

/** Minimum touch target for interactive elements. */
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
