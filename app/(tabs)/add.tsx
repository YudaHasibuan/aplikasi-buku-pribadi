import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { BookForm, type BookFormValues } from '@/components/BookForm';
import { AppText, IconButton, IconSymbol, PressableScale, Screen, ScreenHeader, useTabBarPadding, useToast } from '@/components/ui';
import { gutter, radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { addBook, type Book } from '@/database/db';
import { notify } from '@/lib/dialogs';

type ScanParams = { scanKey?: string; title?: string; author?: string; genre?: string; cover?: string; synopsis?: string };

export default function AddBookScreen() {
  const { theme: t } = useTheme();
  const toast = useToast();
  const bottomPad = useTabBarPadding();
  const params = useLocalSearchParams<ScanParams>();

  // A new scan arrives as route params with a fresh `scanKey`. We apply it once
  // (derived state) and remount the form so the fields are prefilled.
  const [appliedKey, setAppliedKey] = useState<string | undefined>(undefined);
  const [prefill, setPrefill] = useState<Partial<Book> | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [saving, setSaving] = useState(false);

  if (params.scanKey && params.scanKey !== appliedKey) {
    setAppliedKey(params.scanKey);
    setPrefill({ title: params.title, author: params.author, genre: params.genre, cover: params.cover, synopsis: params.synopsis });
    setFormVersion((v) => v + 1);
  }

  const handleSubmit = async (values: BookFormValues) => {
    setSaving(true);
    try {
      await addBook({ ...values, progress: values.status === 'Selesai' ? 100 : 0, rating: 0, is_favorite: 0 });
      toast.show({ message: `“${values.title}” ditambahkan ke koleksi` });
      setPrefill(null);
      setFormVersion((v) => v + 1);
      router.navigate('/');
    } catch (error) {
      console.error(error);
      notify('Gagal menyimpan', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomPad, alignSelf: 'center', width: '100%', maxWidth: 760 }}>
        <ScreenHeader
          eyebrow="Koleksi baru"
          title="Tambah Buku"
          right={<IconButton icon="barcode.viewfinder" onPress={() => router.push('/book/scan')} accessibilityLabel="Scan ISBN" background={t.accentSoft} color={t.accent} size={44} iconSize={22} />}
        />

        <View style={{ paddingHorizontal: gutter, gap: space['2xl'] }}>
          {/* Scan banner */}
          <PressableScale onPress={() => router.push('/book/scan')} style={{ borderRadius: radius.xl, ...shadow(t.accent, 3) }}>
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.lg, overflow: 'hidden' }}>
              <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="barcode.viewfinder" size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading" weight="bold" color="#fff">Scan ISBN</AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.8)">Arahkan kamera ke barcode di sampul belakang. Data buku terisi otomatis.</AppText>
              </View>
              <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          </PressableScale>

          {prefill ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.md, backgroundColor: t.successSoft }}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={t.success} />
              <AppText variant="label" color={t.success} style={{ flex: 1 }}>Data dari hasil scan sudah diisi. Periksa lalu simpan.</AppText>
            </View>
          ) : null}

          <BookForm key={formVersion} initial={prefill} submitLabel="Simpan ke Koleksi" submitting={saving} onSubmit={handleSubmit} />
        </View>
      </ScrollView>
    </Screen>
  );
}
