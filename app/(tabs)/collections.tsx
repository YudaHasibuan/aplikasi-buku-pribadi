import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCollections, addCollection, deleteCollection, Collection, initDb } from '@/database/db';
import { useFocusEffect, router } from 'expo-router';

export default function CollectionsScreen() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchCollections = async () => {
        try {
          await initDb();
          const data = await getCollections();
          if (isActive) setCollections(data);
        } catch (error) {
          console.error('Failed to fetch collections', error);
        }
      };
      fetchCollections();
      return () => { isActive = false; };
    }, [])
  );

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Nama koleksi tidak boleh kosong.');
      return;
    }
    
    try {
      await addCollection(newCollectionName, newCollectionDesc);
      const data = await getCollections();
      setCollections(data);
      setModalVisible(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal membuat koleksi baru.');
    }
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    Alert.alert(
      'Hapus Koleksi',
      'Yakin ingin menghapus koleksi ini? Buku di dalamnya tidak akan terhapus.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            await deleteCollection(id);
            const data = await getCollections();
            setCollections(data);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Koleksi & Rak</Text>
          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Rak Baru</Text>
          </Pressable>
        </View>

        {collections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="folder" size={64} color="#334155" />
            <Text style={styles.emptyText}>Belum ada koleksi.</Text>
            <Text style={styles.emptySubText}>Buat rak baru untuk mengelompokkan buku-buku Anda.</Text>
          </View>
        ) : (
          <View style={styles.collectionsList}>
            {collections.map((col) => (
              <Pressable 
                key={col.id} 
                style={styles.collectionCard}
                onPress={() => router.push(`/collection/${col.id}`)}
              >
                <View style={styles.collectionIconContainer}>
                  <IconSymbol name="folder" size={32} color="#818cf8" />
                </View>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionName}>{col.name}</Text>
                  <Text style={styles.collectionCount}>{col.bookCount} Buku</Text>
                </View>
                <Pressable onPress={() => handleDelete(col.id)} style={styles.deleteButton}>
                  <IconSymbol name="trash.fill" size={20} color="#64748b" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Add Collection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buat Rak Baru</Text>
            
            <Text style={styles.modalLabel}>Nama Rak</Text>
            <TextInput
              style={styles.modalInput}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Contoh: Bacaan Santai..."
              placeholderTextColor="#64748b"
            />

            <Text style={styles.modalLabel}>Deskripsi (Opsional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newCollectionDesc}
              onChangeText={setNewCollectionDesc}
              placeholder="Buku-buku untuk dibaca saat santai..."
              placeholderTextColor="#64748b"
              multiline
            />

            <View style={styles.modalActionRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleAddCollection}>
                <Text style={styles.modalSaveText}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: 'bold' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#818cf8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { color: '#cbd5e1', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8 },

  collectionsList: { paddingHorizontal: 24, gap: 16 },
  collectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  collectionIconContainer: { width: 56, height: 56, backgroundColor: '#1e293b', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  collectionInfo: { flex: 1 },
  collectionName: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  collectionCount: { color: '#94a3b8', fontSize: 14 },
  deleteButton: { padding: 8 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b', borderBottomWidth: 0 },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { backgroundColor: '#020617', color: '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', fontSize: 16, marginBottom: 20, outlineStyle: 'none' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e293b' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#818cf8' },
  modalCancelText: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  modalSaveText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
