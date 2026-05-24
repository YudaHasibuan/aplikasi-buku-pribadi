import { Image } from 'expo-image';
import { View, Text, ScrollView, TextInput, Pressable, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useCallback } from 'react';
import { useFocusEffect, Link } from 'expo-router';
import { getAllBooks, Book, initDb, getSetting } from '@/database/db';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LibraryScreen() {
  const { theme: t } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi 🌅';
    if (h < 17) return 'Selamat Siang ☀️';
    if (h < 21) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌌';
  };

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
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
          <View>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>{getGreeting()}</Text>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }}>{userName}</Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: t.accent, overflow: 'hidden' }}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ flex: 1, backgroundColor: t.accentLight, justifyContent: 'center', alignItems: 'center' }}>
                <IconSymbol name="person.fill" size={24} color={t.accent} />
              </View>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, marginHorizontal: 24, paddingHorizontal: 16, height: 52, borderRadius: 16, borderWidth: 1, borderColor: t.accentBorder, marginBottom: 24, shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
          <IconSymbol name="magnifyingglass" size={20} color={t.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 12, color: t.text, fontSize: 16, outlineStyle: 'none' } as any}
            placeholder="Cari judul, penulis, atau genre..."
            placeholderTextColor={t.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Continue Reading */}
        {!searchQuery && activeFilter === 'Semua' && recentBooks.length > 0 && (
          <>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', paddingHorizontal: 24, marginBottom: 16 }}>Lanjutkan Membaca</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingBottom: 24 }} snapToInterval={280} decelerationRate="fast">
              {recentBooks.map((book) => (
                <Link key={book.id?.toString()} href={`/book/${book.id}`} asChild>
                  <Pressable style={{ width: 270, backgroundColor: t.card, borderRadius: 20, marginRight: 16, padding: 16, flexDirection: 'row', borderWidth: 1, borderColor: t.accentBorder, shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 }}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={{ width: 80, height: 120, borderRadius: 8 }} />
                    ) : (
                      <View style={{ width: 80, height: 120, borderRadius: 8, backgroundColor: t.accentLight, justifyContent: 'center', alignItems: 'center' }}>
                        <IconSymbol name="books.vertical.fill" size={24} color={t.accent} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>{book.title}</Text>
                      <Text style={{ color: t.textSecondary, fontSize: 14, marginBottom: 16 }} numberOfLines={1}>{book.author}</Text>
                      <View style={{ height: 6, backgroundColor: t.bg, borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                        <View style={{ height: '100%', backgroundColor: t.accent, borderRadius: 3, width: `${book.progress}%` } as any} />
                      </View>
                      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '500' }}>{book.progress}% selesai</Text>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          </>
        )}

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, marginBottom: 24 }}>
          {filters.map((filter) => (
            <Pressable
              key={filter}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: activeFilter === filter ? t.accent : t.card, marginRight: 10, borderWidth: 1, borderColor: activeFilter === filter ? t.accent : t.accentBorder }}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={{ color: activeFilter === filter ? '#ffffff' : t.textSecondary, fontSize: 14, fontWeight: '600' }}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Section Title */}
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', paddingHorizontal: 24, marginBottom: 16 }}>
          {activeFilter === 'Semua' ? 'Semua Koleksi' : `Koleksi: ${activeFilter}`}
        </Text>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
            <IconSymbol name="books.vertical.fill" size={48} color={t.textMuted} />
            <Text style={{ color: t.textMuted, fontSize: 16, textAlign: 'center' }}>
              {searchQuery ? 'Buku tidak ditemukan.' : 'Tidak ada koleksi buku di kategori ini.'}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' }}>
            {filteredBooks.map((book) => (
              <Link key={book.id?.toString()} href={`/book/${book.id}`} asChild>
                <Pressable style={{ width: isWeb ? '22%' : '45%', marginHorizontal: '1.5%', marginBottom: 24, minWidth: 150 }}>
                  <View style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: t.card, borderWidth: 1, borderColor: t.accentBorder, shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: t.accentLight, justifyContent: 'center', alignItems: 'center' }}>
                        <IconSymbol name="books.vertical.fill" size={40} color={t.accent} />
                      </View>
                    )}
                    {book.genre && (
                      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: t.card + 'ee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, maxWidth: '80%' }}>
                        <Text style={{ color: t.accent, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }} numberOfLines={1}>{book.genre}</Text>
                      </View>
                    )}
                    {book.is_favorite === 1 && (
                      <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: t.card + 'ee', padding: 6, borderRadius: 8 }}>
                        <IconSymbol name="heart.fill" size={12} color="#ef4444" />
                      </View>
                    )}
                  </View>
                  <Text style={{ color: t.text, fontSize: 14, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>{book.title}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>{book.author}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
