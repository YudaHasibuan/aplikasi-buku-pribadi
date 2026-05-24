import { Image } from 'expo-image';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useCallback } from 'react';
import { useFocusEffect, Link } from 'expo-router';
import { getAllBooks, Book, initDb } from '@/database/db';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchBooks = async () => {
        try {
          await initDb();
          const data = await getAllBooks();
          if (isActive) setBooks(data);
        } catch (error) {
          console.error('Failed to fetch books', error);
        }
      };
      fetchBooks();
      return () => { isActive = false; };
    }, [])
  );

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.genre && book.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentBooks = books.filter(b => b.status === 'Sedang Dibaca' || b.status === 'Ingin Baca').slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Evening,</Text>
            <Text style={styles.title}>Your Library</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop' }} 
              style={styles.avatar} 
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search titles, authors, or genres..." 
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Continue Reading Section (Only show if not searching) */}
        {!searchQuery && recentBooks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Reading</Text>
              <Pressable><Text style={styles.seeAll}>See All</Text></Pressable>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.horizontalScroll}
              snapToInterval={isWeb ? undefined : 220}
              decelerationRate="fast"
            >
              {recentBooks.map((book) => (
                <Link key={book.id?.toString()} href={`/book/${book.id}`} asChild>
                  <Pressable style={styles.recentBookCard}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={styles.recentBookCover} />
                    ) : (
                      <View style={[styles.recentBookCover, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
                        <IconSymbol name="books.vertical.fill" size={24} color="#64748b" />
                      </View>
                    )}
                    <View style={styles.recentBookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${book.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{book.progress}% completed</Text>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          </>
        )}

        {/* All Books Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Collection</Text>
        </View>

        {filteredBooks.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: '#64748b', fontSize: 16 }}>
              {searchQuery ? 'Buku tidak ditemukan.' : 'Belum ada buku. Yuk tambahkan koleksi pertamamu!'}
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
                      <View style={[styles.gridCover, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
                        <IconSymbol name="books.vertical.fill" size={40} color="#64748b" />
                      </View>
                    )}
                    {book.genre && (
                      <View style={styles.genreBadge}>
                        <Text style={styles.genreText} numberOfLines={1}>{book.genre}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridTitle} numberOfLines={2}>{book.title}</Text>
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
    backgroundColor: '#020617', // Slate 950
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
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 32,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#f8fafc',
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
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAll: {
    color: '#818cf8', // Indigo 400
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingBottom: 32,
  },
  recentBookCard: {
    width: 260,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginRight: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#818cf8',
    borderRadius: 3,
  },
  progressText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#1e293b',
  },
  gridCover: {
    width: '100%',
    height: '100%',
  },
  genreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backdropFilter: 'blur(8px)', // For web
    maxWidth: '80%',
  },
  genreText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridAuthor: {
    color: '#64748b',
    fontSize: 12,
  },
});
