import { useCallback, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Button, Card, IconSymbol, Input, PressableScale, Screen, ScreenHeader, Sheet, useTabBarPadding, useToast, type IconSymbolName } from '@/components/ui';
import { gutter, radius, shadow, space } from '@/constants/design';
import { themes, useTheme, type Theme } from '@/contexts/ThemeContext';
import { getAllBooks, getCollections, getSetting, setSetting } from '@/database/db';
import { exportBackup, importBackup } from '@/lib/backup';
import { computeStats } from '@/lib/book-utils';
import { confirmAsync, notify } from '@/lib/dialogs';

const MAX_CONTENT_WIDTH = 760;

export default function ProfileScreen() {
  const { theme: t, setThemeId } = useTheme();
  const toast = useToast();
  const bottomPad = useTabBarPadding();
  const { width: windowWidth } = useWindowDimensions();

  const [name, setName] = useState('Pembaca Setia');
  const [avatar, setAvatar] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, shelves: 0 });
  const [nameSheet, setNameSheet] = useState(false);
  const [tempName, setTempName] = useState('');
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [savedName, savedAvatar, books, cols] = await Promise.all([
          getSetting('userName', 'Pembaca Setia'),
          getSetting('userAvatar', ''),
          getAllBooks(),
          getCollections(),
        ]);
        if (!active) return;
        setName(savedName);
        setAvatar(savedAvatar);
        const s = computeStats(books);
        setStats({ total: s.total, completed: s.completed, shelves: cols.length });
      })().catch(console.error);
      return () => { active = false; };
    }, [])
  );

  const saveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    await setSetting('userName', trimmed);
    setName(trimmed);
    setNameSheet(false);
    toast.show({ message: 'Nama diperbarui' });
  };

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        await setSetting('userAvatar', uri);
        setAvatar(uri);
        toast.show({ message: 'Foto profil diperbarui' });
      }
    } catch {
      notify('Gagal', 'Tidak dapat membuka galeri.');
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const msg = await exportBackup();
      toast.show({ message: msg });
    } catch (e) {
      notify('Export gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    const ok = await confirmAsync({ title: 'Restore dari backup?', message: 'Buku dan rak dari file akan digabungkan ke perpustakaan Anda. Data yang sudah ada tidak dihapus.', confirmText: 'Pilih File' });
    if (!ok) return;
    setBusy('import');
    try {
      const result = await importBackup();
      if (result) toast.show({ message: `${result.books} buku & ${result.collections} rak ditambahkan` });
    } catch (e) {
      notify('Restore gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(null);
    }
  };

  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const themeCols = contentWidth >= 560 ? 4 : 2;
  const themeGap = space.md;
  const themeW = Math.floor((contentWidth - gutter * 2 - themeGap * (themeCols - 1)) / themeCols);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad, alignSelf: 'center', width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <ScreenHeader eyebrow="Akun & tampilan" title="Profil" />

        <View style={{ paddingHorizontal: gutter, gap: space['2xl'] }}>
          {/* Profile card */}
          <Animated.View entering={FadeInDown.duration(380)}>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 96 }}>
                <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.14)' }} />
                <View pointerEvents="none" style={{ position: 'absolute', left: 120, bottom: -60, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              </LinearGradient>
              <View style={{ paddingHorizontal: space.xl, paddingBottom: space.xl }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44 }}>
                  <PressableScale onPress={pickAvatar} scaleTo={0.94} accessibilityLabel="Ganti foto profil">
                    <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: t.surface, padding: 4, ...shadow(t.shadow, 3) }}>
                      <View style={{ flex: 1, borderRadius: 42, overflow: 'hidden', backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                        {avatar ? <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} /> : <IconSymbol name="person.fill" size={40} color={t.accent} />}
                      </View>
                      <View style={{ position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.surface }}>
                        <IconSymbol name="camera.fill" size={13} color={t.onAccent} />
                      </View>
                    </View>
                  </PressableScale>
                  <Button label="Ubah nama" variant="secondary" size="sm" icon="pencil" onPress={() => { setTempName(name); setNameSheet(true); }} />
                </View>
                <AppText variant="title" serif weight="semibold" style={{ marginTop: space.md }} numberOfLines={1}>{name}</AppText>
                <AppText variant="caption" color={t.textMuted}>Anggota perpustakaan Kita.id</AppText>

                <View style={{ flexDirection: 'row', marginTop: space.xl, borderRadius: radius.lg, backgroundColor: t.surfaceAlt, padding: space.md }}>
                  {[
                    { label: 'Buku', value: stats.total },
                    { label: 'Selesai', value: stats.completed },
                    { label: 'Rak', value: stats.shelves },
                  ].map((s, i) => (
                    <View key={s.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderColor: t.border }}>
                      <AppText variant="heading" serif weight="semibold">{s.value}</AppText>
                      <AppText variant="caption" color={t.textMuted}>{s.label}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Themes */}
          <Animated.View entering={FadeInDown.delay(80).duration(380)} style={{ gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <IconSymbol name="paintpalette.fill" size={18} color={t.accent} />
              <AppText variant="heading" serif weight="semibold">Tema Aplikasi</AppText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: themeGap }}>
              {Object.values(themes).map((th) => (
                <ThemeSwatch key={th.id} theme={th} active={t.id === th.id} width={themeW} onPress={() => setThemeId(th.id)} />
              ))}
            </View>
          </Animated.View>

          {/* Data */}
          <Animated.View entering={FadeInDown.delay(140).duration(380)} style={{ gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <IconSymbol name="icloud.and.arrow.up.fill" size={18} color={t.accent} />
              <AppText variant="heading" serif weight="semibold">Data & Backup</AppText>
            </View>
            <Card padding={space.sm}>
              <SettingRow icon="arrow.down.doc.fill" title="Export backup (JSON)" subtitle="Simpan seluruh koleksi & rak ke satu file" onPress={handleExport} loading={busy === 'export'} />
              <View style={{ height: 1, backgroundColor: t.border, marginLeft: 64 }} />
              <SettingRow icon="arrow.counterclockwise" title="Restore dari backup" subtitle="Gabungkan data dari file backup" onPress={handleImport} loading={busy === 'import'} />
              <View style={{ height: 1, backgroundColor: t.border, marginLeft: 64 }} />
              <SettingRow icon="chart.pie.fill" title="Lihat statistik" subtitle="Progres, target & pencapaian" onPress={() => router.navigate('/explore')} />
            </Card>
          </Animated.View>

          {/* Footer */}
          <View style={{ alignItems: 'center', gap: 4, paddingTop: space.lg }}>
            <AppText variant="label" serif weight="semibold" color={t.textMuted}>Kita.id · v{version}</AppText>
            <AppText variant="caption" color={t.textMuted}>Dibuat dengan ❤️ untuk para pembaca</AppText>
          </View>
        </View>
      </ScrollView>

      <Sheet visible={nameSheet} onClose={() => setNameSheet(false)} title="Ubah Nama" subtitle="Nama ini tampil di halaman Pustaka.">
        <View style={{ gap: space.lg }}>
          <Input label="Nama tampilan" icon="person.fill" value={tempName} onChangeText={setTempName} autoFocus returnKeyType="done" onSubmitEditing={saveName} maxLength={40} />
          <Button label="Simpan" icon="checkmark" size="lg" fullWidth onPress={saveName} />
        </View>
      </Sheet>
    </Screen>
  );
}

function ThemeSwatch({ theme: th, active, width, onPress }: { theme: Theme; active: boolean; width: number; onPress: () => void }) {
  const { theme: t } = useTheme();
  return (
    <PressableScale onPress={onPress} feedback="selection" accessibilityRole="button" accessibilityState={{ selected: active }} style={{ width, borderRadius: radius.lg, borderWidth: 2, borderColor: active ? th.accent : t.border, backgroundColor: t.surface, overflow: 'hidden', ...shadow(t.shadow, active ? 2 : 1) }}>
      <View style={{ height: 68, backgroundColor: th.bg, padding: 10, justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 22, borderRadius: 6, backgroundColor: th.surface, borderWidth: 1, borderColor: th.border }}>
          <View style={{ position: 'absolute', left: 6, top: 6, width: 34, height: 8, borderRadius: 4, backgroundColor: th.text, opacity: 0.6 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <LinearGradient colors={th.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 22, height: 22, borderRadius: 11 }} />
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: th.accentSoft, borderWidth: 1, borderColor: th.border }} />
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: th.surfaceAlt, borderWidth: 1, borderColor: th.border }} />
        </View>
        {active ? (
          <View style={{ position: 'absolute', right: 8, bottom: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: th.accent, alignItems: 'center', justifyContent: 'center' }}>
            <IconSymbol name="checkmark" size={14} color={th.onAccent} />
          </View>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        <AppText variant="label" weight="bold" numberOfLines={1}>{th.emoji} {th.name}</AppText>
        <AppText variant="caption" color={t.textMuted} numberOfLines={1}>{th.isDark ? 'Gelap' : 'Terang'} · {th.tagline}</AppText>
      </View>
    </PressableScale>
  );
}

function SettingRow({ icon, title, subtitle, onPress, loading }: { icon: IconSymbolName; title: string; subtitle: string; onPress: () => void; loading?: boolean }) {
  const { theme: t } = useTheme();
  return (
    <PressableScale onPress={onPress} disabled={loading} scaleTo={0.985} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <IconSymbol name={icon} size={20} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">{loading ? 'Memproses…' : title}</AppText>
        <AppText variant="caption" color={t.textMuted}>{subtitle}</AppText>
      </View>
      <IconSymbol name="chevron.right" size={18} color={t.textMuted} />
    </PressableScale>
  );
}
