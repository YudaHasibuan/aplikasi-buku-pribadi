import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Pressable, ActivityIndicator,
  Platform, StatusBar, Dimensions, Animated
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { getBookById, Book, updateBook } from '@/database/db';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: W, height: H } = Dimensions.get('window');

// PDF.js viewer HTML — renders any base64 PDF in a beautiful reader UI
function buildHtml(base64: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #FBF8F3; overflow-x: hidden; }
    #controls {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(251,248,243,0.95); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 16px; border-bottom: 1px solid #EAE0D5;
    }
    .nav-btn {
      background: #C9A87C; color: #fff; border: none; border-radius: 8px;
      padding: 6px 14px; font-size: 14px; font-weight: bold; cursor: pointer;
    }
    .nav-btn:disabled { opacity: 0.3; cursor: default; }
    #page-info { font-size: 14px; color: #7C6B55; font-weight: 600; }
    #canvas-container {
      padding: 48px 0 24px 0;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .page-canvas {
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      border-radius: 2px;
      background: #fff;
      max-width: 100%;
    }
    #loading { 
      display: flex; flex-direction: column; align-items: center; 
      justify-content: center; height: 100vh; color: #8B7355; gap: 12px; font-size: 16px;
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #EAE0D5;
      border-top-color: #C9A87C; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div><span>Memuat PDF...</span></div>
  <div id="controls" style="display:none;">
    <button class="nav-btn" id="prev-btn" onclick="changePage(-1)" disabled>◀ Sebelumnya</button>
    <span id="page-info">Halaman 1 / 1</span>
    <button class="nav-btn" id="next-btn" onclick="changePage(1)">Berikutnya ▶</button>
  </div>
  <div id="canvas-container" style="display:none;"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const base64Data = '${base64}';
    const pdfData = atob(base64Data);
    const uint8 = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) uint8[i] = pdfData.charCodeAt(i);

    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 0;
    const renderedPages = new Set();
    const container = document.getElementById('canvas-container');

    async function renderPage(num) {
      if (renderedPages.has(num)) return;
      renderedPages.add(num);
      const page = await pdfDoc.getPage(num);
      const vp = page.getViewport({ scale: Math.min(window.innerWidth / page.getViewport({scale:1}).width, 2) * 0.92 });
      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      canvas.id = 'page-' + num;
      canvas.width = vp.width;
      canvas.height = vp.height;
      container.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    }

    function changePage(delta) {
      currentPage = Math.min(Math.max(1, currentPage + delta), totalPages);
      const el = document.getElementById('page-' + currentPage);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('page-info').textContent = 'Halaman ' + currentPage + ' / ' + totalPages;
      document.getElementById('prev-btn').disabled = currentPage <= 1;
      document.getElementById('next-btn').disabled = currentPage >= totalPages;
      // Prerender neighbours
      if (currentPage + 1 <= totalPages) renderPage(currentPage + 1);
      if (currentPage - 1 >= 1) renderPage(currentPage - 1);
    }

    pdfjsLib.getDocument({ data: uint8 }).promise.then(async (pdf) => {
      pdfDoc = pdf;
      totalPages = pdf.numPages;
      document.getElementById('loading').style.display = 'none';
      document.getElementById('controls').style.display = 'flex';
      container.style.display = 'flex';
      document.getElementById('page-info').textContent = 'Halaman 1 / ' + totalPages;
      document.getElementById('next-btn').disabled = totalPages <= 1;
      // Render first 2 pages initially
      await renderPage(1);
      if (totalPages >= 2) renderPage(2);
    }).catch(err => {
      document.getElementById('loading').innerHTML = '<span style="color:#ef4444">Gagal memuat PDF.<br/>Pastikan file tidak rusak.</span>';
    });
  </script>
</body>
</html>`;
}

export default function PdfReaderScreen() {
  const { id } = useLocalSearchParams();
  const { theme: t } = useTheme();
  const [book, setBook] = useState<Book | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const b = await getBookById(Number(id));
        setBook(b);

        if (!b?.pdf_uri) {
          setError('Buku ini belum memiliki file E-Book (PDF).\nSilakan upload PDF melalui menu Edit Buku.');
          setLoading(false);
          return;
        }

        let base64 = '';
        if (Platform.OS === 'web') {
          // On web, pdf_uri is usually an object URL or data URI
          const response = await fetch(b.pdf_uri);
          const blob = await response.blob();
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              resolve(dataUrl.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          base64 = await FileSystem.readAsStringAsync(b.pdf_uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        setHtmlContent(buildHtml(base64));
        setLoading(false);

        // Fade in book
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

        // Auto-update reading status
        if (b.status === 'Ingin Baca') {
          await updateBook(Number(id), { ...b, status: 'Sedang Dibaca' });
        }
      } catch (e: any) {
        console.error(e);
        setError('Gagal memuat file PDF.\nPastikan file masih tersedia di perangkat.');
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      {/* Book Stage — warm mahogany background */}
      <View style={{ flex: 1, backgroundColor: '#5C3D1E', alignItems: 'center', justifyContent: 'center' }}>

        {/* Close Button */}
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 44, right: 20, zIndex: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        >
          <IconSymbol name="xmark" size={16} color="#fff" />
        </Pressable>

        {/* Book Title Label */}
        {book && (
          <View style={{ position: 'absolute', top: 50, left: 20, right: 70, zIndex: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Membaca</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 'bold' }} numberOfLines={1}>{book.title}</Text>
          </View>
        )}

        {/* Book Body */}
        <Animated.View
          style={{
            opacity: loading ? 1 : fadeAnim,
            width: W - 24,
            height: H - 120,
            flexDirection: 'row',
            shadowColor: '#000',
            shadowOffset: { width: 10, height: 14 },
            shadowOpacity: 0.7,
            shadowRadius: 28,
            elevation: 28,
            marginTop: 20,
          }}
        >
          {/* Spine */}
          <View style={{ width: 22, backgroundColor: '#C9A87C', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 6, backgroundColor: 'rgba(0,0,0,0.15)' }} />
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            {book && (
              <Text
                style={{ color: '#7A5230', fontSize: 9, fontWeight: 'bold', transform: [{ rotate: '-90deg' }], width: H - 150, textAlign: 'center' }}
                numberOfLines={1}
              >
                {book.title} · {book.author}
              </Text>
            )}
          </View>

          {/* Page Area */}
          <View style={{ flex: 1, backgroundColor: '#FBF8F3', borderTopRightRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' }}>
            {/* Right edge thickness shadow */}
            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#EAE0D5', zIndex: 10 }} />

            {/* Loading State */}
            {loading && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                <ActivityIndicator size="large" color="#C9A87C" />
                <Text style={{ color: '#8B7355', fontSize: 15, fontWeight: '500' }}>Membuka E-Book...</Text>
              </View>
            )}

            {/* Error State */}
            {!loading && error && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }}>
                <IconSymbol name="doc.fill" size={56} color="#D4B896" />
                <Text style={{ color: '#2D1B00', fontSize: 17, fontWeight: 'bold', textAlign: 'center' }}>E-Book Tidak Tersedia</Text>
                <Text style={{ color: '#8B7355', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>{error}</Text>
                <Pressable
                  style={{ backgroundColor: t.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 }}
                  onPress={() => router.back()}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kembali</Text>
                </Pressable>
              </View>
            )}

            {/* PDF WebView */}
            {!loading && !error && htmlContent && (
              <WebView
                source={{ html: htmlContent, baseUrl: '' }}
                style={{ flex: 1, backgroundColor: '#FBF8F3' }}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                allowFileAccess
                allowUniversalAccessFromFileURLs
                mixedContentMode="always"
                startInLoadingState={false}
                scalesPageToFit={Platform.OS === 'android'}
              />
            )}
          </View>
        </Animated.View>

        {/* Decorative page stack under book */}
        <View style={{ position: 'absolute', bottom: H / 2 - (H - 120) / 2 - 6, width: W - 24, height: 10, backgroundColor: '#D4B896', borderRadius: 2, zIndex: -1, marginLeft: 6 }} />
        <View style={{ position: 'absolute', bottom: H / 2 - (H - 120) / 2 - 10, width: W - 28, height: 8, backgroundColor: '#BFA07A', borderRadius: 2, zIndex: -2, marginLeft: 8 }} />

      </View>
    </>
  );
}
