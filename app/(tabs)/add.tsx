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
        copyToCopyDirectory: true,
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Tambahkan Buku Baru</Text>
            <Text style={styles.title}>Koleksi Baru</Text>
          </View>
          <Pressable style={styles.scanButton} onPress={() => router.push('/book/scan')}>
            <IconSymbol name="barcode.viewfinder" size={20} color="#ffffff" />
            <Text style={styles.scanButtonText}>Scan ISBN</Text>
          </Pressable>
        </View>

        {/* Cover Upload Box */}
        <Pressable style={styles.coverUpload} onPress={pickImage}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <View style={styles.cameraIconContainer}>
                <IconSymbol name="camera" size={28} color="#7C3AED" />
              </View>
              <Text style={styles.coverText}>Upload Cover Buku</Text>
              <Text style={styles.coverSubtext}>Rekomendasi rasio 2:3</Text>
            </View>
          )}
        </Pressable>

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Berkas E-Book (PDF - Opsional)</Text>
          <Pressable style={styles.pdfUploadBtn} onPress={pickPdf}>
            <IconSymbol name="doc.fill" size={20} color={pdfUri ? "#10b981" : "#94a3b8"} />
            <Text style={[styles.pdfUploadText, pdfUri && { color: '#10b981', fontWeight: 'bold' }]} numberOfLines={1}>
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
            placeholderTextColor="#94a3b8" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Penulis *</Text>
          <TextInput 
            style={styles.input} 
            value={author} 
            onChangeText={setAuthor} 
            placeholder="Nama penulis atau pengarang..." 
            placeholderTextColor="#94a3b8" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Genre</Text>
          <TextInput 
            style={styles.input} 
            value={genre} 
            onChangeText={setGenre} 
            placeholder="Contoh: Fiksi, Sains, Sejarah, dll." 
            placeholderTextColor="#94a3b8" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sinopsis (Opsional)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={synopsis} 
            onChangeText={setSynopsis} 
            placeholder="Tuliskan sinopsis atau rangkuman singkat..." 
            placeholderTextColor="#94a3b8" 
            multiline 
            numberOfLines={4} 
          />
        </View>

        {/* Action Button */}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan Buku Ke Koleksi</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { 
    marginBottom: 28, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  title: { color: '#0f172a', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 },
  subtitle: { color: '#475569', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  scanButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#7C3AED', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    gap: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  scanButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  coverUpload: {
    width: 150, 
    height: 220, 
    backgroundColor: '#ffffff',
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#EDE9FE',
    borderStyle: 'dashed', 
    alignSelf: 'center', 
    marginBottom: 28,
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 4
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { alignItems: 'center', padding: 16 },
  cameraIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  coverText: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' },
  coverSubtext: { color: '#64748b', fontSize: 11, marginTop: 4 },
  formGroup: { marginBottom: 20 },
  label: { color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff', 
    color: '#0f172a', 
    paddingHorizontal: 16,
    paddingVertical: 14, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#EDE9FE',
    fontSize: 16, 
    outlineStyle: 'none', // for web
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  pdfUploadBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#EDE9FE', 
    gap: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  pdfUploadText: { color: '#64748b', fontSize: 16, flex: 1 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#0284c7', 
    paddingVertical: 16, 
    borderRadius: 14,
    alignItems: 'center', 
    marginTop: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
