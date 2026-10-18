import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText, Button, IconButton, IconSymbol } from '@/components/ui';
import { gutter, radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { getBookById, updateBook, type Book } from '@/database/db';
import { clampProgress } from '@/lib/book-utils';

// ─────────────────────────────────────────────────────────────────────────────
// PDF.js HTML — rendered inside a WebView on native. Reports the current page
// back to React Native so reading progress is tracked automatically.
// ─────────────────────────────────────────────────────────────────────────────
function buildPdfHtml(base64: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#F5EFE3; overflow-x:hidden; font-family:-apple-system, system-ui, sans-serif; }
    #toolbar {
      position:fixed; top:0; left:0; right:0; z-index:100;
      background:rgba(251,248,243,0.94); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 14px; border-bottom:1px solid #E6DAC4; gap:8px;
    }
    .btn {
      background:#8B5E3C; color:#fff; border:none; border-radius:10px;
      padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:opacity .15s;
    }
    .btn:disabled { opacity:0.3; cursor:default; }
    #page-info { font-size:13px; color:#5A4A3B; font-weight:700; white-space:nowrap; }
    #bar { height:3px; background:#E6DAC4; position:fixed; top:48px; left:0; right:0; z-index:100; }
    #bar > div { height:100%; width:0%; background:linear-gradient(90deg,#8B5E3C,#C08552); transition:width .25s; }
    #container { padding-top:64px; display:flex; flex-direction:column; align-items:center; gap:18px; padding-bottom:48px; }
    .page-canvas { display:block; box-shadow:0 10px 36px rgba(60,40,20,.22); background:#fff; border-radius:4px; }
    #splash { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:14px; color:#7A6555; font-size:15px; }
    .spinner { width:44px; height:44px; border:4px solid #E6DAC4; border-top-color:#8B5E3C; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div id="toolbar" style="display:none">
    <button class="btn" id="prev" onclick="go(-1)" disabled>‹ Sebelumnya</button>
    <span id="page-info">1 / 1</span>
    <button class="btn" id="next" onclick="go(1)">Berikutnya ›</button>
  </div>
  <div id="bar" style="display:none"><div id="bar-fill"></div></div>
  <div id="splash"><div class="spinner"></div><span>Memuat PDF…</span></div>
  <div id="container" style="display:none"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const raw = atob('${base64}');
    const buf = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);

    let pdf, cur = 1, total = 0;
    const rendered = new Set();
    const container = document.getElementById('container');

    function post(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }

    async function renderPage(n) {
      if (rendered.has(n)) return;
      rendered.add(n);
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const fit = (window.innerWidth - 28) / base.width;
      const vp = page.getViewport({ scale: fit });
      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = vp.width * dpr; canvas.height = vp.height * dpr;
      canvas.style.width = vp.width + 'px'; canvas.style.height = vp.height + 'px';
      canvas.id = 'p' + n;
      const wrap = document.createElement('div');
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
      document.getElementById('bar-fill').style.width = Math.round((cur / total) * 100) + '%';
      post({ type: 'page', cur, total });
    }

    function go(d) {
      cur = Math.min(Math.max(1, cur + d), total);
      const el = document.getElementById('p' + cur);
      if (el) el.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateUI();
      if (cur + 1 <= total) renderPage(cur + 1);
      if (cur - 1 >= 1) renderPage(cur - 1);
    }

    pdfjsLib.getDocument({ data: buf }).promise.then(async (doc) => {
      pdf = doc; total = doc.numPages;
      document.getElementById('splash').style.display = 'none';
      document.getElementById('toolbar').style.display = 'flex';
      document.getElementById('bar').style.display = 'block';
      container.style.display = 'flex';
      await renderPage(1);
      if (total >= 2) renderPage(2);
      updateUI();
    }).catch(() => {
      document.getElementById('splash').innerHTML = '<span style="color:#B91C1C;text-align:center;padding:20px">Gagal memuat PDF.<br/>File mungkin rusak atau tidak didukung.</span>';
      post({ type: 'error' });
    });
  </script>
</body>
</html>`;
}

// Native-only modules are loaded lazily so the web bundle never touches them.
type WebViewComponent = typeof import('react-native-webview').WebView;
type LegacyFileSystem = typeof import('expo-file-system/legacy');
let WebView: WebViewComponent | null = null;
let FileSystem: LegacyFileSystem | null = null;
if (Platform.OS !== 'web') {
  WebView = (require('react-native-webview') as { WebView: WebViewComponent }).WebView; // eslint-disable-line @typescript-eslint/no-require-imports
  FileSystem = require('expo-file-system/legacy') as LegacyFileSystem; // eslint-disable-line @typescript-eslint/no-require-imports
}

const PAPER = { bg: '#FBF8F3', ink: '#2B2118', muted: '#7A6555', spine: '#8B5E3C', desk: '#2A1708' };

function ReaderStatus({ error, onBack }: { error: string | null; onBack: () => void }) {
  if (!error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: PAPER.bg }}>
        <ActivityIndicator size="large" color={PAPER.spine} />
        <AppText variant="body" color={PAPER.muted}>Membuka e-book…</AppText>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space['3xl'], backgroundColor: PAPER.bg }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0E2CF', alignItems: 'center', justifyContent: 'center' }}>
        <IconSymbol name="doc.fill" size={36} color={PAPER.spine} />
      </View>
      <AppText variant="heading" serif weight="semibold" color={PAPER.ink} align="center">PDF tidak tersedia</AppText>
      <AppText variant="body" color={PAPER.muted} align="center">{error}</AppText>
      <Button label="Kembali" icon="arrow.left" variant="secondary" onPress={onBack} />
    </View>
  );
}

export default function PdfReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = Number(id);
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();

  const [book, setBook] = useState<Book | null>(null);
  const [source, setSource] = useState<string | null>(null); // html (native) | uri (web)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ cur: number; total: number } | null>(null);
  const latestProgress = useRef<number | null>(null);
  const bookRef = useRef<Book | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const b = await getBookById(bookId);
        if (!active) return;
        setBook(b);
        bookRef.current = b;

        if (!b?.pdf_uri) {
          setError('Buku ini belum memiliki file PDF. Lampirkan lewat menu Edit Buku.');
          setLoading(false);
          return;
        }

        if (Platform.OS === 'web') {
          setSource(b.pdf_uri);
        } else {
          let base64 = '';
          if (b.pdf_uri.startsWith('data:')) {
            base64 = b.pdf_uri.split(',')[1] ?? '';
          } else if (FileSystem) {
            base64 = await FileSystem.readAsStringAsync(b.pdf_uri, { encoding: FileSystem.EncodingType.Base64 });
          }
          if (!active) return;
          setSource(buildPdfHtml(base64));
        }
        setLoading(false);

        if (b.status === 'Ingin Baca') {
          const started = { ...b, status: 'Sedang Dibaca' };
          bookRef.current = started;
          await updateBook(bookId, started);
        }
      } catch (e) {
        console.error(e);
        if (!active) return;
        setError('Gagal memuat PDF. Pastikan file masih tersedia di perangkat.');
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      // Persist the furthest page reached when leaving the reader.
      const b = bookRef.current;
      const p = latestProgress.current;
      if (b && p !== null && p > (b.progress ?? 0)) {
        updateBook(bookId, { ...b, progress: p, status: p >= 100 ? 'Selesai' : 'Sedang Dibaca' }).catch(() => {});
      }
    };
  }, [bookId]);

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; cur?: number; total?: number };
      if (msg.type === 'page' && msg.cur && msg.total) {
        setPage({ cur: msg.cur, total: msg.total });
        latestProgress.current = clampProgress((msg.cur / msg.total) * 100);
      }
    } catch { /* ignore malformed messages */ }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/'));

  // ── WEB: toolbar + iframe ───────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: PAPER.desk }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: gutter - 4, paddingVertical: space.md, backgroundColor: '#3A2210' }}>
          <IconButton icon="chevron.left" color="#F5E6D3" background="rgba(255,255,255,0.1)" style={{ borderColor: 'rgba(255,255,255,0.15)' }} onPress={goBack} accessibilityLabel="Kembali" />
          <View style={{ flex: 1 }}>
            <AppText variant="overline" color="rgba(245,230,211,0.6)">Membaca</AppText>
            <AppText variant="subheading" serif weight="semibold" color="#F5E6D3" numberOfLines={1}>{book?.title ?? ''}</AppText>
          </View>
          <Button label="Update progres" variant="soft" size="sm" icon="pencil" onPress={() => router.replace({ pathname: '/book/[id]', params: { id: String(bookId) } })} />
        </View>
        <View style={{ flex: 1, margin: space.md, borderRadius: radius.md, overflow: 'hidden', backgroundColor: PAPER.bg }}>
          {loading || error ? (
            <ReaderStatus error={error} onBack={goBack} />
          ) : source ? (
            <iframe src={source} title={book?.title ?? 'PDF'} style={{ width: '100%', height: '100%', border: 'none', background: PAPER.bg }} />
          ) : null}
        </View>
      </View>
    );
  }

  // ── NATIVE: book-shaped shell ───────────────────────────────────────────
  const shellTop = insets.top + 56;
  const shellHeight = H - shellTop - Math.max(insets.bottom, 16) - 24;
  const shellWidth = W - 20;

  return (
    <View style={{ flex: 1, backgroundColor: PAPER.desk }}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={{ position: 'absolute', top: insets.top + space.sm, left: gutter - 8, right: gutter - 8, flexDirection: 'row', alignItems: 'center', gap: space.md, zIndex: 30 }}>
        <IconButton icon="xmark" color="#fff" background="rgba(255,255,255,0.12)" style={{ borderColor: 'rgba(255,255,255,0.15)' }} onPress={goBack} accessibilityLabel="Tutup" />
        <View style={{ flex: 1 }}>
          <AppText variant="overline" color="rgba(255,255,255,0.55)">Membaca</AppText>
          <AppText variant="body" weight="bold" color="rgba(255,255,255,0.92)" numberOfLines={1}>{book?.title ?? ''}</AppText>
        </View>
        {page ? (
          <View style={{ paddingHorizontal: space.md, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="caption" weight="bold" color="#fff">{page.cur} / {page.total} · {clampProgress((page.cur / page.total) * 100)}%</AppText>
          </View>
        ) : null}
      </View>

      {/* Page stack decoration */}
      <View style={{ position: 'absolute', top: shellTop + 10, left: 18, width: shellWidth - 6, height: shellHeight, borderRadius: 10, backgroundColor: '#C4A882' }} />
      <View style={{ position: 'absolute', top: shellTop + 5, left: 14, width: shellWidth - 2, height: shellHeight, borderRadius: 10, backgroundColor: '#E0CFAE' }} />

      {/* Book shell */}
      <Animated.View entering={FadeIn.duration(350)} style={{ position: 'absolute', top: shellTop, left: 10, width: shellWidth, height: shellHeight, flexDirection: 'row', borderRadius: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 10, height: 16 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 24 }}>
        {/* Spine */}
        <View style={{ width: 22, backgroundColor: PAPER.spine, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 6, backgroundColor: 'rgba(0,0,0,0.22)' }} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          {book ? (
            <AppText variant="caption" serif weight="bold" color="#3B2410" numberOfLines={1} style={{ width: shellHeight - 40, textAlign: 'center', transform: [{ rotate: '-90deg' }], fontSize: 10 }}>
              {book.title}  ·  {book.author}
            </AppText>
          ) : null}
        </View>

        {/* Pages */}
        <View style={{ flex: 1, backgroundColor: PAPER.bg }}>
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#E0D5C5', zIndex: 10 }} />
          {loading || error ? (
            <ReaderStatus error={error} onBack={goBack} />
          ) : source && WebView ? (
            <WebView
              source={{ html: source, baseUrl: '' }}
              style={{ flex: 1, backgroundColor: '#F5EFE3' }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              allowFileAccess
              allowUniversalAccessFromFileURLs
              mixedContentMode="always"
              startInLoadingState={false}
              scalesPageToFit={Platform.OS === 'android'}
              onMessage={onMessage}
            />
          ) : null}
        </View>
      </Animated.View>

      {/* Hint */}
      <View pointerEvents="none" style={{ position: 'absolute', bottom: Math.max(insets.bottom, 12), left: 0, right: 0, alignItems: 'center' }}>
        <AppText variant="caption" color="rgba(255,255,255,0.45)">Progres membaca tersimpan otomatis · tema {t.name}</AppText>
      </View>
    </View>
  );
}
