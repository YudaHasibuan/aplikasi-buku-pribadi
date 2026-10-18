import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { PressableScale } from './PressableScale';
import { radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: IconSymbolName;
  count?: number;
  onPress?: () => void;
  /** Override the selected colour (defaults to accent). */
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Filter / selection pill. */
export function Chip({ label, selected = false, icon, count, onPress, tint, style }: ChipProps) {
  const { theme: t } = useTheme();
  const color = tint ?? t.accent;
  const fg = selected ? (tint ? '#fff' : t.onAccent) : t.textSecondary;

  return (
    <PressableScale
      onPress={onPress}
      feedback="selection"
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: space.lg,
          height: 38,
          borderRadius: radius.full,
          backgroundColor: selected ? color : t.surface,
          borderWidth: 1,
          borderColor: selected ? color : t.border,
        },
        style,
      ]}
    >
      {icon ? <IconSymbol name={icon} size={15} color={fg} /> : null}
      <AppText variant="label" weight="semibold" color={fg}>{label}</AppText>
      {typeof count === 'number' ? (
        <View
          style={{
            minWidth: 20,
            height: 20,
            paddingHorizontal: 6,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? 'rgba(255,255,255,0.25)' : t.surfaceAlt,
          }}
        >
          <AppText variant="caption" weight="bold" color={selected ? fg : t.textMuted}>{count}</AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}
