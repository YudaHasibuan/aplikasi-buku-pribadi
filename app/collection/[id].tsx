import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getBooksByCollection, getAllBooks, addBookToCollection, removeBookFromCollection, Book } from '@/database/db';
import { useTheme } from '@/contexts/ThemeContext';

export default function CollectionDetailScreen() {
  const { theme: t } = useTheme();
  const { id } = useLocalSearchParams();
  const [collectionBooks, setCollectionBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const fetchCollectionData = async () => {
    if (id) { const cb = await getBooksByCollection(Number(id)); setCollectionBooks(cb); }
  };

  useEffect(() => { fetchCollectionData(); }, [id]);

  const openAddModal = async () => {
    const books = await getAllBooks();
    setAllBooks(books);
    setModalVisible(true);
  };

  const handleAddBookToShelf = async (bookId: number) => {
    if (id) { await addBookToCollection(Number(id), bookId); await fetchCollectionData(); Alert.alert('Sukses', 'Buku berhasil ditambahkan!'); }
  };

  const handleRemoveFromShelf = async (bookId: number) => {
    if (id) {
      Alert.alert('Keluarkan Buku', 'Yakin ingin mengeluarkan buku ini dari rak?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluarkan', style: 'destructive', onPress: async () => { await removeBookFromCollection(Number(id), bookId); await fetchCollectionData(); } }
      ]);
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Detail Rak',
        headerStyle: { backgroundColor: t.card },
        headerTintColor: t.text,
        headerRight: () => (
          <Pressable onPress={openAddModal} style={{ marginRight: 16 }}>
            <IconSymbol name="plus.circle.fill" size={24} color={t.accent} />
          </Pressable>
        ),
      }} />

      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {collectionBooks.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: t.card, margin: 24, borderRadius: 24, borderWidth: 1, borderColor: t.accentBorder }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <IconSymbol name="folder" size={40} color={t.accent} />
            </View>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>Rak ini masih kosong.</Text>
            <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 }}>Tambahkan buku dari koleksi Anda ke rak ini.</Text>
            <Pressable style={{ backgroundColor: t.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }} onPress={openAddModal}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Pilih Buku Sekarang</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
            {collectionBooks.map((book) => (
              <View key={book.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.accentBorder, shadowColor: t.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, overflow: 'hidden' }}>
                <Link href={`/book/${book.id}`} asChild>
                  <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={{ width: 44, height: 66, borderRadius: 8, marginRight: 14 }} />
                    ) : (
                      <View style={{ width: 44, height: 66, borderRadius: 8, marginRight: 14, backgroundColor: t.accentLight, justifyContent: 'center', alignItems: 'center' }}>
                        <IconSymbol name="books.vertical.fill" size={20} color={t.accent} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>{book.title}</Text>
                      <Text style={{ color: t.textMuted, fontSize: 14 }} numberOfLines={1}>{book.author}</Text>
                    </View>
                  </Pressable>
                </Link>
                <Pressable onPress={() => handleRemoveFromShelf(book.id!)} style={{ padding: 16 }}>
                  <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ width: '100%', maxHeight: '70%', backgroundColor: t.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: t.accentBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: t.text, fontSize: 20, fontWeight: 'bold' }}>Pilih Buku</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={{ color: t.accent, fontSize: 16, fontWeight: '600' }}>Tutup</Text>
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {allBooks.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ color: t.textMuted }}>Belum ada buku di perpustakaan Anda.</Text>
                  </View>
                ) : (
                  allBooks.map((book) => {
                    const inShelf = collectionBooks.some(cb => cb.id === book.id);
                    return (
                      <View key={book.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.accentBorder }}>
                        <Text style={{ color: t.text, fontSize: 16, flex: 1, marginRight: 16, fontWeight: '600' }} numberOfLines={1}>{book.title}</Text>
                        {inShelf ? (
                          <Text style={{ color: t.textMuted, fontSize: 14, fontStyle: 'italic' }}>Sudah di rak</Text>
                        ) : (
                          <Pressable style={{ backgroundColor: t.accentLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }} onPress={() => handleAddBookToShelf(book.id!)}>
                            <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>Tambah</Text>
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
