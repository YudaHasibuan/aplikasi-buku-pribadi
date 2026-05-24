import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSetting, setSetting, initDb } from '@/database/db';

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  card: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  shadow: string;
  isDark: boolean;
}

export const themes: Record<string, Theme> = {
  lavender: {
    id: 'lavender', name: 'Soft Lavender', emoji: '💜',
    bg: '#F5F3FF', card: '#ffffff', accent: '#7C3AED',
    accentLight: '#EDE9FE', accentBorder: '#DDD6FE',
    text: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
    tabBar: '#ffffff', shadow: '#7C3AED', isDark: false,
  },
  skyBlue: {
    id: 'skyBlue', name: 'Sky Blue', emoji: '🩵',
    bg: '#F0F9FF', card: '#ffffff', accent: '#0284c7',
    accentLight: '#E0F2FE', accentBorder: '#BAE6FD',
    text: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
    tabBar: '#ffffff', shadow: '#0284c7', isDark: false,
  },
  emerald: {
    id: 'emerald', name: 'Emerald', emoji: '💚',
    bg: '#F0FDF4', card: '#ffffff', accent: '#059669',
    accentLight: '#D1FAE5', accentBorder: '#A7F3D0',
    text: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
    tabBar: '#ffffff', shadow: '#059669', isDark: false,
  },
  amber: {
    id: 'amber', name: 'Warm Amber', emoji: '🟠',
    bg: '#FFFBEB', card: '#ffffff', accent: '#D97706',
    accentLight: '#FEF3C7', accentBorder: '#FDE68A',
    text: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
    tabBar: '#ffffff', shadow: '#D97706', isDark: false,
  },
  rose: {
    id: 'rose', name: 'Rose Pink', emoji: '🌸',
    bg: '#FFF1F2', card: '#ffffff', accent: '#E11D48',
    accentLight: '#FFE4E6', accentBorder: '#FECDD3',
    text: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
    tabBar: '#ffffff', shadow: '#E11D48', isDark: false,
  },
  dark: {
    id: 'dark', name: 'Dark Mode', emoji: '🌙',
    bg: '#0f172a', card: '#1e293b', accent: '#818cf8',
    accentLight: '#312e81', accentBorder: '#3730a3',
    text: '#f8fafc', textSecondary: '#cbd5e1', textMuted: '#94a3b8',
    tabBar: '#0f172a', shadow: '#818cf8', isDark: true,
  },
};

interface ThemeContextType {
  theme: Theme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.lavender,
  setThemeId: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(themes.lavender);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        await initDb();
        const savedId = await getSetting('themeId', 'lavender');
        if (themes[savedId]) setTheme(themes[savedId]);
      } catch (e) {}
    };
    loadTheme();
  }, []);

  const setThemeId = useCallback(async (id: string) => {
    if (themes[id]) {
      setTheme(themes[id]);
      await setSetting('themeId', id);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
