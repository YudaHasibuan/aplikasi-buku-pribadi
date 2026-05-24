import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getBooksByCollection, getAllBooks, addBookToCollection, removeBookFromCollection, Book } from '@/database/db';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [collectionBooks, setCollectionBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const fetchCollectionData = async () => {
    if (id) {
      const colBooks = await getBooksByCollection(Number(id));
      setCollectionBooks(colBooks);
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, [id]);

  const openAddModal = async () => {
    const books = await getAllBooks();
    setAllBooks(books);
    setModalVisible(true);
  };

  const handleAddBookToShelf = async (bookId: number) => {
    if (id) {
      await addBookToCollection(Number(id), bookId);
      await fetchCollectionData();
      Alert.alert('Sukses', 'Buku berhasil ditambahkan ke rak!');
    }
  };

  const handleRemoveFromShelf = async (bookId: number) => {
    if (id) {
      Alert.alert(
        'Keluarkan Buku',
        'Yakin ingin mengeluarkan buku ini dari rak?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Keluarkan',
            style: 'destructive',
            onPress: async () => {
              await removeBookFromCollection(Number(id), bookId);
              await fetchCollectionData();
            }
          }
        ]
      );
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Detail Rak',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0f172a',
          headerRight: () => (
            <Pressable onPress={openAddModal} style={{ marginRight: 16 }}>
              <IconSymbol name="plus.circle.fill" size={24} color="#0284c7" />
            </Pressable>
          ),
        }} 
      />
      <View style={styles.container}>
        {collectionBooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol name="folder" size={48} color="#0284c7" />
            </View>
            <Text style={styles.emptyText}>Rak ini masih kosong.</Text>
            <Text style={styles.emptySubText}>Tambahkan buku dari koleksi Anda ke rak ini agar terorganisir.</Text>
            <Pressable style={styles.addBookBtn} onPress={openAddModal}>
              <Text style={styles.addBookBtnText}>Pilih Buku Sekarang</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              {collectionBooks.map((book) => (
                <View key={book.id} style={styles.bookCard}>
                  <Link href={`/book/${book.id}`} asChild>
                    <Pressable style={styles.bookInfoRow}>
                      {book.cover ? (
                        <Image source={{ uri: book.cover }} style={styles.bookCover} />
                      ) : (
                        <View style={[styles.bookCover, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }]}>
                          <IconSymbol name="books.vertical.fill" size={20} color="#94a3b8" />
                        </View>
                      )}
                      <View style={styles.bookTextContent}>
                        <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                        <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                      </View>
                    </Pressable>
                  </Link>
                  <Pressable onPress={() => handleRemoveFromShelf(book.id!)} style={styles.removeBtn}>
                    <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Modal for Adding Book to Shelf */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Buku</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>Tutup</Text>
                </Pressable>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {allBooks.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b' }}>Belum ada buku di perpustakaan Anda.</Text>
                  </View>
                ) : (
                  allBooks.map((book) => {
                    const isAlreadyInShelf = collectionBooks.some(cb => cb.id === book.id);
                    return (
                      <View key={book.id} style={styles.modalBookCard}>
                        <Text style={styles.modalBookTitle} numberOfLines={1}>{book.title}</Text>
                        {isAlreadyInShelf ? (
                          <Text style={styles.alreadyAddedText}>Sudah di rak</Text>
                        ) : (
                          <Pressable style={styles.addToShelfBtn} onPress={() => handleAddBookToShelf(book.id!)}>
                            <Text style={styles.addToShelfText}>Tambah</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24,
    backgroundColor: '#ffffff',
    margin: 24,
    borderRadius: 24,
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
  emptyText: { color: '#0f172a', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  emptySubText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  addBookBtn: { backgroundColor: '#0284c7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addBookBtnText: { color: '#ffffff', fontWeight: 'bold' },
  scrollContent: { padding: 24 },
  listContainer: { gap: 16 },
  bookCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden' 
  },
  bookInfoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12 },
  bookCover: { width: 44, height: 66, borderRadius: 8, marginRight: 14 },
  bookTextContent: { flex: 1 },
  bookTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bookAuthor: { color: '#64748b', fontSize: 14 },
  removeBtn: { padding: 16 },

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
    maxHeight: '70%', 
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: 'bold' },
  closeBtnText: { color: '#0284c7', fontSize: 16, fontWeight: '600' },
  modalScroll: { flex: 1 },
  modalBookCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  modalBookTitle: { color: '#0f172a', fontSize: 16, flex: 1, marginRight: 16, fontWeight: '600' },
  alreadyAddedText: { color: '#64748b', fontSize: 14, fontStyle: 'italic', fontWeight: '500' },
  addToShelfBtn: { backgroundColor: '#e0f2fe', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addToShelfText: { color: '#0284c7', fontSize: 14, fontWeight: '600' },
});
