import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, Dimensions, Pressable, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { getBookById, Book } from '@/database/db';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: W } = Dimensions.get('window');
const PAPER = '#FBF8F3';
const PAPER_TEXT = '#2D1B00';
const PAPER_MUTED = '#8B7355';
const SPINE = '#C9A87C';
const WORDS_PER_PAGE = 70;

function splitText(text: string): string[] {
  if (!text?.trim()) return [];
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
    chunks.push(words.slice(i, i + WORDS_PER_PAGE).join(' '));
  }
  return chunks;
}

type Page = { type: 'cover' | 'info' | 'text' | 'end'; content: string; heading?: string };

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams();
  const { theme: t } = useTheme();
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const b = await getBookById(Number(id));
        if (b) {
          setBook(b);
          const built: Page[] = [
            { type: 'cover', content: '', heading: b.title },
            {
              type: 'info',
              content: [
                `Penulis: ${b.author}`,
                `Genre: ${b.genre || 'Tidak diketahui'}`,
                `Status: ${b.status || '-'}`,
                `Progress: ${b.progress || 0}%`,
              ].join('\n'),
              heading: 'Informasi Buku',
            },
            ...splitText(b.synopsis || '').map((chunk, i): Page => ({
              type: 'text', content: chunk, heading: i === 0 ? 'Sinopsis' : undefined,
            })),
            { type: 'end', content: `"${b.title}"`, heading: b.author },
          ];
          setPages(built);
        }
      }
    };
    load();
  }, [id]);

  const animate = (dir: 'next' | 'prev') => {
    if (isAnimating.current) return;
    if (dir === 'next' && currentPage >= pages.length - 1) return;
    if (dir === 'prev' && currentPage <= 0) return;
    isAnimating.current = true;
    const out = dir === 'next' ? -W : W;
    const inn = dir === 'next' ? W : -W;
    Animated.timing(slideAnim, { toValue: out, useNativeDriver: true, duration: 280 }).start(() => {
      setCurrentPage(p => p + (dir === 'next' ? 1 : -1));
      slideAnim.setValue(inn);
      Animated.timing(slideAnim, { toValue: 0, useNativeDriver: true, duration: 220 }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 12 && Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderMove: (_, gs) => { if (!isAnimating.current) slideAnim.setValue(gs.dx * 0.35); },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx < -60) animate('next');
      else if (gs.dx > 60) animate('prev');
      else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    },
  })).current;

  if (!book || pages.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#7A5C3D', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Memuat buku...</Text>
      </View>
    );
  }

  const page = pages[currentPage];
  const maxDots = 9;
  const showDots = pages.length <= maxDots;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: '#7A5C3D', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

        {/* Close Button */}
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 44, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}
        >
          <IconSymbol name="xmark" size={16} color="#fff" />
        </Pressable>

        {/* Book Container */}
        <View style={{ width: W - 32, flex: 1, maxHeight: 680, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 12, height: 12 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 24 }}>

          {/* Spine */}
          <View style={{ width: 20, backgroundColor: SPINE, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: 'rgba(0,0,0,0.1)' }} />
            <Text style={{ color: '#7A5C3D', fontSize: 9, fontWeight: 'bold', width: 200, textAlign: 'center', transform: [{ rotate: '-90deg' }] }} numberOfLines={1}>
              {book.title}
            </Text>
          </View>

          {/* Page */}
          <Animated.View
            style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
            {...panResponder.panHandlers}
          >
            <View style={{ flex: 1, backgroundColor: PAPER, borderTopRightRadius: 6, borderBottomRightRadius: 6, overflow: 'hidden' }}>
              {/* Right-edge shadow (thickness illusion) */}
              <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, zIndex: 2, backgroundColor: 'transparent', shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.08, shadowRadius: 4 }} />

              {/* Content Area */}
              <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 36, paddingBottom: 12 }}>

                {/* ---- COVER PAGE ---- */}
                {page.type === 'cover' && (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={{ width: 130, height: 196, borderRadius: 4, marginBottom: 28 }} contentFit="cover" />
                    ) : (
                      <View style={{ width: 130, height: 196, backgroundColor: t.accentLight, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 28 }}>
                        <IconSymbol name="books.vertical.fill" size={56} color={t.accent} />
                      </View>
                    )}
                    <View style={{ width: 50, height: 1, backgroundColor: SPINE, marginBottom: 16 }} />
                    <Text style={{ color: PAPER_TEXT, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 }}>{book.title}</Text>
                    <Text style={{ color: PAPER_MUTED, fontSize: 15, textAlign: 'center', fontStyle: 'italic' }}>{book.author}</Text>
                  </View>
                )}

                {/* ---- INFO PAGE ---- */}
                {page.type === 'info' && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: PAPER_MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 20 }}>Tentang Buku</Text>
                    <Text style={{ color: PAPER_TEXT, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{page.heading}</Text>
                    <View style={{ width: 40, height: 2, backgroundColor: SPINE, marginBottom: 28 }} />
                    {page.content.split('\n').map((line, i) => {
                      const [label, ...val] = line.split(': ');
                      return (
                        <View key={i} style={{ marginBottom: 18 }}>
                          <Text style={{ color: PAPER_MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>{label}</Text>
                          <Text style={{ color: PAPER_TEXT, fontSize: 17, fontWeight: '600' }}>{val.join(': ')}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ---- TEXT PAGE ---- */}
                {page.type === 'text' && (
                  <View style={{ flex: 1 }}>
                    {page.heading && (
                      <>
                        <Text style={{ color: PAPER_MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>{page.heading}</Text>
                        <View style={{ width: 40, height: 2, backgroundColor: SPINE, marginBottom: 24 }} />
                      </>
                    )}
                    <Text style={{ color: PAPER_TEXT, fontSize: 16, lineHeight: 28, textAlign: 'justify' }}>
                      {'    '}{page.content}
                    </Text>
                  </View>
                )}

                {/* ---- END PAGE ---- */}
                {page.type === 'end' && (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: PAPER_MUTED, fontSize: 36, marginBottom: 20 }}>~ ~ ~</Text>
                    <Text style={{ color: PAPER_TEXT, fontSize: 18, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 }}>{page.content}</Text>
                    <Text style={{ color: PAPER_MUTED, fontSize: 14, marginBottom: 40 }}>— {page.heading}</Text>
                    <Pressable style={{ backgroundColor: t.accent, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }} onPress={() => router.back()}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Selesai Membaca</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Bottom Bar: page nav */}
              <View style={{ paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EAE0D5' }}>
                <Pressable onPress={() => animate('prev')} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', opacity: currentPage === 0 ? 0.2 : 1 }}>
                  <IconSymbol name="chevron.left" size={22} color={PAPER_MUTED} />
                </Pressable>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: PAPER_MUTED, fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>
                    {currentPage + 1} / {pages.length}
                  </Text>
                  {showDots && (
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      {pages.map((_, i) => (
                        <View key={i} style={{ width: i === currentPage ? 18 : 5, height: 5, borderRadius: 3, backgroundColor: i === currentPage ? t.accent : '#D4B896' }} />
                      ))}
                    </View>
                  )}
                  {!showDots && (
                    <View style={{ width: 80, height: 5, borderRadius: 3, backgroundColor: '#D4B896', overflow: 'hidden' }}>
                      <View style={{ width: `${((currentPage + 1) / pages.length) * 100}%` as any, height: '100%', backgroundColor: t.accent, borderRadius: 3 }} />
                    </View>
                  )}
                </View>

                <Pressable onPress={() => animate('next')} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', opacity: currentPage === pages.length - 1 ? 0.2 : 1 }}>
                  <IconSymbol name="chevron.right" size={22} color={PAPER_MUTED} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Swipe Hint */}
        {currentPage === 0 && (
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12, letterSpacing: 1 }}>
            ← Geser halaman untuk membaca →
          </Text>
        )}
      </View>
    </>
  );
}
