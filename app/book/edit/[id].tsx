import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getBookById, updateBook, Book } from '@/database/db';
import { router, useLocalSearchParams, Stack } from 'expo-router';

export default function EditBookScreen() {
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
          setBook(data);
          setTitle(data.title);
          setAuthor(data.author);
          setGenre(data.genre || '');
          setSynopsis(data.synopsis || '');
          setCover(data.cover || null);
          setPdfUri(data.pdf_uri || null);
        }
      }
    };
    fetchBook();
  }, [id]);

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

    if (book && id) {
      const updatedBook: Book = {
        ...book,
        title,
        author,
        genre,
        synopsis,
        cover: cover || '',
        pdf_uri: pdfUri || '',
      };

      try {
        await updateBook(Number(id), updatedBook);
        Alert.alert('Sukses', 'Data buku berhasil diperbarui!');
        router.back();
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Gagal memperbarui buku');
      }
    }
  };

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memuat buku...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Buku',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0f172a',
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Cover Upload Box */}
          <Pressable style={styles.coverUpload} onPress={pickImage}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <View style={styles.cameraIconContainer}>
                  <IconSymbol name="camera" size={28} color="#0284c7" />
                </View>
                <Text style={styles.coverText}>Ganti Cover Buku</Text>
                <Text style={styles.coverSubtext}>Rekomendasi rasio 2:3</Text>
              </View>
            )}
          </Pressable>

          {/* Form Fields */}
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
              placeholder="Nama penulis..." 
              placeholderTextColor="#94a3b8" 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Genre</Text>
            <TextInput 
              style={styles.input} 
              value={genre} 
              onChangeText={setGenre} 
              placeholder="Contoh: Fiction, Science, dll." 
              placeholderTextColor="#94a3b8" 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Berkas E-Book (PDF)</Text>
            <Pressable style={styles.pdfUploadBtn} onPress={pickPdf}>
              <IconSymbol name="doc.fill" size={20} color={pdfUri ? "#10b981" : "#94a3b8"} />
              <Text style={[styles.pdfUploadText, pdfUri && { color: '#10b981', fontWeight: 'bold' }]} numberOfLines={1}>
                {pdfUri ? 'File PDF Terlampir' : 'Pilih File PDF Baru'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sinopsis (Opsional)</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={synopsis} 
              onChangeText={setSynopsis} 
              placeholder="Tuliskan sinopsis singkat..." 
              placeholderTextColor="#94a3b8" 
              multiline 
              numberOfLines={4} 
            />
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 16 },
  container: { flex: 1, backgroundColor: '#e2e8f0' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  coverUpload: {
    width: 150, 
    height: 220, 
    backgroundColor: '#ffffff',
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#e0f2fe',
    borderStyle: 'dashed', 
    alignSelf: 'center', 
    marginBottom: 28,
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
    shadowColor: '#0284c7',
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
    backgroundColor: '#e0f2fe',
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
    borderColor: '#e0f2fe',
    fontSize: 16, 
    outlineStyle: 'none',
    shadowColor: '#0284c7',
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
    borderColor: '#e0f2fe', 
    gap: 12,
    shadowColor: '#0284c7',
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
