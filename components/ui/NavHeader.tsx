import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from './AppText';
import { IconButton } from './Button';
import { gutter, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface NavHeaderProps {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Icon colours for use over imagery. */
  light?: boolean;
  onBack?: () => void;
  transparent?: boolean;
}

/** Back button + title row used by stack screens (detail, edit, rak). */
export function NavHeader({ title, subtitle, right, light = false, onBack, transparent = false }: NavHeaderProps) {
  const { theme: t } = useTheme();
  const fg = light ? '#fff' : t.text;
  const bg = light ? 'rgba(0,0,0,0.35)' : transparent ? 'transparent' : t.surface;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter - 4, paddingVertical: space.md, gap: space.md }}>
      <IconButton
        icon="chevron.left"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.navigate('/')))}
        color={fg}
        background={bg}
        accessibilityLabel="Kembali"
        style={light ? { borderColor: 'rgba(255,255,255,0.25)' } : undefined}
      />
      <View style={{ flex: 1 }}>
        {title ? <AppText variant="subheading" weight="bold" color={fg} numberOfLines={1}>{title}</AppText> : null}
        {subtitle ? <AppText variant="caption" color={light ? 'rgba(255,255,255,0.75)' : t.textMuted} numberOfLines={1}>{subtitle}</AppText> : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: space.sm }}>{right}</View> : null}
    </View>
  );
}
