import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Pressable, ActivityIndicator,
  Platform, StatusBar, Dimensions, Animated,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { getBookById, Book, updateBook } from '@/database/db';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: W, height: H } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// PDF.js HTML — used inside WebView on native
// ─────────────────────────────────────────────────────────────────────────────
function buildPdfHtml(base64: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#f5f0e8; overflow-x:hidden; font-family:sans-serif; }
    #toolbar {
      position:fixed; top:0; left:0; right:0; z-index:100;
      background:rgba(245,240,232,0.96); backdrop-filter:blur(10px);
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 16px; border-bottom:1px solid #d5c9b5; gap:8px;
    }
    .btn {
      background:#8B5E3C; color:#fff; border:none; border-radius:8px;
      padding:7px 16px; font-size:13px; font-weight:700; cursor:pointer;
      transition: opacity .15s;
    }
    .btn:disabled { opacity:0.35; cursor:default; }
    .btn:hover:not(:disabled) { opacity:.85; }
    #page-info { font-size:13px; color:#5a4535; font-weight:600; white-space:nowrap; }
    #zoom-info { font-size:12px; color:#7a6555; }
    #container { padding-top:56px; display:flex; flex-direction:column; align-items:center; gap:20px; padding-bottom:40px; }
    .page-wrap { position:relative; }
    .page-canvas { display:block; box-shadow:0 6px 32px rgba(0,0,0,.22); background:#fff; }
    #splash {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      height:100vh; gap:14px; color:#7a6555; font-size:15px;
    }
    .spinner {
      width:44px; height:44px; border:4px solid #e0d5c5;
      border-top-color:#8B5E3C; border-radius:50%;
      animation:spin .75s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div id="toolbar" style="display:none">
    <button class="btn" id="prev" onclick="go(-1)" disabled>◀ Prev</button>
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <span id="page-info">1 / 1</span>
      <span id="zoom-info">100%</span>
    </div>
    <button class="btn" id="next" onclick="go(1)">Next ▶</button>
  </div>
  <div id="splash"><div class="spinner"></div><span>Memuat PDF…</span></div>
  <div id="container" style="display:none"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const b64 = '${base64}';
    const raw = atob(b64);
    const buf = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);

    let pdf, cur = 1, total = 0;
    const rendered = new Set();
    const container = document.getElementById('container');
    let scale = Math.min(window.devicePixelRatio || 1, 2);

    async function renderPage(n) {
      if (rendered.has(n)) return;
      rendered.add(n);
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const fit = (window.innerWidth - 32) / base.width;
      const vp = page.getViewport({ scale: fit });
      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      const dpr = window.devicePixelRatio || 1;
      canvas.width = vp.width * dpr;
      canvas.height = vp.height * dpr;
      canvas.style.width = vp.width + 'px';
      canvas.style.height = vp.height + 'px';
      canvas.id = 'p' + n;
      const wrap = document.createElement('div');
      wrap.className = 'page-wrap';
      wrap.appendChild(canvas);
      container.appendChild(wrap);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    }

    function updateUI() {
      document.getElementById('page-info').textContent = cur + ' / ' + total;
      document.getElementById('prev').disabled = cur <= 1;
      document.getElementById('next').disabled = cur >= total;
    }

    function go(d) {
      cur = Math.min(Math.max(1, cur + d), total);
      const el = document.getElementById('p' + cur);
      if (el) el.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateUI();
      if (cur + 1 <= total) renderPage(cur + 1);
      if (cur - 1 >= 1)   renderPage(cur - 1);
    }

    pdfjsLib.getDocument({ data: buf }).promise.then(async (doc) => {
      pdf = doc; total = doc.numPages;
      document.getElementById('splash').style.display = 'none';
      document.getElementById('toolbar').style.display = 'flex';
      document.getElementById('container').style.display = 'flex';
      updateUI();
      await renderPage(1);
      if (total >= 2) renderPage(2);
    }).catch(() => {
      document.getElementById('splash').innerHTML =
        '<span style="color:#dc2626;text-align:center;padding:20px">Gagal memuat PDF.<br/>File mungkin rusak atau tidak didukung.</span>';
    });
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-load native-only modules (crashes on web if imported at module level)
// ─────────────────────────────────────────────────────────────────────────────
let WebView: any = null;
let FileSystem: any = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').WebView; } catch (_) {}
  try { FileSystem = require('expo-file-system/legacy'); } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function PdfReaderScreen() {
  const { id } = useLocalSearchParams();
  const { theme: t } = useTheme();

  const [book, setBook]         = useState<Book | null>(null);
  const [source, setSource]     = useState<string | null>(null); // html (native) | uri (web)
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const b = await getBookById(Number(id));
        setBook(b);

        if (!b?.pdf_uri) {
          setError('Buku ini belum memiliki file PDF.\nUpload PDF melalui menu Edit Buku.');
          setLoading(false);
          return;
        }

        if (Platform.OS === 'web') {
          // Web: pass URI directly to <iframe>
          setSource(b.pdf_uri);
        } else {
          // Native: convert to base64 → inject into PDF.js HTML
          let base64 = '';
          if (b.pdf_uri.startsWith('data:')) {
            base64 = b.pdf_uri.split(',')[1];
          } else if (FileSystem) {
            base64 = await FileSystem.readAsStringAsync(b.pdf_uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          setSource(buildPdfHtml(base64));
        }

        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();

        // Auto-update status ke "Sedang Dibaca"
        if (b.status === 'Ingin Baca') {
          await updateBook(Number(id), { ...b, status: 'Sedang Dibaca' });
        }
      } catch (e: any) {
        console.error(e);
        setError('Gagal memuat PDF.\nPastikan file masih tersedia.');
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Shared error / loading content ───────────────────────────────────────
  const LoadingView = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, backgroundColor: '#FBF8F3' }}>
      <ActivityIndicator size="large" color="#8B5E3C" />
      <Text style={{ color: '#7a6555', fontSize: 15 }}>Membuka E-Book…</Text>
    </View>
  );

  const ErrorView = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16, backgroundColor: '#FBF8F3' }}>
      <Text style={{ fontSize: 48 }}>📄</Text>
      <Text style={{ color: '#1a1a1a', fontSize: 17, fontWeight: 'bold', textAlign: 'center' }}>PDF Tidak Tersedia</Text>
      <Text style={{ color: '#7a6555', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>{error}</Text>
      <Pressable
        style={{ backgroundColor: t.accent, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 8 }}
        onPress={() => router.back()}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>← Kembali</Text>
      </Pressable>
    </View>
  );

  // ── WEB layout ────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={{ flex: 1, backgroundColor: '#1a0f07' }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: '#2d1a0e', gap: 12,
          }}>
            <Pressable
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
            >
              <IconSymbol name="chevron.left" size={16} color="#f5e6d3" />
              <Text style={{ color: '#f5e6d3', fontWeight: '600', fontSize: 14 }}>Kembali</Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              {book && (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Membaca</Text>
                  <Text style={{ color: '#f5e6d3', fontSize: 15, fontWeight: 'bold' }} numberOfLines={1}>{book.title}</Text>
                </>
              )}
            </View>
          </View>

          {/* PDF Area */}
          <View style={{ flex: 1, margin: 12, borderRadius: 8, overflow: 'hidden' }}>
            {loading && <LoadingView />}
            {!loading && error && <ErrorView />}
            {!loading && !error && source && (
              // @ts-ignore — iframe is valid HTML element on web
              <iframe
                src={source}
                style={{ width: '100%', height: '100%', border: 'none', background: '#f5f0e8' } as any}
                title={book?.title ?? 'PDF Reader'}
              />
            )}
          </View>
        </View>
      </>
    );
  }

  // ── NATIVE layout (book-shaped shell) ─────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      <View style={{ flex: 1, backgroundColor: '#3d1f07', alignItems: 'center', justifyContent: 'center' }}>

        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 48, right: 20, zIndex: 30, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        >
          <IconSymbol name="xmark" size={18} color="#fff" />
        </Pressable>

        {/* Book title */}
        {book && (
          <View style={{ position: 'absolute', top: 54, left: 20, right: 72, zIndex: 30 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Membaca</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 'bold' }} numberOfLines={1}>{book.title}</Text>
          </View>
        )}

        {/* Book shell */}
        <Animated.View style={{
          opacity: loading ? 1 : fadeAnim,
          width: W - 20, height: H - 120,
          flexDirection: 'row',
          shadowColor: '#000', shadowOffset: { width: 12, height: 16 },
          shadowOpacity: 0.75, shadowRadius: 30, elevation: 30,
          marginTop: 16,
        }}>
          {/* Spine */}
          <View style={{ width: 24, backgroundColor: '#8B5E3C', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 7, backgroundColor: 'rgba(0,0,0,0.2)' }} />
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            {book && (
              <Text style={{ color: '#5C3010', fontSize: 9, fontWeight: 'bold', transform: [{ rotate: '-90deg' }], width: H - 160, textAlign: 'center' }} numberOfLines={1}>
                {book.title}  ·  {book.author}
              </Text>
            )}
          </View>

          {/* Pages */}
          <View style={{ flex: 1, backgroundColor: '#FBF8F3', borderTopRightRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' }}>
            {/* Right edge shadow */}
            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#E0D5C5', zIndex: 10 }} />

            {loading && <LoadingView />}
            {!loading && error && <ErrorView />}
            {!loading && !error && source && WebView && (
              <WebView
                source={{ html: source, baseUrl: '' }}
                style={{ flex: 1, backgroundColor: '#f5f0e8' }}
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

        {/* Page stack decoration */}
        <View style={{ position: 'absolute', bottom: H / 2 - (H - 120) / 2 - 7, width: W - 20, height: 10, backgroundColor: '#C4A882', borderRadius: 2, zIndex: -1, marginLeft: 8 }} />
        <View style={{ position: 'absolute', bottom: H / 2 - (H - 120) / 2 - 12, width: W - 26, height: 8, backgroundColor: '#B09060', borderRadius: 2, zIndex: -2, marginLeft: 12 }} />
      </View>
    </>
  );
}
