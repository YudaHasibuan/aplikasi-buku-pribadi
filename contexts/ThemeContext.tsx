import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSetting, initDb, setSetting } from '@/database/db';

/**
 * A theme is a complete colour system: surfaces, text, accent, semantic
 * colours and a signature gradient. Every screen reads colours from here —
 * never hard-code hex values in a component.
 */
export interface Theme {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  isDark: boolean;

  /** Page background and layered surfaces. */
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;

  /** Brand accent. */
  accent: string;
  accentSoft: string;
  accentText: string;
  onAccent: string;
  gradient: readonly [string, string];
  glow: string;

  /** Text hierarchy. */
  text: string;
  textSecondary: string;
  textMuted: string;

  /** Semantic colours. */
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  /** Misc. */
  overlay: string;
  shadow: string;
}

const lightBase = {
  isDark: false,
  surface: '#FFFFFF',
  onAccent: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#7C8698',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  overlay: 'rgba(15, 23, 42, 0.55)',
} as const;

const darkBase = {
  isDark: true,
  onAccent: '#FFFFFF',
  text: '#F1F5F9',
  textSecondary: '#B6C0D6',
  textMuted: '#7C879F',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  info: '#60A5FA',
  infoSoft: 'rgba(96, 165, 250, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
} as const;

export const themes: Record<string, Theme> = {
  lavender: {
    ...lightBase,
    id: 'lavender', name: 'Lavender Lembut', tagline: 'Tenang dan elegan', emoji: '💜',
    bg: '#F6F4FD', surfaceAlt: '#F1EEFB', border: '#E6E1F7', borderStrong: '#D4CCF2',
    accent: '#6D3FE0', accentSoft: '#EDE8FD', accentText: '#5B2FC9',
    gradient: ['#7C3AED', '#A855F7'], glow: '#C4B5FD', shadow: '#4C1D95',
  },
  skyBlue: {
    ...lightBase,
    id: 'skyBlue', name: 'Biru Langit', tagline: 'Segar dan jernih', emoji: '🩵',
    bg: '#F2F8FD', surfaceAlt: '#EAF3FB', border: '#DCEBF7', borderStrong: '#BFDBF2',
    accent: '#0369A1', accentSoft: '#E0F2FE', accentText: '#075985',
    gradient: ['#0284C7', '#38BDF8'], glow: '#BAE6FD', shadow: '#0C4A6E',
  },
  emerald: {
    ...lightBase,
    id: 'emerald', name: 'Zamrud', tagline: 'Alami dan menenangkan', emoji: '💚',
    bg: '#F2FBF6', surfaceAlt: '#E9F7EF', border: '#D6F0E2', borderStrong: '#B4E4CB',
    accent: '#047857', accentSoft: '#D1FAE5', accentText: '#065F46',
    gradient: ['#059669', '#34D399'], glow: '#A7F3D0', shadow: '#064E3B',
  },
  amber: {
    ...lightBase,
    id: 'amber', name: 'Amber Hangat', tagline: 'Hangat seperti kopi sore', emoji: '🟠',
    bg: '#FEFAF0', surfaceAlt: '#FBF3DF', border: '#F5E7C2', borderStrong: '#EDD59B',
    accent: '#B45309', accentSoft: '#FEF3C7', accentText: '#92400E',
    gradient: ['#D97706', '#F59E0B'], glow: '#FDE68A', shadow: '#78350F',
  },
  rose: {
    ...lightBase,
    id: 'rose', name: 'Mawar', tagline: 'Manis dan berani', emoji: '🌸',
    bg: '#FFF4F6', surfaceAlt: '#FDEBEF', border: '#FBDCE3', borderStrong: '#F7C3CF',
    accent: '#BE123C', accentSoft: '#FFE4E9', accentText: '#9F1239',
    gradient: ['#E11D48', '#FB7185'], glow: '#FECDD3', shadow: '#881337',
  },
  sepia: {
    ...lightBase,
    id: 'sepia', name: 'Kertas Tua', tagline: 'Nuansa buku klasik', emoji: '📜',
    bg: '#F7F1E6', surface: '#FFFBF4', surfaceAlt: '#F1E8D8', border: '#E6DAC4', borderStrong: '#D4C3A3',
    accent: '#8B5E3C', accentSoft: '#F0E2CF', accentText: '#6B4426',
    gradient: ['#8B5E3C', '#C08552'], glow: '#E6CFAE', shadow: '#4A2E17',
    text: '#2B2118', textSecondary: '#5A4A3B', textMuted: '#8A7A68',
  },
  dark: {
    ...darkBase,
    id: 'dark', name: 'Tengah Malam', tagline: 'Nyaman untuk membaca malam', emoji: '🌙',
    bg: '#0B1020', surface: '#141A2E', surfaceAlt: '#1B2340', border: '#232C4A', borderStrong: '#2F3A5F',
    accent: '#8B8CF8', accentSoft: 'rgba(139, 140, 248, 0.16)', accentText: '#B4B5FF',
    gradient: ['#6366F1', '#A78BFA'], glow: '#312E81',
  },
  noir: {
    ...darkBase,
    id: 'noir', name: 'Noir Emas', tagline: 'Mewah dan dramatis', emoji: '✨',
    bg: '#0A0A0B', surface: '#141416', surfaceAlt: '#1C1C1F', border: '#26262B', borderStrong: '#36363D',
    accent: '#E3B341', accentSoft: 'rgba(227, 179, 65, 0.16)', accentText: '#F0CC6A', onAccent: '#1A1400',
    gradient: ['#D4A031', '#F2D27A'], glow: '#4A3A12',
    text: '#F5F5F4', textSecondary: '#B8B8B3', textMuted: '#7D7D78',
  },
};

export const DEFAULT_THEME_ID = 'lavender';

interface ThemeContextType {
  theme: Theme;
  /** True once the persisted theme has been read, so the splash can hide without a colour flash. */
  isReady: boolean;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes[DEFAULT_THEME_ID],
  isReady: false,
  setThemeId: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDb();
        const savedId = await getSetting('themeId', DEFAULT_THEME_ID);
        if (!cancelled && themes[savedId]) setThemeIdState(savedId);
      } catch {
        // Fall back to the default theme silently.
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setThemeId = useCallback((id: string) => {
    if (!themes[id]) return;
    setThemeIdState(id);
    setSetting('themeId', id).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ theme: themes[themeId], isReady, setThemeId }),
    [themeId, isReady, setThemeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
