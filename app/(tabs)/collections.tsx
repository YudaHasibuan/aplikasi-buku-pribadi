import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Modal, Alert, Platform } from 'react-native';
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
      Alert.alert('Error', 'Nama rak tidak boleh kosong.');
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
      Alert.alert('Error', 'Gagal membuat rak baru.');
    }
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    Alert.alert(
      'Hapus Rak Buku',
      'Yakin ingin menghapus rak ini? Buku di dalamnya tidak akan ikut terhapus.',
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
          <View>
            <Text style={styles.subtitle}>Kelompokkan Buku Anda</Text>
            <Text style={styles.title}>Koleksi & Rak</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Rak Baru</Text>
          </Pressable>
        </View>

        {collections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol name="folder" size={48} color="#0284c7" />
            </View>
            <Text style={styles.emptyText}>Belum Ada Rak</Text>
            <Text style={styles.emptySubText}>Buat rak kustom pertama Anda untuk menyortir buku fisik maupun e-book digital.</Text>
            <Pressable style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyButtonText}>Buat Rak Sekarang</Text>
            </Pressable>
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
                  <IconSymbol name="folder" size={28} color="#0284c7" />
                </View>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionName} numberOfLines={1}>{col.name}</Text>
                  <Text style={styles.collectionCount}>{col.bookCount || 0} Buku Terdaftar</Text>
                </View>
                <Pressable onPress={() => handleDelete(col.id)} style={styles.deleteButton}>
                  <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Add Collection */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buat Rak Baru</Text>
            
            <Text style={styles.modalLabel}>Nama Rak *</Text>
            <TextInput
              style={styles.modalInput}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Contoh: Kuliah, Novel Favorit, dll."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.modalLabel}>Deskripsi (Opsional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newCollectionDesc}
              onChangeText={setNewCollectionDesc}
              placeholder="Berikan penjelasan singkat mengenai rak ini..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleAddCollection}>
                <Text style={styles.modalSaveText}>Simpan Rak</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e2e8f0' },
  scrollContent: { paddingBottom: 40 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 20, 
    paddingBottom: 24 
  },
  title: { color: '#0f172a', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 },
  subtitle: { color: '#475569', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0284c7', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    gap: 6,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 60, 
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    borderRadius: 24,
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: { color: '#0f172a', fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  emptySubText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24
  },
  emptyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  collectionsList: { paddingHorizontal: 24, gap: 16 },
  collectionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  collectionIconContainer: { 
    width: 56, 
    height: 56, 
    backgroundColor: '#e0f2fe', 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16,
  },
  collectionInfo: { flex: 1 },
  collectionName: { color: '#0f172a', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  collectionCount: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  deleteButton: { padding: 8 },

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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#0284c7' },
  modalCancelText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  modalSaveText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
