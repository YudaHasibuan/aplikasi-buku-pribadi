import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  icon: IconSymbolName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** Friendly placeholder for lists with no data. */
export function EmptyState({ icon, title, description, actionLabel, onAction, compact = false }: EmptyStateProps) {
  const { theme: t } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: compact ? space['2xl'] : space['5xl'], paddingHorizontal: space['3xl'] }}>
      <LinearGradient
        colors={t.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 84, height: 84, borderRadius: 42, padding: 2, marginBottom: space.xl }}
      >
        <View style={{ flex: 1, borderRadius: 40, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
          <IconSymbol name={icon} size={34} color={t.accent} />
        </View>
      </LinearGradient>
      <AppText variant="heading" serif weight="semibold" align="center">{title}</AppText>
      {description ? (
        <AppText variant="body" color={t.textSecondary} align="center" style={{ marginTop: space.sm, maxWidth: 300 }}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: space['2xl'] }} icon="plus" />
      ) : null}
    </View>
  );
}
