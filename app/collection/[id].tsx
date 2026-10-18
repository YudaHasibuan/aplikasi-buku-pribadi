import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, BookCover, Button, Card, EmptyState, IconButton, IconSymbol, Input, NavHeader, PressableScale, Screen, Sheet, StatusBadge, useToast } from '@/components/ui';
import { gutter, radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { addBookToCollection, getAllBooks, getBooksByCollection, getCollectionById, removeBookFromCollection, type Book, type Collection } from '@/database/db';
import { confirmAsync } from '@/lib/dialogs';

export default function CollectionDetailScreen() {
  const { theme: t } = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collectionId = Number(id);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [col, list] = await Promise.all([getCollectionById(collectionId), getBooksByCollection(collectionId)]);
    setCollection(col);
    setBooks(list);
    setLoaded(true);
  }, [collectionId]);

  useFocusEffect(useCallback(() => { load().catch(console.error); }, [load]));

  const openPicker = async () => {
    setAllBooks(await getAllBooks());
    setSearch('');
    setPicker(true);
  };

  const inShelf = useMemo(() => new Set(books.map((b) => b.id)), [books]);

  const toggle = async (book: Book) => {
    if (inShelf.has(book.id)) {
      await removeBookFromCollection(collectionId, book.id!);
    } else {
      await addBookToCollection(collectionId, book.id!);
    }
    await load();
  };

  const remove = async (book: Book) => {
    const ok = await confirmAsync({ title: 'Keluarkan dari rak?', message: `“${book.title}” tetap ada di perpustakaan Anda.`, confirmText: 'Keluarkan', destructive: true });
    if (!ok) return;
    await removeBookFromCollection(collectionId, book.id!);
    toast.show({ message: 'Buku dikeluarkan dari rak', type: 'info' });
    await load();
  };

  const q = search.trim().toLowerCase();
  const pickerList = allBooks.filter((b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));

  return (
    <Screen edges={['top']}>
      <NavHeader
        title={collection?.name ?? 'Rak'}
        subtitle={collection ? `${books.length} buku${collection.description ? ` · ${collection.description}` : ''}` : undefined}
        right={<IconButton icon="plus" onPress={openPicker} background={t.accent} color={t.onAccent} accessibilityLabel="Tambah buku ke rak" style={{ borderColor: 'transparent' }} />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space['4xl'], gap: space.md, alignSelf: 'center', width: '100%', maxWidth: 760 }}>
        {loaded && books.length === 0 ? (
          <EmptyState icon="folder.fill" title="Rak ini masih kosong" description="Pilih buku dari perpustakaan Anda untuk disusun di rak ini." actionLabel="Pilih Buku" onAction={openPicker} />
        ) : (
          books.map((book, i) => (
            <Animated.View key={book.id} entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(320)}>
              <Card padding={space.md} onPress={() => router.push({ pathname: '/book/[id]', params: { id: String(book.id) } })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                <BookCover uri={book.cover} title={book.title} width={54} radius={radius.sm} elevated={false} />
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="body" weight="bold" numberOfLines={2}>{book.title}</AppText>
                  <AppText variant="caption" color={t.textMuted} numberOfLines={1}>{book.author}</AppText>
                  <View style={{ marginTop: 2 }}><StatusBadge status={book.status} size="sm" /></View>
                </View>
                <PressableScale onPress={() => remove(book)} hitSlop={8} feedback="warning" accessibilityLabel="Keluarkan dari rak" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.dangerSoft }}>
                  <IconSymbol name="xmark" size={16} color={t.danger} />
                </PressableScale>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Pilih Buku" subtitle="Ketuk untuk menambah atau mengeluarkan dari rak." scroll>
        <View style={{ gap: space.md, paddingBottom: space.lg }}>
          <Input icon="magnifyingglass" placeholder="Cari judul atau penulis…" value={search} onChangeText={setSearch} />
          {pickerList.length === 0 ? (
            <AppText variant="body" color={t.textMuted} align="center" style={{ paddingVertical: space['2xl'] }}>
              {allBooks.length === 0 ? 'Belum ada buku di perpustakaan Anda.' : 'Tidak ada hasil.'}
            </AppText>
          ) : (
            pickerList.map((book) => {
              const selected = inShelf.has(book.id);
              return (
                <PressableScale key={book.id} onPress={() => toggle(book)} feedback="selection" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: selected ? t.accentSoft : t.surfaceAlt, borderWidth: 1, borderColor: selected ? t.accent : 'transparent' }}>
                  <BookCover uri={book.cover} title={book.title} width={36} radius={6} elevated={false} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" weight="bold" numberOfLines={1}>{book.title}</AppText>
                    <AppText variant="caption" color={t.textMuted} numberOfLines={1}>{book.author}</AppText>
                  </View>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: selected ? t.accent : t.surface, borderWidth: selected ? 0 : 1.5, borderColor: t.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                    {selected ? <IconSymbol name="checkmark" size={14} color={t.onAccent} /> : null}
                  </View>
                </PressableScale>
              );
            })
          )}
          <Button label="Selesai" variant="secondary" fullWidth onPress={() => setPicker(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
