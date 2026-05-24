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
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
              <Pressable onPress={handleToggleFavorite}>
                <IconSymbol 
                  name={book.is_favorite === 1 ? 'heart.fill' : 'heart'} 
                  size={24} 
                  color={book.is_favorite === 1 ? '#ef4444' : '#94a3b8'} 
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
              <IconSymbol name="books.vertical.fill" size={64} color="#64748b" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          
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
              placeholderTextColor="#64748b"
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
  loadingContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 16 },
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { paddingBottom: 40 },
  coverContainer: { width: '100%', height: 320, backgroundColor: '#0f172a' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: 24, marginTop: -20, backgroundColor: '#020617', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  author: { color: '#94a3b8', fontSize: 18, marginBottom: 24 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 16 },
  metaItem: { alignItems: 'center' },
  metaLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  metaValue: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold' },
  progressBarWrapper: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginBottom: 24, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#818cf8', borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryAction: { backgroundColor: '#818cf8' },
  secondaryAction: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' },
  actionText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  actionTextSecondary: { color: '#cbd5e1', fontSize: 16, fontWeight: 'bold' },
  readPdfButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12,
    marginBottom: 24, gap: 8
  },
  readPdfText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  synopsisContainer: { marginTop: 8 },
  sectionTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  synopsisText: { color: '#cbd5e1', fontSize: 15, lineHeight: 24 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: '#0f172a', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { backgroundColor: '#020617', color: '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', fontSize: 16, marginBottom: 20, outlineStyle: 'none' },
  statusGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'transparent' },
  statusChipActive: { backgroundColor: '#3730a3', borderColor: '#818cf8' },
  statusChipText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },
  statusChipTextActive: { color: '#e0e7ff', fontWeight: 'bold' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e293b' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#818cf8' },
  modalCancelText: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  modalSaveText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
