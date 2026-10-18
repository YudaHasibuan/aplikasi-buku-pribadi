import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}

/** Multi-segment donut built from stroked circles; the centre is a slot. */
export function DonutChart({ segments, size = 180, thickness = 22, children }: DonutChartProps) {
  const { theme: t } = useTheme();
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;

  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.isDark ? t.surfaceAlt : t.border} strokeWidth={thickness} fill="none" />
        {total > 0
          ? segments.map((s, i) => {
              if (s.value <= 0) return null;
              const len = Math.max(0, (s.value / total) * c - gap);
              const dashOffset = -offset;
              offset += (s.value / total) * c;
              return (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeLinecap="round"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                />
              );
            })
          : null}
      </Svg>
      {children}
    </View>
  );
}
