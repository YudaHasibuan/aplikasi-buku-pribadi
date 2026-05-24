import { Image } from 'expo-image';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useCallback } from 'react';
import { useFocusEffect, Link } from 'expo-router';
import { getAllBooks, Book, initDb, getSetting } from '@/database/db';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua'); // 'Semua', 'Sedang Dibaca', 'Selesai', 'Ingin Baca', 'Favorit'
  const [userName, setUserName] = useState('Perpustakaanku');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchBooks = async () => {
        try {
          await initDb();
          const data = await getAllBooks();
          const name = await getSetting('userName', 'Perpustakaanku');
          const avatar = await getSetting('userAvatar', '');
          
          if (isActive) {
            setBooks(data);
            setUserName(name);
            if (avatar) setUserAvatar(avatar);
          }
        } catch (error) {
          console.error('Failed to fetch books', error);
        }
      };
      fetchBooks();
      return () => { isActive = false; };
    }, [])
  );

  // Dynamic Greeting based on time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Selamat Pagi 🌅';
    if (hours < 17) return 'Selamat Siang ☀️';
    if (hours < 21) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌌';
  };

  // Filter books by search and filter chips
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;

    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Sedang Dibaca') return book.status === 'Sedang Dibaca';
    if (activeFilter === 'Selesai') return book.status === 'Selesai';
    if (activeFilter === 'Ingin Baca') return book.status === 'Ingin Baca';
    if (activeFilter === 'Favorit') return book.is_favorite === 1;

    return true;
  });

  const recentBooks = books.filter(b => b.status === 'Sedang Dibaca' || b.status === 'Ingin Baca').slice(0, 5);

  const filters = ['Semua', 'Sedang Dibaca', 'Selesai', 'Ingin Baca', 'Favorit'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>{userName}</Text>
          </View>
          <View style={styles.avatarContainer}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' }]}>
                <IconSymbol name="person.fill" size={24} color="#7C3AED" />
              </View>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#64748b" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Cari judul, penulis, atau genre..." 
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Continue Reading Section (Only show if not searching & not filtered) */}
        {!searchQuery && activeFilter === 'Semua' && recentBooks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lanjutkan Membaca</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.horizontalScroll}
              snapToInterval={280}
              decelerationRate="fast"
            >
              {recentBooks.map((book) => (
                <Link key={book.id?.toString()} href={`/book/${book.id}`} asChild>
                  <Pressable style={styles.recentBookCard}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={styles.recentBookCover} />
                    ) : (
                      <View style={[styles.recentBookCover, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                        <IconSymbol name="books.vertical.fill" size={24} color="#94a3b8" />
                      </View>
                    )}
                    <View style={styles.recentBookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${book.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{book.progress}% selesai</Text>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          </>
        )}

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* All Books Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'Semua' ? 'Semua Koleksi' : `Koleksi: ${activeFilter}`}
          </Text>
        </View>

        {filteredBooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="books.vertical.fill" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Buku tidak ditemukan.' : 'Tidak ada koleksi buku di kategori ini.'}
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredBooks.map((book) => (
              <Link key={book.id?.toString()} href={`/book/${book.id}`} asChild>
                <Pressable style={styles.gridItem}>
                  <View style={styles.gridCoverContainer}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={styles.gridCover} />
                    ) : (
                      <View style={[styles.gridCover, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                        <IconSymbol name="books.vertical.fill" size={40} color="#94a3b8" />
                      </View>
                    )}
                    {book.genre && (
                      <View style={styles.genreBadge}>
                        <Text style={styles.genreText} numberOfLines={1}>{book.genre}</Text>
                      </View>
                    )}
                    {book.is_favorite === 1 && (
                      <View style={styles.favBadge}>
                        <IconSymbol name="heart.fill" size={12} color="#ef4444" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.gridAuthor} numberOfLines={1}>{book.author}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF', // Soft Gray Blue
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    color: '#475569', // Slate 600
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    color: '#0f172a', // Slate 900
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#7C3AED', // Sky blue border
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#0f172a',
    fontSize: 16,
    outlineStyle: 'none', // For web
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  horizontalScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingBottom: 24,
  },
  recentBookCard: {
    width: 270,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginRight: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  recentBookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  recentBookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  bookTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED', // Sky Blue
    borderRadius: 3,
  },
  progressText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  filterScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterChipText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: isWeb ? '22%' : '45%',
    marginHorizontal: '1.5%',
    marginBottom: 24,
    minWidth: 150,
  },
  gridCoverContainer: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  gridCover: {
    width: '100%',
    height: '100%',
  },
  genreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  genreText: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  favBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridAuthor: {
    color: '#64748b',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
});
