import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { addBook, Book } from '@/database/db';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AddBookScreen() {
  const { theme: t } = useTheme();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);

  useEffect(() => {
    if (params.title) setTitle(params.title as string);
    if (params.author) setAuthor(params.author as string);
    if (params.genre) setGenre(params.genre as string);
    if (params.cover) setCover(params.cover as string);
    if (params.synopsis) setSynopsis(params.synopsis as string);
  }, [params]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.7 });
    if (!result.canceled) setCover(result.assets[0].uri);
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        let uri = result.assets[0].uri;
        // On web, blob URIs expire on reload. Convert to base64 Data URI before saving.
        if (Platform.OS === 'web' && result.assets[0].file) {
          const file = result.assets[0].file;
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uri = base64;
        }
        setPdfUri(uri);
        setPdfName(result.assets[0].name);
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal memilih file PDF');
    }
  };

  const handleSave = async () => {
    if (!title || !author) { Alert.alert('Error', 'Judul dan Penulis wajib diisi!'); return; }
    const newBook: Book = { title, author, genre, synopsis, cover: cover || '', pdf_uri: pdfUri || '', status: 'Ingin Baca', progress: 0, rating: 0 };
    try {
      await addBook(newBook);
      Alert.alert('Sukses', 'Buku berhasil ditambahkan ke koleksi!');
      router.replace('/');
      setTitle(''); setAuthor(''); setGenre(''); setSynopsis(''); setCover(null); setPdfUri(null); setPdfName(null);
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan buku');
    }
  };

  const inputStyle: any = { backgroundColor: t.card, color: t.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: t.accentBorder, fontSize: 16, outlineStyle: 'none', shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ marginBottom: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>Tambahkan Buku Baru</Text>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }}>Koleksi Baru</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 6, shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }} onPress={() => router.push('/book/scan')}>
            <IconSymbol name="barcode.viewfinder" size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Scan ISBN</Text>
          </Pressable>
        </View>

        {/* Cover Upload */}
        <Pressable style={{ width: 150, height: 220, backgroundColor: t.card, borderRadius: 20, borderWidth: 2, borderColor: t.accentBorder, borderStyle: 'dashed', alignSelf: 'center', marginBottom: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 4 }} onPress={pickImage}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <IconSymbol name="camera" size={28} color={t.accent} />
              </View>
              <Text style={{ color: t.text, fontSize: 14, fontWeight: 'bold' }}>Upload Cover</Text>
              <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>Rasio 2:3</Text>
            </View>
          )}
        </Pressable>

        {/* PDF */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Berkas E-Book (PDF - Opsional)</Text>
          <Pressable style={[inputStyle, { flexDirection: 'row', alignItems: 'center', gap: 12 }]} onPress={pickPdf}>
            <IconSymbol name="doc.fill" size={20} color={pdfUri ? '#10b981' : t.textMuted} />
            <Text style={{ color: pdfUri ? '#10b981' : t.textMuted, fontSize: 16, flex: 1, fontWeight: pdfUri ? 'bold' : 'normal' }} numberOfLines={1}>
              {pdfName || 'Pilih File E-Book (PDF)'}
            </Text>
          </Pressable>
        </View>

        {/* Fields */}
        {[{ label: 'Judul Buku *', value: title, setter: setTitle, placeholder: 'Masukkan judul buku...' }, { label: 'Penulis *', value: author, setter: setAuthor, placeholder: 'Nama penulis...' }, { label: 'Genre', value: genre, setter: setGenre, placeholder: 'Fiksi, Sains, Sejarah, dll.' }].map(field => (
          <View key={field.label} style={{ marginBottom: 20 }}>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{field.label}</Text>
            <TextInput style={inputStyle} value={field.value} onChangeText={field.setter} placeholder={field.placeholder} placeholderTextColor={t.textMuted} />
          </View>
        ))}

        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Sinopsis (Opsional)</Text>
          <TextInput style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]} value={synopsis} onChangeText={setSynopsis} placeholder="Tuliskan sinopsis singkat..." placeholderTextColor={t.textMuted} multiline numberOfLines={4} />
        </View>

        <Pressable style={{ backgroundColor: t.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, shadowColor: t.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 }} onPress={handleSave}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Simpan Buku Ke Koleksi</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
