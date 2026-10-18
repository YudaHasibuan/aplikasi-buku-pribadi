import { useState } from 'react';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AppText, BookCover, Button, Card, Chip, IconSymbol, Input, PressableScale } from '@/components/ui';
import { radius, space, READING_STATUSES } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import type { Book } from '@/database/db';
import { statusColors, statusIcon } from '@/lib/book-utils';
import { notify } from '@/lib/dialogs';

export interface BookFormValues {
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  status: string;
  cover: string;
  pdf_uri: string;
}

interface BookFormProps {
  initial?: Partial<Book> | null;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: BookFormValues) => void | Promise<void>;
}

const GENRE_SUGGESTIONS = ['Fiksi', 'Non-Fiksi', 'Sains', 'Sejarah', 'Biografi', 'Pengembangan Diri', 'Bisnis', 'Teknologi', 'Religi', 'Komik', 'Puisi', 'Fantasi'];

/** Shared add/edit form so both screens stay identical in behaviour and look. */
export function BookForm({ initial, submitLabel, submitting = false, onSubmit }: BookFormProps) {
  const { theme: t } = useTheme();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [genre, setGenre] = useState(initial?.genre ?? '');
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'Ingin Baca');
  const [cover, setCover] = useState(initial?.cover ?? '');
  const [pdfUri, setPdfUri] = useState(initial?.pdf_uri ?? '');
  const [pdfName, setPdfName] = useState(initial?.pdf_uri ? 'File PDF terlampir' : '');
  const [errors, setErrors] = useState<{ title?: string; author?: string }>({});

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.75 });
      if (!result.canceled && result.assets[0]) setCover(result.assets[0].uri);
    } catch {
      notify('Gagal', 'Tidak dapat membuka galeri.');
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setPdfUri(result.assets[0].uri);
        setPdfName(result.assets[0].name ?? 'File PDF terlampir');
      }
    } catch {
      notify('Gagal', 'Tidak dapat memilih file PDF.');
    }
  };

  const submit = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Judul wajib diisi';
    if (!author.trim()) next.author = 'Penulis wajib diisi';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ title: title.trim(), author: author.trim(), genre: genre.trim(), synopsis: synopsis.trim(), status, cover, pdf_uri: pdfUri });
  };

  return (
    <View style={{ gap: space['2xl'] }}>
      {/* Cover */}
      <View style={{ alignItems: 'center' }}>
        <PressableScale onPress={pickImage} accessibilityLabel="Pilih sampul buku">
          {cover ? (
            <BookCover uri={cover} title={title || 'Buku'} width={150} radius={radius.lg}>
              <View style={{ position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.75)', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="pencil" size={16} color="#fff" />
              </View>
            </BookCover>
          ) : (
            <View style={{ width: 150, height: 225, borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: t.borderStrong, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.lg }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="photo.badge.plus" size={26} color={t.accent} />
              </View>
              <AppText variant="label" weight="bold" align="center">Tambah Sampul</AppText>
              <AppText variant="caption" color={t.textMuted} align="center">Rasio 2:3 · dari galeri</AppText>
            </View>
          )}
        </PressableScale>
        {cover ? (
          <PressableScale onPress={() => setCover('')} feedback="selection" style={{ marginTop: space.md }}>
            <AppText variant="label" color={t.danger}>Hapus sampul</AppText>
          </PressableScale>
        ) : null}
      </View>

      {/* Details */}
      <Card variant="outline" style={{ gap: space.xl }}>
        <AppText variant="overline" color={t.textMuted}>Informasi buku</AppText>
        <Input label="Judul" required icon="book.fill" placeholder="Masukkan judul buku" value={title} onChangeText={(v) => { setTitle(v); if (errors.title) setErrors((e) => ({ ...e, title: undefined })); }} hint={errors.title} />
        <Input label="Penulis" required icon="person.fill" placeholder="Nama penulis" value={author} onChangeText={(v) => { setAuthor(v); if (errors.author) setErrors((e) => ({ ...e, author: undefined })); }} hint={errors.author} />
        <View>
          <Input label="Genre" icon="tag.fill" placeholder="Fiksi, Sains, Sejarah…" value={genre} onChangeText={setGenre} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
            {GENRE_SUGGESTIONS.map((g) => (
              <Chip key={g} label={g} selected={genre.trim().toLowerCase() === g.toLowerCase()} onPress={() => setGenre(g)} />
            ))}
          </View>
        </View>
      </Card>

      {/* Status */}
      <Card variant="outline" style={{ gap: space.lg }}>
        <AppText variant="overline" color={t.textMuted}>Status membaca</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {READING_STATUSES.map((s) => (
            <Chip key={s} label={s} icon={statusIcon(s)} selected={status === s} tint={statusColors(s, t).fg} onPress={() => setStatus(s)} />
          ))}
        </View>
      </Card>

      {/* Synopsis */}
      <Card variant="outline" style={{ gap: space.lg }}>
        <AppText variant="overline" color={t.textMuted}>Sinopsis</AppText>
        <Input multiline placeholder="Tuliskan ringkasan singkat atau catatan pribadi…" value={synopsis} onChangeText={setSynopsis} />
      </Card>

      {/* PDF */}
      <Card variant="outline" style={{ gap: space.lg }}>
        <AppText variant="overline" color={t.textMuted}>E-Book (PDF) · opsional</AppText>
        <PressableScale onPress={pickPdf} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: pdfUri ? t.successSoft : t.surfaceAlt, borderWidth: 1, borderColor: pdfUri ? t.success : 'transparent' }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: pdfUri ? t.success : t.surface, alignItems: 'center', justifyContent: 'center' }}>
            <IconSymbol name="doc.fill" size={22} color={pdfUri ? '#fff' : t.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" weight="bold" color={pdfUri ? t.success : t.text} numberOfLines={1}>{pdfUri ? pdfName : 'Lampirkan file PDF'}</AppText>
            <AppText variant="caption" color={t.textMuted}>{pdfUri ? 'Ketuk untuk mengganti file' : 'Baca langsung di dalam aplikasi'}</AppText>
          </View>
          {pdfUri ? (
            <PressableScale onPress={() => { setPdfUri(''); setPdfName(''); }} hitSlop={8} accessibilityLabel="Hapus PDF">
              <IconSymbol name="xmark" size={18} color={t.textMuted} />
            </PressableScale>
          ) : (
            <IconSymbol name="chevron.right" size={18} color={t.textMuted} />
          )}
        </PressableScale>
      </Card>

      <Button label={submitLabel} icon="checkmark" size="lg" fullWidth loading={submitting} onPress={submit} />
    </View>
  );
}
