import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { PressableScale, type PressableScaleProps } from './PressableScale';
import { radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableScaleProps, 'style' | 'children'> {
  label: string;
  icon?: IconSymbolName;
  iconRight?: IconSymbolName;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizes: Record<ButtonSize, { height: number; paddingX: number; font: 'label' | 'body' | 'bodyLarge'; icon: number }> = {
  sm: { height: 38, paddingX: space.lg, font: 'label', icon: 16 },
  md: { height: 48, paddingX: space.xl, font: 'body', icon: 18 },
  lg: { height: 56, paddingX: space['2xl'], font: 'bodyLarge', icon: 20 },
};

/** Primary call-to-action and its quieter siblings. */
export function Button({
  label,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { theme: t } = useTheme();
  const s = sizes[size];

  const palette = {
    primary: { bg: t.accent, fg: t.onAccent, border: 'transparent' },
    secondary: { bg: t.surface, fg: t.text, border: t.borderStrong },
    ghost: { bg: 'transparent', fg: t.accent, border: 'transparent' },
    danger: { bg: t.dangerSoft, fg: t.danger, border: 'transparent' },
    soft: { bg: t.accentSoft, fg: t.accentText, border: 'transparent' },
  }[variant];

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, height: s.height, paddingHorizontal: s.paddingX }}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {icon ? <IconSymbol name={icon} size={s.icon} color={palette.fg} /> : null}
          <AppText variant={s.font} weight="bold" color={palette.fg} numberOfLines={1}>
            {label}
          </AppText>
          {iconRight ? <IconSymbol name={iconRight} size={s.icon} color={palette.fg} /> : null}
        </>
      )}
    </View>
  );

  return (
    <PressableScale
      {...rest}
      feedback={variant === 'danger' ? 'warning' : 'light'}
      disabled={disabled || loading}
      style={[
        {
          borderRadius: radius.md,
          overflow: 'hidden',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: palette.bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: palette.border,
          ...(variant === 'primary' ? shadow(t.accent, 3) : null),
        },
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </PressableScale>
  );
}

/** Round icon-only button for headers and toolbars. */
export function IconButton({
  icon,
  onPress,
  color,
  background,
  size = 40,
  iconSize = 20,
  style,
  accessibilityLabel,
}: {
  icon: IconSymbolName;
  onPress?: PressableScaleProps['onPress'];
  color?: string;
  background?: string;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { theme: t } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background ?? t.surface,
          borderWidth: 1,
          borderColor: t.border,
        },
        style,
      ]}
    >
      <IconSymbol name={icon} size={iconSize} color={color ?? t.text} />
    </PressableScale>
  );
}
