import { View } from 'react-native';
import { AppText } from './AppText';
import { IconSymbol } from './icon-symbol';
import { radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { statusColors, statusIcon } from '@/lib/book-utils';

interface StatusBadgeProps {
  status?: string;
  size?: 'sm' | 'md';
}

/** Coloured pill describing a book's reading status. */
export function StatusBadge({ status = 'Ingin Baca', size = 'md' }: StatusBadgeProps) {
  const { theme: t } = useTheme();
  const { fg, bg } = statusColors(status, t);
  const small = size === 'sm';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: small ? space.sm : space.md,
        height: small ? 24 : 30,
        borderRadius: radius.full,
        backgroundColor: bg,
      }}
    >
      <IconSymbol name={statusIcon(status)} size={small ? 12 : 14} color={fg} />
      <AppText variant={small ? 'caption' : 'label'} weight="bold" color={fg}>{status}</AppText>
    </View>
  );
}
