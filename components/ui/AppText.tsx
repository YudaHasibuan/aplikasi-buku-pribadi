import { Text, type TextProps, type TextStyle } from 'react-native';
import { fonts, typeScale, type SansWeight, type SerifWeight, type TypeVariant } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  /** Use the editorial serif (Fraunces) instead of the UI sans. */
  serif?: boolean;
  weight?: SansWeight | SerifWeight;
  italic?: boolean;
  color?: string;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
}

const defaultWeight: Record<TypeVariant, SansWeight> = {
  display: 'extrabold',
  title: 'bold',
  heading: 'bold',
  subheading: 'semibold',
  bodyLarge: 'regular',
  body: 'regular',
  label: 'semibold',
  caption: 'medium',
  overline: 'bold',
};

function resolveFamily(serif: boolean, weight: string, italic: boolean): string {
  if (serif) {
    if (italic) return weight === 'semibold' || weight === 'bold' ? fonts.serif.semiboldItalic : fonts.serif.italic;
    switch (weight) {
      case 'bold':
      case 'extrabold': return fonts.serif.bold;
      case 'semibold': return fonts.serif.semibold;
      case 'medium': return fonts.serif.medium;
      default: return fonts.serif.regular;
    }
  }
  switch (weight) {
    case 'extrabold': return fonts.sans.extrabold;
    case 'bold': return fonts.sans.bold;
    case 'semibold': return fonts.sans.semibold;
    case 'medium': return fonts.sans.medium;
    default: return fonts.sans.regular;
  }
}

/**
 * The only Text component screens should use. Guarantees consistent type
 * scale, font families and theme-aware colours.
 */
export function AppText({
  variant = 'body',
  serif = false,
  weight,
  italic = false,
  color,
  align,
  uppercase = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();
  const scale = typeScale[variant];
  const w = weight ?? defaultWeight[variant];
  const fontFamily = resolveFamily(serif, w, italic);

  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily,
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          letterSpacing: variant === 'overline' ? scale.letterSpacing : serif ? scale.letterSpacing - 0.2 : scale.letterSpacing,
          color: color ?? theme.text,
          textAlign: align,
          textTransform: uppercase || variant === 'overline' ? 'uppercase' : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
