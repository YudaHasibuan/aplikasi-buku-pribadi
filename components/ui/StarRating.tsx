import { View } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/contexts/ThemeContext';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  gap?: number;
}

/** Five-star rating; tap a star to set, tap the same star again to clear. */
export function StarRating({ value, onChange, size = 28, gap = 6 }: StarRatingProps) {
  const { theme: t } = useTheme();
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap }} accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 5, now: value }}>
      {stars.map((n) => {
        const filled = n <= value;
        const icon = <IconSymbol name={filled ? 'star.fill' : 'star'} size={size} color={filled ? t.warning : t.borderStrong} />;
        if (!onChange) return <View key={n}>{icon}</View>;
        return (
          <PressableScale key={n} feedback="selection" scaleTo={0.8} onPress={() => onChange(n === value ? 0 : n)} hitSlop={4} accessibilityLabel={`${n} bintang`}>
            {icon}
          </PressableScale>
        );
      })}
    </View>
  );
}
