import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  AppText, BookCover, Chip, EmptyState, IconSymbol, Input, PressableScale, ProgressBar, RingProgress,
  Screen, StatusBadge, useTabBarPadding,
} from '@/components/ui';
import { gutter, radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllBooks, getSetting, initDb, type Book } from '@/database/db';
import { getGreeting } from '@/lib/book-utils';

type Filter = 'Semua' | 'Sedang Dibaca' | 'Selesai' | 'Ingin Baca' | 'Ditunda' | 'Favorit';
const FILTERS: { key: Filter; icon?: Parameters<typeof IconSymbol>[0]['name'] }[] = [
  { key: 'Semua' },
  { key: 'Sedang Dibaca', icon: 'book.fill' },
  { key: 'Ingin Baca', icon: 'bookmark.fill' },
  { key: 'Selesai', icon: 'checkmark.circle.fill' },
  { key: 'Ditunda', icon: 'pause.circle.fill' },
  { key: 'Favorit', icon: 'heart.fill' },
];

const MAX_CONTENT_WIDTH = 1100;

export default function LibraryScreen() {
  const { theme: t } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const bottomPad = useTabBarPadding();

  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Semua');
  const [userName, setUserName] = useState('Perpustakaanku');
  const [avatar, setAvatar] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          await initDb();
          const [data, name, av] = await Promise.all([
            getAllBooks(),
            getSetting('userName', 'Perpustakaanku'),
            getSetting('userAvatar', ''),
          ]);
          if (!active) return;
          setBooks(data);
          setUserName(name);
          setAvatar(av);
          setLoaded(true);
        } catch (error) {
          console.error('Failed to load library', error);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const columns = contentWidth >= 1000 ? 5 : contentWidth >= 760 ? 4 : contentWidth >= 520 ? 3 : 2;
  const gridGap = space.lg;
  const cardWidth = Math.floor((contentWidth - gutter * 2 - gridGap * (columns - 1)) / columns);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { Semua: books.length, 'Sedang Dibaca': 0, Selesai: 0, 'Ingin Baca': 0, Ditunda: 0, Favorit: 0 };
    for (const b of books) {
      if (b.status && b.status in c) c[b.status as Filter] += 1;
      if (b.is_favorite === 1) c.Favorit += 1;
    }
    return c;
  }, [books]);

  const q = query.trim().toLowerCase();
  const filtered = books.filter((b) => {
    if (q && !(b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.genre?.toLowerCase().includes(q))) return false;
    if (filter === 'Semua') return true;
    if (filter === 'Favorit') return b.is_favorite === 1;
    return b.status === filter;
  });

  const reading = books.filter((b) => b.status === 'Sedang Dibaca');
  const hero = reading[0];
  const continueList = reading.slice(1, 6);
  const showHero = !q && filter === 'Semua' && !!hero;

  const openBook = (id?: number) => { if (id !== undefined) router.push({ pathname: '/book/[id]', params: { id: String(id) } }); };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomPad, alignSelf: 'center', width: '100%', maxWidth: MAX_CONTENT_WIDTH }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: gutter, paddingTop: space.lg, paddingBottom: space.xl }}>
          <View style={{ flex: 1, paddingRight: space.lg }}>
            <AppText variant="label" color={t.textSecondary} style={{ marginBottom: 4 }}>{getGreeting()} 👋</AppText>
            <AppText variant="display" serif weight="semibold" numberOfLines={1}>{userName}</AppText>
          </View>
          <PressableScale onPress={() => router.navigate('/profile')} scaleTo={0.92} accessibilityLabel="Buka profil">
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 52, borderRadius: 26, padding: 2, ...shadow(t.accent, 2) }}>
              <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.surface }}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                ) : (
                  <IconSymbol name="person.fill" size={22} color={t.accent} />
                )}
              </View>
            </LinearGradient>
          </PressableScale>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: gutter, marginBottom: space['2xl'] }}>
          <Input
            icon="magnifyingglass"
            placeholder="Cari judul, penulis, atau genre…"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>

        {/* Hero: currently reading */}
        {showHero ? (
          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: gutter, marginBottom: space['3xl'] }}>
            <AppText variant="overline" color={t.accent} style={{ marginBottom: space.md }}>Sedang dibaca</AppText>
            <PressableScale onPress={() => openBook(hero.id)} style={{ borderRadius: radius['2xl'], ...shadow(t.accent, 4) }}>
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius['2xl'], padding: space.xl, flexDirection: 'row', gap: space.xl, overflow: 'hidden' }}>
                <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                <View pointerEvents="none" style={{ position: 'absolute', right: 40, bottom: -90, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <BookCover uri={hero.cover} title={hero.title} author={hero.author} width={96} radius={radius.md} />
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View>
                    <AppText variant="heading" serif weight="semibold" color="#fff" numberOfLines={2}>{hero.title}</AppText>
                    <AppText variant="body" color="rgba(255,255,255,0.8)" numberOfLines={1} style={{ marginTop: 4 }}>{hero.author}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md }}>
                    <RingProgress value={hero.progress ?? 0} size={48} thickness={5} color="#fff" trackColor="rgba(255,255,255,0.25)">
                      <AppText variant="caption" weight="bold" color="#fff">{hero.progress ?? 0}%</AppText>
                    </RingProgress>
                    <View style={{ flex: 1 }}>
                      <AppText variant="label" weight="bold" color="#fff">Lanjutkan membaca</AppText>
                      <AppText variant="caption" color="rgba(255,255,255,0.75)">Ketuk untuk detail</AppText>
                    </View>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <IconSymbol name="arrow.right" size={18} color="#fff" />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        ) : null}

        {/* Continue reading rail */}
        {showHero && continueList.length > 0 ? (
          <View style={{ marginBottom: space['3xl'] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: gutter, marginBottom: space.lg }}>
              <AppText variant="heading" serif weight="semibold">Lanjutkan Membaca</AppText>
              <PressableScale onPress={() => setFilter('Sedang Dibaca')} feedback="selection">
                <AppText variant="label" color={t.accent}>Lihat semua</AppText>
              </PressableScale>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: space.md }} snapToInterval={272} decelerationRate="fast">
              {continueList.map((book) => (
                <PressableScale key={book.id} onPress={() => openBook(book.id)} style={{ width: 260, padding: space.md, flexDirection: 'row', gap: space.md, backgroundColor: t.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: t.border, ...shadow(t.shadow, 2) }}>
                  <BookCover uri={book.cover} title={book.title} width={64} radius={radius.sm} elevated={false} />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <AppText variant="label" weight="bold" numberOfLines={2}>{book.title}</AppText>
                    <AppText variant="caption" color={t.textMuted} numberOfLines={1} style={{ marginTop: 2, marginBottom: space.md }}>{book.author}</AppText>
                    <ProgressBar value={book.progress ?? 0} height={6} />
                    <AppText variant="caption" weight="semibold" color={t.textMuted} style={{ marginTop: 6 }}>{book.progress ?? 0}% selesai</AppText>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: space.sm, paddingBottom: space['2xl'] }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.key} icon={f.icon} count={counts[f.key]} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>

        {/* Section title */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: gutter, marginBottom: space.lg }}>
          <AppText variant="heading" serif weight="semibold">
            {q ? 'Hasil Pencarian' : filter === 'Semua' ? 'Semua Koleksi' : filter}
          </AppText>
          <AppText variant="label" color={t.textMuted}>{filtered.length} buku</AppText>
        </View>

        {/* Grid */}
        {loaded && books.length === 0 ? (
          <EmptyState
            icon="books.vertical.fill"
            title="Rak masih kosong"
            description="Mulai perpustakaan pribadi Anda dengan menambahkan buku pertama, atau scan ISBN dari sampul belakang."
            actionLabel="Tambah Buku"
            onAction={() => router.navigate('/add')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState compact icon="magnifyingglass" title="Tidak ditemukan" description={q ? `Tidak ada buku yang cocok dengan “${query}”.` : 'Belum ada buku di kategori ini.'} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: gutter, gap: gridGap }}>
            {filtered.map((book, i) => (
              <Animated.View key={book.id} entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(350)} style={{ width: cardWidth }}>
                <PressableScale onPress={() => openBook(book.id)} accessibilityLabel={book.title}>
                  <BookCover uri={book.cover} title={book.title} author={book.author} width={cardWidth} radius={radius.lg}>
                    {book.is_favorite === 1 ? (
                      <View style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
                        <IconSymbol name="heart.fill" size={14} color="#E11D48" />
                      </View>
                    ) : null}
                    {book.pdf_uri ? (
                      <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.75)' }}>
                        <IconSymbol name="doc.fill" size={11} color="#fff" />
                        <AppText variant="caption" weight="bold" color="#fff" style={{ fontSize: 10 }}>PDF</AppText>
                      </View>
                    ) : null}
                    {(book.progress ?? 0) > 0 && book.status !== 'Selesai' ? (
                      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <View style={{ width: `${book.progress ?? 0}%`, height: '100%', backgroundColor: '#fff' }} />
                      </View>
                    ) : null}
                  </BookCover>
                  <View style={{ marginTop: space.md, gap: 4 }}>
                    <AppText variant="label" weight="bold" numberOfLines={2}>{book.title}</AppText>
                    <AppText variant="caption" color={t.textMuted} numberOfLines={1}>{book.author}</AppText>
                    <View style={{ marginTop: 4 }}><StatusBadge status={book.status} size="sm" /></View>
                  </View>
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
