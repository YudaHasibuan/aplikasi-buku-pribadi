import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppText, BookCover, Button, Card, Chip, IconButton, IconSymbol, Input, NavHeader, PressableScale, ProgressBar, RingProgress, Screen, Sheet, StarRating, StatusBadge, useToast } from '@/components/ui';
import { gutter, radius, space, READING_STATUSES } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { deleteBook, getBookById, updateBook, type Book } from '@/database/db';
import { clampProgress, statusColors, statusIcon } from '@/lib/book-utils';
import { confirmAsync } from '@/lib/dialogs';

export default function BookDetailScreen() {
  const { theme: t } = useTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = Number(id);

  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [progressSheet, setProgressSheet] = useState(false);
  const [moreSheet, setMoreSheet] = useState(false);
  const [tempProgress, setTempProgress] = useState('0');
  const [tempStatus, setTempStatus] = useState<string>('Ingin Baca');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getBookById(bookId).then((b) => { if (active) setBook(b); }).catch(() => { if (active) setBook(null); });
      return () => { active = false; };
    }, [bookId])
  );

  const persist = async (patch: Partial<Book>, message?: string) => {
    if (!book) return;
    const updated = { ...book, ...patch };
    setBook(updated);
    await updateBook(bookId, updated);
    if (message) toast.show({ message });
  };

  const toggleFavorite = () => persist({ is_favorite: book?.is_favorite === 1 ? 0 : 1 }, book?.is_favorite === 1 ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit');

  const openProgress = () => {
    if (!book) return;
    setTempProgress(String(book.progress ?? 0));
    setTempStatus(book.status ?? 'Ingin Baca');
    setProgressSheet(true);
  };

  const saveProgress = async () => {
    const p = clampProgress(parseInt(tempProgress, 10));
    let s = tempStatus;
    if (p === 100) s = 'Selesai';
    else if (p > 0 && s === 'Ingin Baca') s = 'Sedang Dibaca';
    else if (s === 'Selesai' && p < 100) s = 'Sedang Dibaca';
    setProgressSheet(false);
    await persist({ progress: p, status: s }, p === 100 ? 'Selamat, buku selesai dibaca! 🎉' : 'Progres disimpan');
  };

  const markFinished = () => persist({ progress: 100, status: 'Selesai' }, 'Selamat, buku selesai dibaca! 🎉');

  const remove = async () => {
    setMoreSheet(false);
    const ok = await confirmAsync({ title: 'Hapus buku ini?', message: `“${book?.title}” akan dihapus permanen dari perpustakaan Anda.`, confirmText: 'Hapus', destructive: true });
    if (!ok) return;
    await deleteBook(bookId);
    toast.show({ message: 'Buku dihapus', type: 'info' });
    router.back();
  };

  if (book === undefined) {
    return (
      <Screen glow={false}>
        <NavHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.accent} /></View>
      </Screen>
    );
  }
  if (book === null) {
    return (
      <Screen glow={false}>
        <NavHeader title="Buku tidak ditemukan" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: gutter }}>
          <AppText color={t.textMuted}>Buku ini mungkin sudah dihapus.</AppText>
        </View>
      </Screen>
    );
  }

  const progress = book.progress ?? 0;
  const status = statusColors(book.status, t);
  const heroHeight = 300;
  const coverW = Math.min(170, Math.round(width * 0.42));
  const isFav = book.is_favorite === 1;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Backdrop */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: heroHeight + 40, overflow: 'hidden' }}>
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" blurRadius={40} transition={300} />
        ) : (
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.1)', t.bg]} locations={[0, 0.55, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </View>

      <Screen glow={false} background="transparent">
        <NavHeader
          light
          right={
            <>
              <IconButton icon={isFav ? 'heart.fill' : 'heart'} color={isFav ? '#FB7185' : '#fff'} background="rgba(0,0,0,0.35)" style={{ borderColor: 'rgba(255,255,255,0.25)' }} onPress={toggleFavorite} accessibilityLabel="Favorit" />
              <IconButton icon="ellipsis" color="#fff" background="rgba(0,0,0,0.35)" style={{ borderColor: 'rgba(255,255,255,0.25)' }} onPress={() => setMoreSheet(true)} accessibilityLabel="Opsi lainnya" />
            </>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space['5xl'], alignSelf: 'center', width: '100%', maxWidth: 760 }}>
          {/* Cover + title */}
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', paddingHorizontal: gutter, paddingTop: space.sm }}>
            <BookCover uri={book.cover} title={book.title} author={book.author} width={coverW} radius={radius.lg} />
            <AppText variant="title" serif weight="semibold" align="center" style={{ marginTop: space['2xl'] }}>{book.title}</AppText>
            <AppText variant="bodyLarge" color={t.textSecondary} align="center" style={{ marginTop: 4 }}>{book.author}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, marginTop: space.lg }}>
              <StatusBadge status={book.status} />
              {book.genre ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: space.md, height: 30, borderRadius: radius.full, backgroundColor: t.surfaceAlt }}>
                  <IconSymbol name="tag.fill" size={13} color={t.textSecondary} />
                  <AppText variant="label" weight="bold" color={t.textSecondary}>{book.genre}</AppText>
                </View>
              ) : null}
              {book.pdf_uri ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: space.md, height: 30, borderRadius: radius.full, backgroundColor: t.surfaceAlt }}>
                  <IconSymbol name="doc.fill" size={13} color={t.textSecondary} />
                  <AppText variant="label" weight="bold" color={t.textSecondary}>E-Book</AppText>
                </View>
              ) : null}
            </View>

            {/* Rating */}
            <View style={{ alignItems: 'center', marginTop: space.xl, gap: 6 }}>
              <StarRating value={book.rating ?? 0} size={30} onChange={(r) => persist({ rating: r }, r ? `Rating: ${r} bintang` : 'Rating dihapus')} />
              <AppText variant="caption" color={t.textMuted}>{book.rating ? `Anda memberi ${book.rating} dari 5 bintang` : 'Ketuk bintang untuk memberi rating'}</AppText>
            </View>
          </Animated.View>

          <View style={{ paddingHorizontal: gutter, gap: space.lg, marginTop: space['2xl'] }}>
            {/* Progress */}
            <Animated.View entering={FadeInDown.delay(80).duration(380)}>
              <Card style={{ gap: space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                  <RingProgress value={progress} size={72} thickness={7}>
                    <AppText variant="label" weight="bold">{progress}%</AppText>
                  </RingProgress>
                  <View style={{ flex: 1 }}>
                    <AppText variant="overline" color={t.textMuted}>Progres membaca</AppText>
                    <AppText variant="heading" serif weight="semibold" style={{ marginTop: 2 }}>
                      {progress === 0 ? 'Belum dimulai' : progress === 100 ? 'Selesai dibaca' : `${progress}% selesai`}
                    </AppText>
                    <AppText variant="caption" color={t.textSecondary} style={{ marginTop: 2 }}>
                      {progress === 100 ? 'Kerja bagus! Beri rating untuk mengingatnya.' : `${100 - progress}% lagi untuk menyelesaikan buku ini.`}
                    </AppText>
                  </View>
                </View>
                <ProgressBar value={progress} height={10} />
                <View style={{ flexDirection: width >= 440 ? 'row' : 'column', gap: space.sm }}>
                  <Button label={progress > 0 ? 'Update progres' : 'Mulai membaca'} icon={progress > 0 ? 'pencil' : 'play.fill'} onPress={openProgress} style={width >= 440 ? { flex: 1 } : undefined} fullWidth />
                  {progress < 100 ? <Button label="Tandai selesai" variant="soft" icon="checkmark.circle.fill" onPress={markFinished} style={width >= 440 ? { flex: 1 } : undefined} fullWidth /> : null}
                </View>
              </Card>
            </Animated.View>

            {/* Actions */}
            <Animated.View entering={FadeInDown.delay(140).duration(380)} style={{ flexDirection: 'row', gap: space.sm }}>
              {book.pdf_uri ? (
                <PressableScale onPress={() => router.push({ pathname: '/book/read/[id]', params: { id: String(bookId) } })} style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}>
                  <LinearGradient colors={['#8B5E3C', '#C08552']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <IconSymbol name="text.book.closed.fill" size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body" weight="bold" color="#fff">Baca E-Book</AppText>
                      <AppText variant="caption" color="rgba(255,255,255,0.8)">Buka PDF di pembaca bawaan</AppText>
                    </View>
                    <IconSymbol name="arrow.right" size={18} color="#fff" />
                  </LinearGradient>
                </PressableScale>
              ) : null}
              <Card padding={space.lg} onPress={() => router.push({ pathname: '/book/edit/[id]', params: { id: String(bookId) } })} style={{ flex: book.pdf_uri ? 0 : 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <IconSymbol name="pencil" size={20} color={t.accent} />
                </View>
                {!book.pdf_uri ? (
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" weight="bold">Edit detail buku</AppText>
                    <AppText variant="caption" color={t.textMuted}>Sampul, genre, sinopsis, PDF</AppText>
                  </View>
                ) : null}
              </Card>
            </Animated.View>

            {/* Synopsis */}
            <Animated.View entering={FadeInDown.delay(200).duration(380)}>
              <Card style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <IconSymbol name="text.alignleft" size={18} color={t.accent} />
                  <AppText variant="heading" serif weight="semibold">Sinopsis</AppText>
                </View>
                {book.synopsis ? (
                  <AppText variant="bodyLarge" color={t.textSecondary} style={{ lineHeight: 26 }}>{book.synopsis}</AppText>
                ) : (
                  <View style={{ gap: space.md }}>
                    <AppText variant="body" color={t.textMuted}>Belum ada sinopsis atau catatan untuk buku ini.</AppText>
                    <Button label="Tambah sinopsis" variant="secondary" size="sm" icon="plus" onPress={() => router.push({ pathname: '/book/edit/[id]', params: { id: String(bookId) } })} />
                  </View>
                )}
              </Card>
            </Animated.View>
          </View>
        </ScrollView>
      </Screen>

      {/* Progress sheet */}
      <Sheet visible={progressSheet} onClose={() => setProgressSheet(false)} title="Update Progres" subtitle="Perkirakan persentase yang sudah Anda baca.">
        <View style={{ gap: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <RingProgress value={clampProgress(parseInt(tempProgress, 10))} size={80} thickness={8}>
              <AppText variant="subheading" weight="bold">{clampProgress(parseInt(tempProgress, 10))}%</AppText>
            </RingProgress>
            <Input containerStyle={{ flex: 1 }} label="Persentase (0–100)" keyboardType="number-pad" value={tempProgress} onChangeText={(v) => setTempProgress(v.replace(/[^0-9]/g, ''))} maxLength={3} returnKeyType="done" onSubmitEditing={saveProgress} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {[10, 25, 50, 75, 100].map((n) => (
              <Chip key={n} label={`${n}%`} selected={clampProgress(parseInt(tempProgress, 10)) === n} onPress={() => setTempProgress(String(n))} />
            ))}
            <Chip label="10%" icon="plus" onPress={() => setTempProgress(String(clampProgress((parseInt(tempProgress, 10) || 0) + 10)))} />
          </View>
          <View style={{ gap: space.sm }}>
            <AppText variant="label" color={t.textSecondary}>Status</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {READING_STATUSES.map((s) => (
                <Chip key={s} label={s} icon={statusIcon(s)} selected={tempStatus === s} tint={statusColors(s, t).fg} onPress={() => setTempStatus(s)} />
              ))}
            </View>
          </View>
          <Button label="Simpan Progres" icon="checkmark" size="lg" fullWidth onPress={saveProgress} />
        </View>
      </Sheet>

      {/* More sheet */}
      <Sheet visible={moreSheet} onClose={() => setMoreSheet(false)} title={book.title} subtitle={book.author}>
        <View style={{ gap: space.sm }}>
          {[
            { icon: 'pencil' as const, label: 'Edit detail buku', onPress: () => { setMoreSheet(false); router.push({ pathname: '/book/edit/[id]', params: { id: String(bookId) } }); } },
            { icon: (isFav ? 'heart' : 'heart.fill') as 'heart' | 'heart.fill', label: isFav ? 'Hapus dari favorit' : 'Tandai favorit', onPress: () => { setMoreSheet(false); toggleFavorite(); } },
            { icon: 'trash.fill' as const, label: 'Hapus buku', onPress: remove, danger: true },
          ].map((item) => (
            <PressableScale key={item.label} onPress={item.onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.md, backgroundColor: item.danger ? t.dangerSoft : t.surfaceAlt }}>
              <IconSymbol name={item.icon} size={20} color={item.danger ? t.danger : status.fg} />
              <AppText variant="body" weight="semibold" color={item.danger ? t.danger : t.text}>{item.label}</AppText>
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
