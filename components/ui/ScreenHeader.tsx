import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { gutter, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Use a smaller title for secondary screens. */
  compact?: boolean;
}

/** Editorial page header: small accent eyebrow, big serif title, optional action. */
export function ScreenHeader({ eyebrow, title, subtitle, right, compact = false }: ScreenHeaderProps) {
  const { theme: t } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: gutter,
        paddingTop: space.lg,
        paddingBottom: space.xl,
        gap: space.lg,
      }}
    >
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <AppText variant="overline" color={t.accent} style={{ marginBottom: space.sm }}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant={compact ? 'title' : 'display'} serif weight="semibold" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color={t.textSecondary} style={{ marginTop: space.sm }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={{ paddingBottom: 2 }}>{right}</View> : null}
    </View>
  );
}
