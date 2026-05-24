import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getAllBooks, Book } from '@/database/db';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const INSPIRED_QUOTES = [
  { text: "Buku adalah jendela dunia di mana kita bisa melihat masa lalu dan merancang masa depan.", author: "Anonim" },
  { text: "Membaca adalah alat paling mendasar untuk memperoleh keterampilan hidup.", author: "Barack Obama" },
  { text: "Aku rela di penjara asalkan bersama buku, karena dengan buku aku bebas.", author: "Mohammad Hatta" },
  { text: "Jika Anda tidak suka membaca, Anda belum menemukan buku yang tepat.", author: "J.K. Rowling" }
];

export default function StatsHubScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Fetch books on screen focus to keep stats real-time
  useFocusEffect(
    useCallback(() => {
      const loadBooks = async () => {
        const allBooks = await getAllBooks();
        setBooks(allBooks);
      };
      loadBooks();
      
      // Randomize quote
      setQuoteIndex(Math.floor(Math.random() * INSPIRED_QUOTES.length));
    }, [])
  );

  // Calculate statistics
  const totalBooks = books.length;
  const completedBooks = books.filter(b => b.status === 'Selesai').length;
  const readingBooks = books.filter(b => b.status === 'Sedang Dibaca').length;
  const wantedBooks = books.filter(b => b.status === 'Ingin Baca').length;
  const pausedBooks = books.filter(b => b.status === 'Ditunda').length;
  const pdfBooks = books.filter(b => b.pdf_uri && b.pdf_uri.length > 0).length;

  const totalProgress = books.reduce((acc, curr) => acc + (curr.progress || 0), 0);
  const averageProgress = totalBooks > 0 ? Math.round(totalProgress / totalBooks) : 0;

  // Favorite Genre
  const genres = books.map(b => b.genre).filter(g => g && g.trim() !== '');
  const genreCounts = genres.reduce((acc, curr) => {
    acc[curr!] = (acc[curr!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let favoriteGenre = 'Belum Ada';
  let maxCount = 0;
  Object.entries(genreCounts).forEach(([genre, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteGenre = genre;
    }
  });

  // Calculate ratio percentages for chart
  const completedPct = totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0;
  const readingPct = totalBooks > 0 ? (readingBooks / totalBooks) * 100 : 0;
  const wantedPct = totalBooks > 0 ? (wantedBooks / totalBooks) * 100 : 0;
  const pausedPct = totalBooks > 0 ? (pausedBooks / totalBooks) * 100 : 0;

  const activeQuote = INSPIRED_QUOTES[quoteIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analisis & Progres</Text>
          <Text style={styles.subtitle}>Pantau pencapaian dan kebiasaan membaca Anda.</Text>
        </View>

        {/* Inspirational Quote Card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{activeQuote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {activeQuote.author}</Text>
        </View>

        {/* Grid Stats */}
        <View style={styles.gridContainer}>
          
          {/* Card Total Buku */}
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#EDE9FE' }]}>
              <IconSymbol name="books.vertical.fill" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.statNumber}>{totalBooks}</Text>
            <Text style={styles.statLabel}>Total Koleksi</Text>
          </View>

          {/* Card E-Book PDF */}
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#dcfce7' }]}>
              <IconSymbol name="doc.fill" size={24} color="#15803d" />
            </View>
            <Text style={styles.statNumber}>{pdfBooks}</Text>
            <Text style={styles.statLabel}>E-Book (PDF)</Text>
          </View>

          {/* Card Progres Rata-rata */}
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f3e8ff' }]}>
              <IconSymbol name="sparkles" size={24} color="#7e22ce" />
            </View>
            <Text style={styles.statNumber}>{averageProgress}%</Text>
            <Text style={styles.statLabel}>Rerata Progres</Text>
          </View>

          {/* Card Genre Terfavorit */}
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}>
              <IconSymbol name="heart.fill" size={24} color="#b45309" />
            </View>
            <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>{favoriteGenre}</Text>
            <Text style={styles.statLabel}>Genre Favorit</Text>
          </View>

        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Visualisasi Status Baca</Text>
          
          {totalBooks === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>Tambahkan buku terlebih dahulu untuk melihat grafik status membaca Anda.</Text>
            </View>
          ) : (
            <>
              {/* Custom Stacked Progress Bar Chart */}
              <View style={styles.chartBarContainer}>
                {readingPct > 0 && <View style={[styles.chartBarSegment, { width: `${readingPct}%`, backgroundColor: '#3b82f6' }]} />}
                {completedPct > 0 && <View style={[styles.chartBarSegment, { width: `${completedPct}%`, backgroundColor: '#10b981' }]} />}
                {wantedPct > 0 && <View style={[styles.chartBarSegment, { width: `${wantedPct}%`, backgroundColor: '#7C3AED' }]} />}
                {pausedPct > 0 && <View style={[styles.chartBarSegment, { width: `${pausedPct}%`, backgroundColor: '#f59e0b' }]} />}
              </View>

              {/* Legends */}
              <View style={styles.legendContainer}>
                
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: '#3b82f6' }]} />
                  <View style={styles.legendTextWrapper}>
                    <Text style={styles.legendName}>Sedang Dibaca</Text>
                    <Text style={styles.legendVal}>{readingBooks} Buku ({Math.round(readingPct)}%)</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: '#10b981' }]} />
                  <View style={styles.legendTextWrapper}>
                    <Text style={styles.legendName}>Selesai</Text>
                    <Text style={styles.legendVal}>{completedBooks} Buku ({Math.round(completedPct)}%)</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: '#7C3AED' }]} />
                  <View style={styles.legendTextWrapper}>
                    <Text style={styles.legendName}>Ingin Baca</Text>
                    <Text style={styles.legendVal}>{wantedBooks} Buku ({Math.round(wantedPct)}%)</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: '#f59e0b' }]} />
                  <View style={styles.legendTextWrapper}>
                    <Text style={styles.legendName}>Ditunda</Text>
                    <Text style={styles.legendVal}>{pausedBooks} Buku ({Math.round(pausedPct)}%)</Text>
                  </View>
                </View>

              </View>
            </>
          )}
        </View>

        {/* Habits Checklist Banner */}
        <View style={styles.habitsContainer}>
          <Text style={styles.sectionTitle}>Habits Tracker</Text>
          <View style={styles.habitCard}>
            <View style={styles.habitRow}>
              <View style={styles.habitDotActive} />
              <Text style={styles.habitText}>Membaca minimal 15 menit hari ini</Text>
            </View>
            <View style={styles.habitRow}>
              <View style={styles.habitDotActive} />
              <Text style={styles.habitText}>Catat progres membaca setiap hari</Text>
            </View>
            <View style={styles.habitRow}>
              <View style={styles.habitDot} />
              <Text style={styles.habitText}>Tulis review singkat setelah selesai membaca</Text>
            </View>
          </View>
        </View>

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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#0f172a', // Slate 900
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    color: '#475569', // Slate 600
    fontSize: 15,
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE', // Soft Light Blue Border
    borderStyle: 'dashed',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quoteText: {
    color: '#0f172a',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteAuthor: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: isWeb ? '23%' : '47%',
    marginHorizontal: '1.5%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyChart: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  chartBarContainer: {
    height: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 24,
  },
  chartBarSegment: {
    height: '100%',
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 12,
  },
  legendTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  legendName: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
  },
  legendVal: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  habitsContainer: {
    paddingHorizontal: 24,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  habitDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  habitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
    marginRight: 12,
  },
  habitText: {
    color: '#334155',
    fontSize: 14,
  },
});
