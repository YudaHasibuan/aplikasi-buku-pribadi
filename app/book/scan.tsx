import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { AppText, BookCover, Button, IconButton, IconSymbol } from '@/components/ui';
import { gutter, radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { haptic } from '@/lib/haptics';

interface ScannedBook {
  isbn: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  synopsis: string;
}

/** Looks up an ISBN on Open Library and normalises the response. */
async function fetchBookByIsbn(isbn: string): Promise<ScannedBook | null> {
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
  const json = await res.json();
  const data = json[`ISBN:${isbn}`];
  if (!data) return null;

  const title = typeof data.title === 'string' ? data.title : '';
  const author = Array.isArray(data.authors) ? data.authors.map((a: { name?: string }) => a.name).filter(Boolean).join(', ') : '';
  const cover = data.cover?.large || data.cover?.medium || '';
  const genre = Array.isArray(data.subjects) && data.subjects[0]?.name ? String(data.subjects[0].name) : '';
  const pick = (v: unknown) => (typeof v === 'string' ? v : v && typeof (v as { value?: unknown }).value === 'string' ? (v as { value: string }).value : '');
  let synopsis = pick(data.description) || pick(data.notes) || '';
  if (synopsis.length > 600) synopsis = synopsis.slice(0, 600).trimEnd() + '…';
  return { isbn, title, author, cover, genre, synopsis };
}

const DARK = { bg: '#07090F', text: '#F8FAFC', muted: 'rgba(248,250,252,0.65)', frame: '#A5B4FC' };

export default function ScanScreen() {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [phase, setPhase] = useState<'scanning' | 'loading' | 'found' | 'notfound' | 'error'>('scanning');
  const [result, setResult] = useState<ScannedBook | null>(null);
  const [lastIsbn, setLastIsbn] = useState('');

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const frameSize = Math.min(280, width - gutter * 2 - 40);

  const onScanned = async ({ data }: BarcodeScanningResult) => {
    if (phase !== 'scanning' || !data) return;
    const isbn = data.replace(/[^0-9Xx]/g, '');
    if (isbn.length < 8) return;
    setPhase('loading');
    setLastIsbn(isbn);
    haptic.medium();
    try {
      const found = await fetchBookByIsbn(isbn);
      if (found && (found.title || found.author)) {
        setResult(found);
        setPhase('found');
        haptic.success();
      } else {
        setPhase('notfound');
        haptic.warning();
      }
    } catch (e) {
      console.error(e);
      setPhase('error');
    }
  };

  const useResult = () => {
    if (!result) return;
    router.replace({
      pathname: '/add',
      params: { scanKey: String(Date.now()), title: result.title, author: result.author, cover: result.cover, genre: result.genre, synopsis: result.synopsis },
    });
  };

  const rescan = () => { setResult(null); setPhase('scanning'); };
  const close = () => (router.canGoBack() ? router.back() : router.navigate('/add'));

  const Header = (
    <View style={{ position: 'absolute', top: insets.top + space.sm, left: gutter - 4, right: gutter - 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <IconButton icon="xmark" color="#fff" background="rgba(255,255,255,0.12)" style={{ borderColor: 'rgba(255,255,255,0.2)' }} onPress={close} accessibilityLabel="Tutup" />
      <View style={{ alignItems: 'center' }}>
        <AppText variant="overline" color={DARK.muted}>Smart scan</AppText>
        <AppText variant="subheading" weight="bold" color={DARK.text}>Scan ISBN</AppText>
      </View>
      {Platform.OS !== 'web' ? (
        <IconButton icon={torch ? 'bolt.fill' : 'bolt.fill'} color={torch ? '#FDE68A' : '#fff'} background={torch ? 'rgba(253,230,138,0.2)' : 'rgba(255,255,255,0.12)'} style={{ borderColor: 'rgba(255,255,255,0.2)' }} onPress={() => setTorch((v) => !v)} accessibilityLabel="Senter" />
      ) : <View style={{ width: 40 }} />}
    </View>
  );

  if (!permission) {
    return <View style={[styles.root, { backgroundColor: DARK.bg }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center', padding: gutter }]}>
        {Header}
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(165,180,252,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: space.xl }}>
          <IconSymbol name="camera.fill" size={40} color={DARK.frame} />
        </View>
        <AppText variant="heading" serif weight="semibold" color={DARK.text} align="center">Izin kamera diperlukan</AppText>
        <AppText variant="body" color={DARK.muted} align="center" style={{ marginTop: space.sm, maxWidth: 320 }}>
          Kami memakai kamera hanya untuk membaca barcode ISBN di sampul belakang buku.
        </AppText>
        <Button label={permission.canAskAgain ? 'Izinkan Kamera' : 'Buka Pengaturan'} icon="camera.fill" size="lg" onPress={requestPermission} style={{ marginTop: space['2xl'] }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: DARK.bg }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={phase === 'scanning' ? onScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
      />

      {/* Dim mask with a clear window */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: 'rgba(7,9,15,0.6)' }} />
        <View style={{ flexDirection: 'row', height: frameSize }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(7,9,15,0.6)' }} />
          <View style={{ width: frameSize }}>
            {/* Corner brackets */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <View
                key={c}
                style={{
                  position: 'absolute',
                  width: 36,
                  height: 36,
                  borderColor: DARK.frame,
                  top: c.startsWith('t') ? 0 : undefined,
                  bottom: c.startsWith('b') ? 0 : undefined,
                  left: c.endsWith('l') ? 0 : undefined,
                  right: c.endsWith('r') ? 0 : undefined,
                  borderTopWidth: c.startsWith('t') ? 4 : 0,
                  borderBottomWidth: c.startsWith('b') ? 4 : 0,
                  borderLeftWidth: c.endsWith('l') ? 4 : 0,
                  borderRightWidth: c.endsWith('r') ? 4 : 0,
                  borderTopLeftRadius: c === 'tl' ? radius.lg : 0,
                  borderTopRightRadius: c === 'tr' ? radius.lg : 0,
                  borderBottomLeftRadius: c === 'bl' ? radius.lg : 0,
                  borderBottomRightRadius: c === 'br' ? radius.lg : 0,
                }}
              />
            ))}
            <View style={{ position: 'absolute', left: 24, right: 24, top: '50%', height: 2, backgroundColor: 'rgba(165,180,252,0.7)' }} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(7,9,15,0.6)' }} />
        </View>
        <View style={{ flex: 1.3, backgroundColor: 'rgba(7,9,15,0.6)', alignItems: 'center', paddingTop: space['2xl'], paddingHorizontal: gutter }}>
          <AppText variant="body" weight="semibold" color={DARK.text} align="center">Arahkan ke barcode ISBN</AppText>
          <AppText variant="caption" color={DARK.muted} align="center" style={{ marginTop: 4 }}>Biasanya ada di sampul belakang, dekat harga.</AppText>
        </View>
      </View>

      {Header}

      {/* Result panel */}
      {phase !== 'scanning' ? (
        <Animated.View
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOut.duration(150)}
          style={{ position: 'absolute', left: gutter, right: gutter, bottom: insets.bottom + space.xl, backgroundColor: t.surface, borderRadius: radius.xl, padding: space.xl, borderWidth: 1, borderColor: t.border, alignSelf: 'center', maxWidth: 520, width: width - gutter * 2 }}
        >
          {phase === 'loading' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <ActivityIndicator color={t.accent} />
              <View>
                <AppText variant="body" weight="bold">Mencari buku…</AppText>
                <AppText variant="caption" color={t.textMuted}>ISBN {lastIsbn}</AppText>
              </View>
            </View>
          ) : phase === 'found' && result ? (
            <View style={{ gap: space.lg }}>
              <View style={{ flexDirection: 'row', gap: space.lg }}>
                <BookCover uri={result.cover} title={result.title || 'Buku'} author={result.author} width={72} radius={radius.sm} />
                <View style={{ flex: 1 }}>
                  <AppText variant="overline" color={t.success}>Buku ditemukan</AppText>
                  <AppText variant="subheading" serif weight="semibold" numberOfLines={2} style={{ marginTop: 4 }}>{result.title || 'Tanpa judul'}</AppText>
                  <AppText variant="caption" color={t.textMuted} numberOfLines={1} style={{ marginTop: 2 }}>{result.author || 'Penulis tidak diketahui'}{result.genre ? ` · ${result.genre}` : ''}</AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label="Scan ulang" variant="secondary" icon="arrow.clockwise" onPress={rescan} style={{ flex: 1 }} fullWidth />
                <Button label="Gunakan data" icon="checkmark" onPress={useResult} style={{ flex: 1.4 }} fullWidth />
              </View>
            </View>
          ) : (
            <View style={{ gap: space.lg }}>
              <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.warningSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={22} color={t.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold">{phase === 'notfound' ? 'Buku tidak ditemukan' : 'Gagal mengambil data'}</AppText>
                  <AppText variant="caption" color={t.textMuted}>
                    {phase === 'notfound' ? `ISBN ${lastIsbn} belum ada di Open Library. Anda bisa mengisi manual.` : 'Periksa koneksi internet lalu coba lagi.'}
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label="Isi manual" variant="secondary" icon="pencil" onPress={close} style={{ flex: 1 }} fullWidth />
                <Button label="Scan ulang" icon="arrow.clockwise" onPress={rescan} style={{ flex: 1 }} fullWidth />
              </View>
            </View>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
