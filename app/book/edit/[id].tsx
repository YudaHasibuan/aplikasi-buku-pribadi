import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getBookById, updateBook, Book } from '@/database/db';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function EditBookScreen() {
  const { theme: t } = useTheme();
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (id) {
        const data = await getBookById(Number(id));
        if (data) {
          setBook(data); setTitle(data.title); setAuthor(data.author);
          setGenre(data.genre || ''); setSynopsis(data.synopsis || '');
          setCover(data.cover || null); setPdfUri(data.pdf_uri || null);
        }
      }
    };
    fetchBook();
  }, [id]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.7 });
    if (!result.canceled) setCover(result.assets[0].uri);
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        let uri = result.assets[0].uri;
        setPdfUri(uri);
      }
    } catch (err) { Alert.alert('Error', 'Gagal memilih file PDF'); }
  };

  const handleSave = async () => {
    if (!title || !author) { Alert.alert('Error', 'Judul dan Penulis wajib diisi!'); return; }
    if (book && id) {
      const updated: Book = { ...book, title, author, genre, synopsis, cover: cover || '', pdf_uri: pdfUri || '' };
      try {
        await updateBook(Number(id), updated);
        Alert.alert('Sukses', 'Data buku berhasil diperbarui!');
        router.back();
      } catch (error) { Alert.alert('Error', 'Gagal memperbarui buku'); }
    }
  };

  if (!book) return <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: t.textMuted }}>Memuat buku...</Text></View>;

  const inputStyle: any = { backgroundColor: t.card, color: t.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: t.accentBorder, fontSize: 16, outlineStyle: 'none' };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Buku', headerStyle: { backgroundColor: t.card }, headerTintColor: t.text }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Cover */}
          <Pressable style={{ width: 150, height: 220, backgroundColor: t.card, borderRadius: 20, borderWidth: 2, borderColor: t.accentBorder, borderStyle: 'dashed', alignSelf: 'center', marginBottom: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }} onPress={pickImage}>
            {cover ? (
              <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <IconSymbol name="camera" size={28} color={t.accent} />
                </View>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: 'bold' }}>Ganti Cover</Text>
              </View>
            )}
          </Pressable>

          {[
            { label: 'Judul Buku *', value: title, setter: setTitle, placeholder: 'Masukkan judul buku...' },
            { label: 'Penulis *', value: author, setter: setAuthor, placeholder: 'Nama penulis...' },
            { label: 'Genre', value: genre, setter: setGenre, placeholder: 'Fiksi, Sains, Sejarah, dll.' },
          ].map(field => (
            <View key={field.label} style={{ marginBottom: 20 }}>
              <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{field.label}</Text>
              <TextInput style={inputStyle} value={field.value} onChangeText={field.setter} placeholder={field.placeholder} placeholderTextColor={t.textMuted} />
            </View>
          ))}

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Berkas E-Book (PDF)</Text>
            <Pressable style={[inputStyle, { flexDirection: 'row', alignItems: 'center', gap: 12 }]} onPress={pickPdf}>
              <IconSymbol name="doc.fill" size={20} color={pdfUri ? '#10b981' : t.textMuted} />
              <Text style={{ color: pdfUri ? '#10b981' : t.textMuted, fontSize: 16, flex: 1, fontWeight: pdfUri ? 'bold' : 'normal' }} numberOfLines={1}>
                {pdfUri ? 'File PDF Terlampir ✓' : 'Pilih File PDF Baru'}
              </Text>
            </Pressable>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Sinopsis (Opsional)</Text>
            <TextInput style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]} value={synopsis} onChangeText={setSynopsis} placeholder="Tuliskan sinopsis singkat..." placeholderTextColor={t.textMuted} multiline numberOfLines={4} />
          </View>

          <Pressable style={{ backgroundColor: t.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, shadowColor: t.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 }} onPress={handleSave}>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Simpan Perubahan</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
