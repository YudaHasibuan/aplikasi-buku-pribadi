import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { PressableScale, type PressableScaleProps } from './PressableScale';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `elevated` floats with a shadow, `outline` is flat, `soft` uses the tinted alt surface. */
  variant?: 'elevated' | 'outline' | 'soft';
  padding?: number;
  onPress?: PressableScaleProps['onPress'];
  onLongPress?: PressableScaleProps['onLongPress'];
}

/** Themed surface used for every grouped block of content. */
export function Card({ children, style, variant = 'elevated', padding = space.xl, onPress, onLongPress }: CardProps) {
  const { theme: t } = useTheme();
  const base: ViewStyle = {
    borderRadius: radius.xl,
    padding,
    backgroundColor: variant === 'soft' ? t.surfaceAlt : t.surface,
    borderWidth: 1,
    borderColor: variant === 'soft' ? 'transparent' : t.border,
    ...(variant === 'elevated' ? shadow(t.shadow, t.isDark ? 3 : 2) : null),
  };

  if (onPress || onLongPress) {
    return (
      <PressableScale onPress={onPress} onLongPress={onLongPress} style={[base, style]}>
        {children}
      </PressableScale>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
