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
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
          headerRight: () => (
            <Pressable onPress={openAddModal} style={{ marginRight: 16 }}>
              <IconSymbol name="plus.circle.fill" size={24} color="#818cf8" />
            </Pressable>
          ),
        }} 
      />
      <View style={styles.container}>
        {collectionBooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="folder" size={64} color="#334155" />
            <Text style={styles.emptyText}>Rak ini masih kosong.</Text>
            <Text style={styles.emptySubText}>Tambahkan buku dari koleksi Anda ke rak ini.</Text>
            <Pressable style={styles.addBookBtn} onPress={openAddModal}>
              <Text style={styles.addBookBtnText}>Pilih Buku</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.listContainer}>
              {collectionBooks.map((book) => (
                <View key={book.id} style={styles.bookCard}>
                  <Link href={`/book/${book.id}`} asChild>
                    <Pressable style={styles.bookInfoRow}>
                      {book.cover ? (
                        <Image source={{ uri: book.cover }} style={styles.bookCover} />
                      ) : (
                        <View style={[styles.bookCover, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
                          <IconSymbol name="books.vertical.fill" size={20} color="#64748b" />
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
          animationType="slide"
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
              <ScrollView style={styles.modalScroll}>
                {allBooks.map((book) => {
                  const isAlreadyInShelf = collectionBooks.some(cb => cb.id === book.id);
                  return (
                    <View key={book.id} style={styles.modalBookCard}>
                      <Text style={styles.modalBookTitle} numberOfLines={1}>{book.title}</Text>
                      {isAlreadyInShelf ? (
                        <Text style={styles.alreadyAddedText}>Sudah di rak</Text>
                      ) : (
                        <Pressable style={styles.addToShelfBtn} onPress={() => handleAddBookToShelf(book.id!)}>
                          <Text style={styles.addToShelfText}>Tambahkan</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#cbd5e1', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  addBookBtn: { backgroundColor: '#818cf8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addBookBtnText: { color: '#ffffff', fontWeight: 'bold' },
  scrollContent: { padding: 24 },
  listContainer: { gap: 16 },
  bookCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  bookInfoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12 },
  bookCover: { width: 40, height: 60, borderRadius: 4, marginRight: 12 },
  bookTextContent: { flex: 1 },
  bookTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  bookAuthor: { color: '#94a3b8', fontSize: 14 },
  removeBtn: { padding: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
  closeBtnText: { color: '#818cf8', fontSize: 16, fontWeight: '600' },
  modalScroll: { flex: 1 },
  modalBookCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalBookTitle: { color: '#f8fafc', fontSize: 16, flex: 1, marginRight: 16 },
  alreadyAddedText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
  addToShelfBtn: { backgroundColor: '#3730a3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addToShelfText: { color: '#e0e7ff', fontSize: 14, fontWeight: '600' },
});
