import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { getBookById, deleteBook, updateBook, Book } from '@/database/db';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isProgressModalVisible, setProgressModalVisible] = useState(false);
  
  // Progress form state
  const [tempProgress, setTempProgress] = useState('');
  const [tempStatus, setTempStatus] = useState('');

  const fetchDetail = async () => {
    if (id) {
      const data = await getBookById(Number(id));
      setBook(data);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Hapus Buku',
      'Apakah Anda yakin ingin menghapus buku ini dari koleksi?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive', 
          onPress: async () => {
            if (id) {
              await deleteBook(Number(id));
              router.back();
            }
          } 
        }
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (book && id) {
      const newFavStatus = book.is_favorite === 1 ? 0 : 1;
      await updateBook(Number(id), { ...book, is_favorite: newFavStatus });
      setBook({ ...book, is_favorite: newFavStatus });
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
      let parsedProgress = parseInt(tempProgress);
      if (isNaN(parsedProgress)) parsedProgress = 0;
      if (parsedProgress > 100) parsedProgress = 100;
      if (parsedProgress < 0) parsedProgress = 0;

      let newStatus = tempStatus;
      if (parsedProgress === 100) newStatus = 'Selesai';
      else if (parsedProgress > 0 && newStatus === 'Ingin Baca') newStatus = 'Sedang Dibaca';

      const updatedBook = { ...book, progress: parsedProgress, status: newStatus };
      await updateBook(Number(id), updatedBook);
      setBook(updatedBook);
      setProgressModalVisible(false);
    }
  };

  const handleReadPdf = async () => {
    if (!book?.pdf_uri) return;
    
    try {
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(book.pdf_uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/pdf',
        });
      } else {
        Linking.openURL(book.pdf_uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Gagal membuka file PDF. Pastikan Anda memiliki aplikasi pembaca PDF.');
    }
  };

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memuat buku...</Text>
      </View>
    );
  }

  const statuses = ['Ingin Baca', 'Sedang Dibaca', 'Selesai', 'Ditunda'];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: book.title,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0f172a',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
              <Pressable onPress={handleToggleFavorite}>
                <IconSymbol 
                  name={book.is_favorite === 1 ? 'heart.fill' : 'heart'} 
                  size={24} 
                  color={book.is_favorite === 1 ? '#ef4444' : '#64748b'} 
                />
              </Pressable>
              <Pressable onPress={handleDelete}>
                <IconSymbol name="trash.fill" size={24} color="#ef4444" />
              </Pressable>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverContainer}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <IconSymbol name="books.vertical.fill" size={64} color="#94a3b8" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>oleh {book.author}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{book.status}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Progress</Text>
              <Text style={styles.metaValue}>{book.progress}%</Text>
            </View>
            {book.genre ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Genre</Text>
                <Text style={styles.metaValue}>{book.genre}</Text>
              </View>
            ) : null}
          </View>

          {/* Progress Bar Display */}
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressBarFill, { width: `${book.progress || 0}%` }]} />
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={openProgressModal}>
              <Text style={styles.actionText}>{book.progress && book.progress > 0 ? 'Update Progress' : 'Catat Progress'}</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => router.push(`/book/edit/${id}`)}
            >
              <Text style={styles.actionTextSecondary}>Edit Buku</Text>
            </Pressable>
          </View>

          {book.pdf_uri ? (
            <Pressable style={styles.readPdfButton} onPress={handleReadPdf}>
              <IconSymbol name="doc.fill" size={20} color="#ffffff" />
              <Text style={styles.readPdfText}>Baca E-Book (PDF)</Text>
            </Pressable>
          ) : null}

          {book.synopsis ? (
            <View style={styles.synopsisContainer}>
              <Text style={styles.sectionTitle}>Sinopsis</Text>
              <Text style={styles.synopsisText}>{book.synopsis}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Progress Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isProgressModalVisible}
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Progress</Text>
            
            <Text style={styles.modalLabel}>Persentase Selesai (%)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProgress}
              onChangeText={setTempProgress}
              keyboardType="numeric"
              placeholder="0 - 100"
              placeholderTextColor="#94a3b8"
              maxLength={3}
            />

            <Text style={styles.modalLabel}>Status Baca</Text>
            <View style={styles.statusGroup}>
              {statuses.map(status => (
                <Pressable 
                  key={status}
                  style={[styles.statusChip, tempStatus === status && styles.statusChipActive]}
                  onPress={() => setTempStatus(status)}
                >
                  <Text style={[styles.statusChipText, tempStatus === status && styles.statusChipTextActive]}>{status}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setProgressModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={saveProgress}>
                <Text style={styles.modalSaveText}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 16 },
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContent: { paddingBottom: 40 },
  coverContainer: { width: '100%', height: 320, backgroundColor: '#EDE9FE' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { 
    padding: 24, 
    marginTop: -20, 
    backgroundColor: '#F5F3FF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8
  },
  title: { color: '#0f172a', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  author: { color: '#475569', fontSize: 18, marginBottom: 24 },
  metaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24, 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  metaItem: { alignItems: 'center' },
  metaLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  metaValue: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' },
  progressBarWrapper: { height: 8, backgroundColor: '#ffffff', borderRadius: 4, marginBottom: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE9FE' },
  progressBarFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryAction: { 
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  secondaryAction: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDE9FE' },
  actionText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  actionTextSecondary: { color: '#475569', fontSize: 16, fontWeight: 'bold' },
  readPdfButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12,
    marginBottom: 28, gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  readPdfText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  synopsisContainer: { marginTop: 8 },
  sectionTitle: { color: '#0f172a', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  synopsisText: { color: '#475569', fontSize: 15, lineHeight: 24 },
  
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modalContent: { 
    width: '100%', 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#e0f2fe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalLabel: { color: '#475569', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { 
    backgroundColor: '#f8fafc', 
    color: '#0f172a', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    fontSize: 16, 
    marginBottom: 20, 
    outlineStyle: 'none' 
  },
  statusGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: 'transparent' },
  statusChipActive: { backgroundColor: '#e0f2fe', borderColor: '#0284c7' },
  statusChipText: { color: '#475569', fontSize: 14, fontWeight: '500' },
  statusChipTextActive: { color: '#0284c7', fontWeight: 'bold' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#0284c7' },
  modalCancelText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  modalSaveText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
