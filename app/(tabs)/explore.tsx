import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, BookCover, Button, Card, DonutChart, EmptyState, IconSymbol, Input, PressableScale, ProgressBar, RingProgress, Screen, ScreenHeader, Sheet, StarRating, useTabBarPadding, useToast, type IconSymbolName } from '@/components/ui';
import { gutter, radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllBooks, getCollections, getSetting, setSetting, type Book } from '@/database/db';
import { computeStats, statusColors } from '@/lib/book-utils';

const QUOTES = [
  { text: 'Buku adalah jendela dunia: di sana kita melihat masa lalu dan merancang masa depan.', author: 'Pepatah' },
  { text: 'Membaca adalah alat paling mendasar untuk memperoleh keterampilan hidup.', author: 'Barack Obama' },
  { text: 'Aku rela dipenjara asalkan bersama buku, karena dengan buku aku bebas.', author: 'Mohammad Hatta' },
  { text: 'Jika Anda tidak suka membaca, Anda belum menemukan buku yang tepat.', author: 'J.K. Rowling' },
  { text: 'Satu buku, satu pena, satu anak, dan satu guru dapat mengubah dunia.', author: 'Malala Yousafzai' },
];

const MILESTONES: { count: number; label: string; icon: IconSymbolName }[] = [
  { count: 1, label: 'Langkah Pertama', icon: 'bolt.fill' },
  { count: 5, label: 'Pembaca Rutin', icon: 'flame.fill' },
  { count: 10, label: 'Kolektor', icon: 'medal.fill' },
  { count: 25, label: 'Kutu Buku', icon: 'rosette' },
  { count: 50, label: 'Pustakawan', icon: 'trophy.fill' },
];

const DEFAULT_GOAL = 12;
const MAX_CONTENT_WIDTH = 1000;

export default function StatsScreen() {
  const { theme: t } = useTheme();
  const toast = useToast();
  const bottomPad = useTabBarPadding();
  const { width: windowWidth } = useWindowDimensions();

  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [goalSheet, setGoalSheet] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [all, cols, savedGoal] = await Promise.all([getAllBooks(), getCollections(), getSetting('yearlyGoal', String(DEFAULT_GOAL))]);
        if (!active) return;
        setBooks(all);
        setShelves(cols.length);
        setGoal(Math.max(1, Number(savedGoal) || DEFAULT_GOAL));
        setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
      })().catch(console.error);
      return () => { active = false; };
    }, [])
  );

  const stats = useMemo(() => computeStats(books), [books]);
  const quote = QUOTES[quoteIndex];
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const wide = contentWidth >= 700;
  const tileCols = wide ? 4 : 2;
  const tileGap = space.md;
  const tileWidth = Math.floor((contentWidth - gutter * 2 - tileGap * (tileCols - 1)) / tileCols);

  const segments = [
    { key: 'Sedang Dibaca', value: stats.reading },
    { key: 'Selesai', value: stats.completed },
    { key: 'Ingin Baca', value: stats.wanted },
    { key: 'Ditunda', value: stats.paused },
  ].map((s) => ({ ...s, color: statusColors(s.key, t).fg }));

  const topRated = [...books].filter((b) => (b.rating ?? 0) > 0).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3);
  const goalPct = Math.min(100, Math.round((stats.completed / goal) * 100));

  const saveGoal = async () => {
    const n = Math.max(1, Math.min(999, parseInt(goalInput, 10) || 0));
    if (!n) return;
    await setSetting('yearlyGoal', String(n));
    setGoal(n);
    setGoalSheet(false);
    toast.show({ message: `Target diperbarui: ${n} buku` });
  };

  const tiles: { label: string; value: string; icon: IconSymbolName; color: string; soft: string }[] = [
    { label: 'Total koleksi', value: String(stats.total), icon: 'books.vertical.fill', color: t.accent, soft: t.accentSoft },
    { label: 'Selesai dibaca', value: String(stats.completed), icon: 'checkmark.circle.fill', color: t.success, soft: t.successSoft },
    { label: 'Favorit', value: String(stats.favorites), icon: 'heart.fill', color: t.danger, soft: t.dangerSoft },
    { label: 'E-Book PDF', value: String(stats.pdfs), icon: 'doc.fill', color: t.info, soft: t.infoSoft },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad, alignSelf: 'center', width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <ScreenHeader eyebrow="Analisis & progres" title="Statistik" subtitle="Pantau pencapaian dan kebiasaan membaca Anda." />

        <View style={{ paddingHorizontal: gutter, gap: space['2xl'] }}>
          {/* Quote */}
          <Animated.View entering={FadeInDown.duration(380)}>
            <Card variant="soft" style={{ overflow: 'hidden' }}>
              <AppText serif weight="bold" color={t.accent} style={{ position: 'absolute', top: -6, left: 14, fontSize: 96, lineHeight: 100, opacity: 0.18 }}>“</AppText>
              <AppText variant="subheading" serif italic weight="regular" style={{ lineHeight: 28 }}>{quote.text}</AppText>
              <AppText variant="label" color={t.accent} style={{ marginTop: space.md }}>— {quote.author}</AppText>
            </Card>
          </Animated.View>

          {stats.total === 0 ? (
            <EmptyState
              icon="chart.pie.fill"
              title="Belum ada data"
              description="Statistik akan muncul setelah Anda menambahkan buku pertama ke perpustakaan."
              actionLabel="Tambah Buku"
              onAction={() => router.navigate('/add')}
            />
          ) : (
            <>
              {/* Reading goal */}
              <Animated.View entering={FadeInDown.delay(60).duration(380)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
                  <RingProgress value={goalPct} size={92} thickness={9}>
                    <AppText variant="heading" serif weight="semibold">{goalPct}%</AppText>
                  </RingProgress>
                  <View style={{ flex: 1 }}>
                    <AppText variant="overline" color={t.textMuted}>Target tahun ini</AppText>
                    <AppText variant="heading" serif weight="semibold" style={{ marginTop: 4 }}>{stats.completed} dari {goal} buku</AppText>
                    <AppText variant="caption" color={t.textSecondary} style={{ marginTop: 4 }}>
                      {stats.completed >= goal ? 'Target tercapai! Luar biasa 🎉' : `${goal - stats.completed} buku lagi untuk mencapai target.`}
                    </AppText>
                    <Button label="Ubah target" variant="soft" size="sm" icon="pencil" onPress={() => { setGoalInput(String(goal)); setGoalSheet(true); }} style={{ marginTop: space.md }} />
                  </View>
                </Card>
              </Animated.View>

              {/* Tiles */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tileGap }}>
                {tiles.map((tile, i) => (
                  <Animated.View key={tile.label} entering={FadeInDown.delay(100 + i * 50).duration(380)} style={{ width: tileWidth }}>
                    <Card padding={space.lg} style={{ gap: space.md }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tile.soft, alignItems: 'center', justifyContent: 'center' }}>
                        <IconSymbol name={tile.icon} size={20} color={tile.color} />
                      </View>
                      <View>
                        <AppText variant="title" serif weight="semibold">{tile.value}</AppText>
                        <AppText variant="caption" color={t.textMuted}>{tile.label}</AppText>
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </View>

              {/* Status distribution */}
              <Animated.View entering={FadeInDown.delay(260).duration(380)}>
                <Card>
                  <AppText variant="heading" serif weight="semibold" style={{ marginBottom: space.xl }}>Status Membaca</AppText>
                  <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', gap: space['2xl'] }}>
                    <DonutChart segments={segments} size={170} thickness={22}>
                      <AppText variant="display" serif weight="semibold">{stats.total}</AppText>
                      <AppText variant="caption" color={t.textMuted}>buku</AppText>
                    </DonutChart>
                    <View style={{ flex: 1, alignSelf: 'stretch', gap: space.md, justifyContent: 'center' }}>
                      {segments.map((s) => {
                        const pct = stats.total ? Math.round((s.value / stats.total) * 100) : 0;
                        return (
                          <View key={s.key} style={{ gap: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                              <AppText variant="label" style={{ flex: 1 }}>{s.key}</AppText>
                              <AppText variant="label" color={t.textMuted}>{s.value} · {pct}%</AppText>
                            </View>
                            <ProgressBar value={pct} height={6} color={s.color} />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </Card>
              </Animated.View>

              {/* Average progress + rating */}
              <View style={{ flexDirection: 'row', gap: tileGap }}>
                <Card style={{ flex: 1, alignItems: 'center', gap: space.md }}>
                  <RingProgress value={stats.avgProgress} size={76} thickness={7}>
                    <AppText variant="subheading" weight="bold">{stats.avgProgress}%</AppText>
                  </RingProgress>
                  <AppText variant="caption" color={t.textMuted} align="center">Rerata progres</AppText>
                </Card>
                <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm }}>
                  <AppText variant="display" serif weight="semibold">{stats.avgRating ? stats.avgRating.toFixed(1) : '–'}</AppText>
                  <StarRating value={Math.round(stats.avgRating)} size={14} gap={2} />
                  <AppText variant="caption" color={t.textMuted} align="center">Rating rata-rata</AppText>
                </Card>
              </View>

              {/* Genres */}
              {stats.genres.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(320).duration(380)}>
                  <Card style={{ gap: space.lg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <AppText variant="heading" serif weight="semibold">Genre Favorit</AppText>
                      <AppText variant="label" color={t.textMuted}>{stats.genres.length} genre</AppText>
                    </View>
                    {stats.genres.slice(0, 5).map(([genre, count], i) => (
                      <View key={genre} style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <AppText variant="label" weight={i === 0 ? 'bold' : 'semibold'}>{i === 0 ? '★ ' : ''}{genre}</AppText>
                          <AppText variant="label" color={t.textMuted}>{count} buku</AppText>
                        </View>
                        <ProgressBar value={(count / stats.genres[0][1]) * 100} height={8} />
                      </View>
                    ))}
                  </Card>
                </Animated.View>
              ) : null}

              {/* Top rated */}
              {topRated.length > 0 ? (
                <Card style={{ gap: space.lg }}>
                  <AppText variant="heading" serif weight="semibold">Rating Tertinggi</AppText>
                  {topRated.map((b) => (
                    <PressableScale key={b.id} onPress={() => router.push({ pathname: '/book/[id]', params: { id: String(b.id) } })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <BookCover uri={b.cover} title={b.title} width={44} radius={6} elevated={false} />
                      <View style={{ flex: 1 }}>
                        <AppText variant="label" weight="bold" numberOfLines={1}>{b.title}</AppText>
                        <AppText variant="caption" color={t.textMuted} numberOfLines={1}>{b.author}</AppText>
                      </View>
                      <StarRating value={b.rating ?? 0} size={14} gap={1} />
                    </PressableScale>
                  ))}
                </Card>
              ) : null}

              {/* Milestones */}
              <Card style={{ gap: space.lg }}>
                <View>
                  <AppText variant="heading" serif weight="semibold">Pencapaian</AppText>
                  <AppText variant="caption" color={t.textMuted} style={{ marginTop: 2 }}>Berdasarkan jumlah buku yang selesai dibaca · {shelves} rak tersusun</AppText>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                  {MILESTONES.map((m) => {
                    const unlocked = stats.completed >= m.count;
                    return (
                      <View key={m.count} style={{ width: wide ? '18%' : '30%', flexGrow: 1, alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: unlocked ? t.accentSoft : t.surfaceAlt, opacity: unlocked ? 1 : 0.6 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: unlocked ? t.accent : t.border, alignItems: 'center', justifyContent: 'center' }}>
                          <IconSymbol name={unlocked ? m.icon : 'lock.fill'} size={20} color={unlocked ? t.onAccent : t.textMuted} />
                        </View>
                        <AppText variant="caption" weight="bold" align="center" numberOfLines={2}>{m.label}</AppText>
                        <AppText variant="caption" color={t.textMuted}>{m.count} buku</AppText>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </>
          )}
        </View>
      </ScrollView>

      <Sheet visible={goalSheet} onClose={() => setGoalSheet(false)} title="Target Membaca" subtitle="Berapa buku yang ingin Anda selesaikan tahun ini?">
        <View style={{ gap: space.lg }}>
          <Input label="Jumlah buku" icon="trophy.fill" keyboardType="number-pad" value={goalInput} onChangeText={setGoalInput} autoFocus maxLength={3} returnKeyType="done" onSubmitEditing={saveGoal} />
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            {[6, 12, 24, 52].map((n) => (
              <Button key={n} label={`${n} buku`} variant={goalInput === String(n) ? 'soft' : 'secondary'} size="sm" onPress={() => setGoalInput(String(n))} />
            ))}
          </View>
          <Button label="Simpan Target" icon="checkmark" size="lg" fullWidth onPress={saveGoal} />
        </View>
      </Sheet>
    </Screen>
  );
}
