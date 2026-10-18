import { View } from 'react-native';
import { AppText, BookCover, Card, IconSymbol, PressableScale } from '@/components/ui';
import { radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import type { Book, Collection } from '@/database/db';

interface ShelfCardProps {
  collection: Collection;
  previews: Book[];
  width: number;
  onPress: () => void;
  onMore: () => void;
}

/** Shelf tile with a fanned stack of its first covers. */
export function ShelfCard({ collection, previews, width, onPress, onMore }: ShelfCardProps) {
  const { theme: t } = useTheme();
  const coverW = Math.round(Math.min(74, width * 0.36));
  const stackH = Math.round(coverW * 1.5) + 18;
  const shown = previews.slice(0, 3);

  return (
    <Card onPress={onPress} padding={space.lg} style={{ width }}>
      <View style={{ height: stackH, alignItems: 'center', justifyContent: 'flex-end', marginBottom: space.lg }}>
        {/* Shelf plank */}
        <View style={{ position: 'absolute', bottom: 0, left: -space.lg, right: -space.lg, height: 10, backgroundColor: t.surfaceAlt, borderTopWidth: 1, borderColor: t.border }} />
        {shown.length === 0 ? (
          <View style={{ width: coverW, height: coverW * 1.5, borderRadius: radius.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: t.borderStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <IconSymbol name="plus" size={22} color={t.textMuted} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 }}>
            {shown.map((b, i) => (
              <View key={b.id} style={{ marginLeft: i === 0 ? 0 : -coverW * 0.4, zIndex: i, transform: [{ rotate: `${(i - (shown.length - 1) / 2) * 7}deg` }, { translateY: Math.abs(i - (shown.length - 1) / 2) * 5 }] }}>
                <BookCover uri={b.cover} title={b.title} width={coverW} radius={radius.sm} />
              </View>
            ))}
          </View>
        )}
      </View>

      <View>
        <AppText variant="subheading" serif weight="semibold" numberOfLines={2}>{collection.name}</AppText>
        <AppText variant="caption" color={t.textMuted} numberOfLines={1} style={{ marginTop: 2 }}>
          {collection.bookCount ?? 0} buku{collection.description ? ` · ${collection.description}` : ''}
        </AppText>
      </View>
      <PressableScale onPress={onMore} hitSlop={8} feedback="selection" accessibilityLabel="Opsi rak" style={{ position: 'absolute', top: space.md, right: space.md, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surfaceAlt, zIndex: 5 }}>
        <IconSymbol name="ellipsis" size={16} color={t.textSecondary} />
      </PressableScale>
    </Card>
  );
}
