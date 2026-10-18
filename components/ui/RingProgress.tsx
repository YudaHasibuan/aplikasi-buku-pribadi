import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { clampProgress } from '@/lib/book-utils';

interface RingProgressProps {
  /** 0–100 */
  value: number;
  size?: number;
  thickness?: number;
  trackColor?: string;
  /** Solid colour; defaults to the theme gradient. */
  color?: string;
  children?: ReactNode;
}

/** Circular progress indicator with centred content. */
export function RingProgress({ value, size = 64, thickness = 6, trackColor, color, children }: RingProgressProps) {
  const { theme: t } = useTheme();
  const pct = clampProgress(value);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const gradId = `ring-${size}-${thickness}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.gradient[0]} />
            <Stop offset="1" stopColor={t.gradient[1]} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor ?? (t.isDark ? t.surfaceAlt : t.border)} strokeWidth={thickness} fill="none" />
        {pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? `url(#${gradId})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            fill="none"
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}
