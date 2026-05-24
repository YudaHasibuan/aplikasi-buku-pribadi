import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { addBook, Book } from '@/database/db';
import { router, useLocalSearchParams } from 'expo-router';

export default function AddBookScreen() {
  const params = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);

  // Auto-fill from params if navigating from scan
  useEffect(() => {
    if (params.title) setTitle(params.title as string);
    if (params.author) setAuthor(params.author as string);
    if (params.genre) setGenre(params.genre as string);
    if (params.cover) setCover(params.cover as string);
    if (params.synopsis) setSynopsis(params.synopsis as string);
  }, [params]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setCover(result.assets[0].uri);
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPdfUri(result.assets[0].uri);
        setPdfName(result.assets[0].name);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal memilih file PDF');
    }
  };

  const handleSave = async () => {
    if (!title || !author) {
      Alert.alert('Error', 'Judul dan Penulis wajib diisi!');
      return;
    }

    const newBook: Book = {
      title,
      author,
      genre,
      synopsis,
      cover: cover || '',
      pdf_uri: pdfUri || '',
      status: 'Ingin Baca',
      progress: 0,
      rating: 0,
    };

    try {
      await addBook(newBook);
      Alert.alert('Sukses', 'Buku berhasil ditambahkan ke koleksi!');
      router.replace('/'); // Kembali ke Home
      
      // Reset form
      setTitle(''); setAuthor(''); setGenre(''); setSynopsis(''); setCover(null); setPdfUri(null); setPdfName(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan buku');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Book</Text>
          <Pressable style={styles.scanButton} onPress={() => router.push('/book/scan')}>
            <IconSymbol name="barcode.viewfinder" size={20} color="#ffffff" />
            <Text style={styles.scanButtonText}>Scan ISBN</Text>
          </Pressable>
        </View>

        <Pressable style={styles.coverUpload} onPress={pickImage}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <IconSymbol name="camera" size={32} color="#64748b" />
              <Text style={styles.coverText}>Upload Cover</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.formGroup}>
          <Text style={styles.label}>File PDF (Opsional)</Text>
          <Pressable style={styles.pdfUploadBtn} onPress={pickPdf}>
            <IconSymbol name="doc.fill" size={24} color={pdfUri ? "#818cf8" : "#64748b"} />
            <Text style={[styles.pdfUploadText, pdfUri && { color: '#818cf8' }]} numberOfLines={1}>
              {pdfName || 'Pilih File E-Book (PDF)'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Judul Buku *</Text>
          <TextInput 
            style={styles.input} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="Masukkan judul buku..." 
            placeholderTextColor="#64748b" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Penulis *</Text>
          <TextInput 
            style={styles.input} 
            value={author} 
            onChangeText={setAuthor} 
            placeholder="Nama penulis..." 
            placeholderTextColor="#64748b" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Genre</Text>
          <TextInput 
            style={styles.input} 
            value={genre} 
            onChangeText={setGenre} 
            placeholder="Contoh: Fiction, Science, dll." 
            placeholderTextColor="#64748b" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sinopsis (Opsional)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={synopsis} 
            onChangeText={setSynopsis} 
            placeholder="Tuliskan sinopsis singkat..." 
            placeholderTextColor="#64748b" 
            multiline 
            numberOfLines={4} 
          />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan Buku</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: 'bold' },
  scanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3730a3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  scanButtonText: { color: '#e0e7ff', fontSize: 14, fontWeight: '600' },
  coverUpload: {
    width: 140, height: 210, backgroundColor: '#0f172a',
    borderRadius: 12, borderWidth: 2, borderColor: '#1e293b',
    borderStyle: 'dashed', alignSelf: 'center', marginBottom: 24,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { alignItems: 'center' },
  coverText: { color: '#64748b', marginTop: 8, fontSize: 14 },
  formGroup: { marginBottom: 20 },
  label: { color: '#cbd5e1', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#0f172a', color: '#f8fafc', paddingHorizontal: 16,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b',
    fontSize: 16, outlineStyle: 'none' // for web
  },
  pdfUploadBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', 
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, 
    borderWidth: 1, borderColor: '#1e293b', gap: 12
  },
  pdfUploadText: { color: '#64748b', fontSize: 16, flex: 1 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#818cf8', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 12
  },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
