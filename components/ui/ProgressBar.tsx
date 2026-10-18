import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { clampProgress } from '@/lib/book-utils';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  height?: number;
  trackColor?: string;
  /** Solid colour; defaults to the theme gradient. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Rounded progress track with an animated gradient fill. */
export function ProgressBar({ value, height = 8, trackColor, color, style }: ProgressBarProps) {
  const { theme: t } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);
  const pct = clampProgress(value);

  useEffect(() => {
    progress.set(withTiming(pct / 100, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [pct, progress]);

  const fill = useAnimatedStyle(() => ({ width: trackWidth * progress.get() }));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[{ height, borderRadius: height / 2, backgroundColor: trackColor ?? (t.isDark ? t.surfaceAlt : t.border), overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: height / 2, overflow: 'hidden' }, fill]}>
        {color ? (
          <View style={{ flex: 1, backgroundColor: color }} />
        ) : (
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        )}
      </Animated.View>
    </View>
  );
}
