import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { addBook, addBookToCollection, addCollection, getAllBooks, getBooksByCollection, getCollections, type Book, type Collection } from '@/database/db';

export interface BackupFile {
  app: 'kita.id';
  version: 1;
  exportedAt: string;
  books: Book[];
  collections: (Collection & { bookTitles: string[] })[];
}

/** Build a self-contained JSON backup of the whole library. */
export async function buildBackup(): Promise<BackupFile> {
  const books = await getAllBooks();
  const collections = await getCollections();
  const withMembers = await Promise.all(
    collections.map(async (c) => ({
      ...c,
      bookTitles: (await getBooksByCollection(c.id!)).map((b) => b.title),
    }))
  );
  return { app: 'kita.id', version: 1, exportedAt: new Date().toISOString(), books, collections: withMembers };
}

/**
 * Export the library as JSON. On native the file is written to the document
 * directory and handed to the share sheet; on web it is downloaded directly.
 * Returns a short description of where the file went.
 */
export async function exportBackup(): Promise<string> {
  const data = await buildBackup();
  const json = JSON.stringify(data, null, 2);
  const fileName = `kita-id-backup-${data.exportedAt.slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'File backup diunduh.';
  }

  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!dir) throw new Error('Direktori penyimpanan tidak tersedia.');
  const uri = dir + fileName;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Bagikan backup perpustakaan', UTI: 'public.json' });
    return 'Backup siap dibagikan.';
  }
  return `Backup tersimpan di ${uri}`;
}

async function readPickedFile(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.text();
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<BackupFile>;
  return Array.isArray(v.books) && Array.isArray(v.collections);
}

/**
 * Let the user pick a backup file and merge it into the library.
 * Books already present (same title + author) are skipped. Returns counts.
 * Resolves to `null` when the picker is cancelled.
 */
export async function importBackup(): Promise<{ books: number; collections: number } | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets?.[0]) return null;

  const raw = await readPickedFile(picked.assets[0].uri);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('File bukan JSON yang valid.'); }
  if (!isBackupFile(parsed)) throw new Error('Format file backup tidak dikenali.');

  const existing = await getAllBooks();
  const key = (b: Pick<Book, 'title' | 'author'>) => `${b.title}`.trim().toLowerCase() + '|' + `${b.author}`.trim().toLowerCase();
  const known = new Map(existing.map((b) => [key(b), b.id!]));

  let addedBooks = 0;
  for (const b of parsed.books) {
    if (!b || typeof b.title !== 'string' || typeof b.author !== 'string') continue;
    const k = key(b);
    if (known.has(k)) continue;
    const id = await addBook({
      title: b.title,
      author: b.author,
      genre: b.genre ?? '',
      cover: typeof b.cover === 'string' && !b.cover.startsWith('file:') ? b.cover : '',
      synopsis: b.synopsis ?? '',
      status: b.status ?? 'Ingin Baca',
      progress: Number(b.progress ?? 0),
      rating: Number(b.rating ?? 0),
      is_favorite: Number(b.is_favorite ?? 0),
      pdf_uri: '',
    });
    known.set(k, id);
    addedBooks += 1;
  }

  const existingCols = await getCollections();
  const colByName = new Map(existingCols.map((c) => [c.name.trim().toLowerCase(), c.id!]));
  const titleToId = new Map<string, number>();
  for (const [k, id] of known) titleToId.set(k.split('|')[0], id);

  let addedCollections = 0;
  for (const c of parsed.collections) {
    if (!c || typeof c.name !== 'string') continue;
    let colId = colByName.get(c.name.trim().toLowerCase());
    if (colId === undefined) {
      colId = await addCollection(c.name, c.description ?? '');
      colByName.set(c.name.trim().toLowerCase(), colId);
      addedCollections += 1;
    }
    for (const title of c.bookTitles ?? []) {
      const bookId = titleToId.get(String(title).trim().toLowerCase());
      if (bookId !== undefined) await addBookToCollection(colId, bookId);
    }
  }

  return { books: addedBooks, collections: addedCollections };
}
