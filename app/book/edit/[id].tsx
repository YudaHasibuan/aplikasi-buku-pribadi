import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookForm, type BookFormValues } from '@/components/BookForm';
import { AppText, NavHeader, Screen, useToast } from '@/components/ui';
import { gutter, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { getBookById, updateBook, type Book } from '@/database/db';
import { notify } from '@/lib/dialogs';

export default function EditBookScreen() {
  const { theme: t } = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getBookById(Number(id))
      .then((b) => { if (active) setBook(b); })
      .catch(() => { if (active) setBook(null); });
    return () => { active = false; };
  }, [id]);

  const handleSubmit = async (values: BookFormValues) => {
    if (!book) return;
    setSaving(true);
    try {
      const progress = values.status === 'Selesai' ? 100 : values.status === 'Ingin Baca' ? 0 : book.progress ?? 0;
      await updateBook(Number(id), { ...book, ...values, progress });
      toast.show({ message: 'Perubahan disimpan' });
      router.back();
    } catch (error) {
      console.error(error);
      notify('Gagal memperbarui', 'Perubahan tidak dapat disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} glow={false}>
      <NavHeader title="Edit Buku" subtitle={book?.title} />
      {book === undefined ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.accent} /></View>
      ) : book === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: gutter }}>
          <AppText variant="body" color={t.textMuted}>Buku tidak ditemukan.</AppText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space['4xl'], alignSelf: 'center', width: '100%', maxWidth: 760 }}>
          <BookForm initial={book} submitLabel="Simpan Perubahan" submitting={saving} onSubmit={handleSubmit} />
        </ScrollView>
      )}
    </Screen>
  );
}
