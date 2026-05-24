import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, TextInput, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { getBookById, deleteBook, updateBook, Book } from '@/database/db';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import { useTheme } from '@/contexts/ThemeContext';

export default function BookDetailScreen() {
  const { theme: t } = useTheme();
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isProgressModalVisible, setProgressModalVisible] = useState(false);
  const [tempProgress, setTempProgress] = useState('');
  const [tempStatus, setTempStatus] = useState('');

  const fetchDetail = async () => {
    if (id) { const data = await getBookById(Number(id)); setBook(data); }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleDelete = () => {
    Alert.alert('Hapus Buku', 'Apakah Anda yakin ingin menghapus buku ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { if (id) { await deleteBook(Number(id)); router.back(); } } }
    ]);
  };

  const handleToggleFavorite = async () => {
    if (book && id) {
      const newFav = book.is_favorite === 1 ? 0 : 1;
      await updateBook(Number(id), { ...book, is_favorite: newFav });
      setBook({ ...book, is_favorite: newFav });
    }
  };

  const openProgressModal = () => {
    if (book) {
      setTempProgress(book.progress?.toString() || '0');
      setTempStatus(book.status || 'Ingin Baca');
      setProgressModalVisible(true);
    }
  };

  const saveProgress = async () => {
    if (book && id) {
      let p = parseInt(tempProgress);
      if (isNaN(p)) p = 0;
      if (p > 100) p = 100;
      if (p < 0) p = 0;
      let s = tempStatus;
      if (p === 100) s = 'Selesai';
      else if (p > 0 && s === 'Ingin Baca') s = 'Sedang Dibaca';
      const updated = { ...book, progress: p, status: s };
      await updateBook(Number(id), updated);
      setBook(updated);
      setProgressModalVisible(false);
    }
  };

  const handleReadPdf = async () => {
    if (!book?.pdf_uri) return;
    try {
      if (Platform.OS === 'android') {
        const cu = await FileSystem.getContentUriAsync(book.pdf_uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: cu, flags: 1, type: 'application/pdf' });
      } else { Linking.openURL(book.pdf_uri); }
    } catch (e) { Alert.alert('Error', 'Gagal membuka PDF.'); }
  };

  if (!book) return <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: t.textMuted }}>Memuat buku...</Text></View>;

  const statuses = ['Ingin Baca', 'Sedang Dibaca', 'Selesai', 'Ditunda'];

  return (
    <>
      <Stack.Screen options={{
        title: book.title,
        headerStyle: { backgroundColor: t.card },
        headerTintColor: t.text,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
            <Pressable onPress={handleToggleFavorite}>
              <IconSymbol name={book.is_favorite === 1 ? 'heart.fill' : 'heart'} size={24} color={book.is_favorite === 1 ? '#ef4444' : t.textMuted} />
            </Pressable>
            <Pressable onPress={handleDelete}>
              <IconSymbol name="trash.fill" size={24} color="#ef4444" />
            </Pressable>
          </View>
        ),
      }} />

      <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ width: '100%', height: 320, backgroundColor: t.accentLight }}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <IconSymbol name="books.vertical.fill" size={64} color={t.accent} />
            </View>
          )}
        </View>

        <View style={{ padding: 24, marginTop: -20, backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Text style={{ color: t.text, fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>{book.title}</Text>
          <Text style={{ color: t.textSecondary, fontSize: 18, marginBottom: 24 }}>oleh {book.author}</Text>

          {/* Meta Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, backgroundColor: t.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: t.accentBorder }}>
            {[{ label: 'Status', value: book.status || '-' }, { label: 'Progress', value: `${book.progress}%` }, ...(book.genre ? [{ label: 'Genre', value: book.genre }] : [])].map(m => (
              <View key={m.label} style={{ alignItems: 'center' }}>
                <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 4 }}>{m.label}</Text>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: 'bold' }}>{m.value}</Text>
              </View>
            ))}
          </View>

          {/* Progress Bar */}
          <View style={{ height: 8, backgroundColor: t.card, borderRadius: 4, marginBottom: 28, overflow: 'hidden', borderWidth: 1, borderColor: t.accentBorder }}>
            <View style={{ height: '100%', backgroundColor: t.accent, borderRadius: 4, width: `${book.progress || 0}%` } as any} />
          </View>

          {/* Read PDF Button — only shown if book has PDF */}
          {book.pdf_uri ? (
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#5C3D1E', paddingVertical: 16, borderRadius: 14, marginBottom: 20, gap: 10, shadowColor: '#5C3D1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 }}
              onPress={() => router.push(`/book/read/${id}`)}
            >
              <IconSymbol name="doc.fill" size={22} color="#FBF8F3" />
              <Text style={{ color: '#FBF8F3', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 }}>📖 Baca E-Book</Text>
            </Pressable>
          ) : null}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: t.accent, shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }} onPress={openProgressModal}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>{book.progress && book.progress > 0 ? 'Update Progress' : 'Catat Progress'}</Text>
            </Pressable>
            <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.accentBorder }} onPress={() => router.push(`/book/edit/${id}`)}>
              <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: 'bold' }}>Edit Buku</Text>
            </Pressable>
          </View>

          {book.pdf_uri ? (
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, marginBottom: 28, gap: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }} onPress={handleReadPdf}>
              <IconSymbol name="doc.fill" size={20} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Baca E-Book (PDF)</Text>
            </Pressable>
          ) : null}

          {book.synopsis ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Sinopsis</Text>
              <Text style={{ color: t.textSecondary, fontSize: 15, lineHeight: 24 }}>{book.synopsis}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Progress Modal */}
      <Modal animationType="fade" transparent visible={isProgressModalVisible} onRequestClose={() => setProgressModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: t.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: t.accentBorder }}>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>Update Progress</Text>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Persentase Selesai (%)</Text>
            <TextInput style={{ backgroundColor: t.bg, color: t.text, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: t.accentBorder, fontSize: 16, marginBottom: 20, outlineStyle: 'none' } as any} value={tempProgress} onChangeText={setTempProgress} keyboardType="numeric" placeholder="0 - 100" placeholderTextColor={t.textMuted} maxLength={3} />
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Status Baca</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {statuses.map(s => (
                <Pressable key={s} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: tempStatus === s ? t.accentLight : t.bg, borderWidth: 1, borderColor: tempStatus === s ? t.accent : t.accentBorder }} onPress={() => setTempStatus(s)}>
                  <Text style={{ color: tempStatus === s ? t.accent : t.textSecondary, fontSize: 14, fontWeight: tempStatus === s ? 'bold' : '500' }}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg }} onPress={() => setProgressModalVisible(false)}>
                <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '600' }}>Batal</Text>
              </Pressable>
              <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: t.accent }} onPress={saveProgress}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
