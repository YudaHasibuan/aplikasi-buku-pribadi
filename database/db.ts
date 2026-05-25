/**
 * db.ts — Universal Database Layer
 *
 * Platform strategy:
 *   - NATIVE (iOS/Android): expo-sqlite (SQLite via native modules)
 *   - WEB (browser):        localStorage JSON store
 *     expo-sqlite on web uses wa-sqlite which requires OPFS + cross-origin
 *     isolation headers that are unavailable in the Expo dev server.
 *     localStorage is simpler, zero-config, and works everywhere.
 */

import { Platform } from 'react-native';
import { storeAsset, resolveAsset, deleteAsset } from './assetStore';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Book {
  id?: number;
  title: string;
  author: string;
  genre?: string;
  cover?: string;
  progress?: number;
  status?: string;   // 'Ingin Baca' | 'Sedang Dibaca' | 'Selesai' | 'Ditunda'
  rating?: number;
  synopsis?: string;
  is_favorite?: number; // 0 | 1
  pdf_uri?: string;
}

export interface Collection {
  id?: number;
  name: string;
  description?: string;
  bookCount?: number;
}

interface CollectionBook {
  collection_id: number;
  book_id: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB: localStorage JSON store
// ─────────────────────────────────────────────────────────────────────────────

const LS = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

const WEB_BOOKS        = 'db_books';
const WEB_COLLECTIONS  = 'db_collections';
const WEB_COL_BOOKS    = 'db_collection_books';
const WEB_SETTINGS     = 'db_settings';
const WEB_IDS          = 'db_ids';

function nextId(entity: string): number {
  const ids = LS.get<Record<string, number>>(WEB_IDS, {});
  const next = (ids[entity] ?? 0) + 1;
  ids[entity] = next;
  LS.set(WEB_IDS, ids);
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
// NATIVE: expo-sqlite
// ─────────────────────────────────────────────────────────────────────────────

let _db: import('expo-sqlite').SQLiteDatabase | null = null;
let _initPromise: Promise<void> | null = null;

async function getNativeDb(): Promise<import('expo-sqlite').SQLiteDatabase> {
  if (_db) return _db;
  if (_initPromise) { await _initPromise; return _db!; }

  _initPromise = (async () => {
    const SQLite = await import('expo-sqlite');
    _db = await SQLite.openDatabaseAsync('books.db');

    await _db.execAsync('PRAGMA journal_mode = WAL;');

    await _db.execAsync(
      'CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL, genre TEXT DEFAULT \'\', cover TEXT DEFAULT \'\', progress INTEGER DEFAULT 0, status TEXT DEFAULT \'Ingin Baca\', rating INTEGER DEFAULT 0, synopsis TEXT DEFAULT \'\', is_favorite INTEGER DEFAULT 0, pdf_uri TEXT DEFAULT \'\');'
    );
    await _db.execAsync(
      'CREATE TABLE IF NOT EXISTS collections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT \'\');'
    );
    await _db.execAsync(
      'CREATE TABLE IF NOT EXISTS collection_books (collection_id INTEGER NOT NULL, book_id INTEGER NOT NULL, PRIMARY KEY (collection_id, book_id));'
    );
    await _db.execAsync(
      'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT DEFAULT \'\');'
    );

    try { await _db.execAsync('ALTER TABLE books ADD COLUMN is_favorite INTEGER DEFAULT 0;'); } catch (_) {}
    try { await _db.execAsync('ALTER TABLE books ADD COLUMN pdf_uri TEXT DEFAULT \'\';'); } catch (_) {}
  })();

  await _initPromise;
  return _db!;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — initDb (no-op, kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export const initDb = async (): Promise<void> => {
  if (Platform.OS !== 'web') await getNativeDb();
};

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export const getSetting = async (key: string, defaultValue = ''): Promise<string> => {
  if (Platform.OS === 'web') {
    const store = LS.get<Record<string, string>>(WEB_SETTINGS, {});
    return store[key] ?? defaultValue;
  }
  const db = await getNativeDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : defaultValue;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const store = LS.get<Record<string, string>>(WEB_SETTINGS, {});
    store[key] = value;
    LS.set(WEB_SETTINGS, store);
    return;
  }
  const db = await getNativeDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKS — WEB helpers
// ─────────────────────────────────────────────────────────────────────────────

function webGetBooks(): Book[] {
  return LS.get<Book[]>(WEB_BOOKS, []);
}

function webSaveBooks(books: Book[]) {
  LS.set(WEB_BOOKS, books);
}

function resolveBook(b: Book): Book {
  return { ...b, cover: resolveAsset(b.cover), pdf_uri: resolveAsset(b.pdf_uri) };
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKS — Public API
// ─────────────────────────────────────────────────────────────────────────────

export const addBook = async (book: Book): Promise<number> => {
  if (Platform.OS === 'web') {
    const books = webGetBooks();
    const id = nextId('book');
    const newBook: Book = {
      id,
      title:       String(book.title),
      author:      String(book.author),
      genre:       String(book.genre ?? ''),
      cover:       storeAsset(book.cover),
      synopsis:    String(book.synopsis ?? ''),
      status:      String(book.status ?? 'Ingin Baca'),
      progress:    Number(book.progress ?? 0),
      rating:      Number(book.rating ?? 0),
      is_favorite: Number(book.is_favorite ?? 0),
      pdf_uri:     storeAsset(book.pdf_uri),
    };
    books.unshift(newBook);
    webSaveBooks(books);
    return id;
  }

  const db = await getNativeDb();
  const sql = 'INSERT INTO books (title, author, genre, cover, synopsis, status, progress, rating, is_favorite, pdf_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const result = await db.runAsync(sql, [
    String(book.title), String(book.author), String(book.genre ?? ''),
    storeAsset(book.cover), String(book.synopsis ?? ''),
    String(book.status ?? 'Ingin Baca'), Number(book.progress ?? 0),
    Number(book.rating ?? 0), Number(book.is_favorite ?? 0), storeAsset(book.pdf_uri),
  ]);
  return result.lastInsertRowId;
};

export const getAllBooks = async (): Promise<Book[]> => {
  if (Platform.OS === 'web') {
    return webGetBooks().map(resolveBook);
  }
  const db = await getNativeDb();
  const rows = await db.getAllAsync<Book>('SELECT * FROM books ORDER BY id DESC');
  return rows.map(resolveBook);
};

export const getBookById = async (id: number): Promise<Book | null> => {
  if (Platform.OS === 'web') {
    const book = webGetBooks().find(b => b.id === id) ?? null;
    return book ? resolveBook(book) : null;
  }
  const db = await getNativeDb();
  const row = await db.getFirstAsync<Book>('SELECT * FROM books WHERE id = ?', [id]);
  return row ? resolveBook(row) : null;
};

export const updateBook = async (id: number, book: Book): Promise<void> => {
  if (Platform.OS === 'web') {
    const books = webGetBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx !== -1) {
      books[idx] = {
        ...books[idx],
        title:       String(book.title),
        author:      String(book.author),
        genre:       String(book.genre ?? ''),
        cover:       storeAsset(book.cover),
        synopsis:    String(book.synopsis ?? ''),
        status:      String(book.status ?? 'Ingin Baca'),
        progress:    Number(book.progress ?? 0),
        rating:      Number(book.rating ?? 0),
        is_favorite: Number(book.is_favorite ?? 0),
        pdf_uri:     storeAsset(book.pdf_uri),
      };
      webSaveBooks(books);
    }
    return;
  }
  const db = await getNativeDb();
  const sql = 'UPDATE books SET title=?, author=?, genre=?, cover=?, synopsis=?, status=?, progress=?, rating=?, is_favorite=?, pdf_uri=? WHERE id=?';
  await db.runAsync(sql, [
    String(book.title), String(book.author), String(book.genre ?? ''),
    storeAsset(book.cover), String(book.synopsis ?? ''),
    String(book.status ?? 'Ingin Baca'), Number(book.progress ?? 0),
    Number(book.rating ?? 0), Number(book.is_favorite ?? 0),
    storeAsset(book.pdf_uri), Number(id),
  ]);
};

export const deleteBook = async (id: number): Promise<void> => {
  if (Platform.OS === 'web') {
    const books = webGetBooks();
    const book = books.find(b => b.id === id);
    if (book) { deleteAsset(book.cover); deleteAsset(book.pdf_uri); }
    webSaveBooks(books.filter(b => b.id !== id));
    const cbStore = LS.get<CollectionBook[]>(WEB_COL_BOOKS, []);
    LS.set(WEB_COL_BOOKS, cbStore.filter(cb => cb.book_id !== id));
    return;
  }
  const db = await getNativeDb();
  const existing = await db.getFirstAsync<Book>('SELECT cover, pdf_uri FROM books WHERE id = ?', [id]);
  if (existing) { deleteAsset(existing.cover); deleteAsset(existing.pdf_uri); }
  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM collection_books WHERE book_id = ?', [id]);
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const addCollection = async (name: string, description = ''): Promise<number> => {
  if (Platform.OS === 'web') {
    const cols = LS.get<Collection[]>(WEB_COLLECTIONS, []);
    const id = nextId('collection');
    cols.unshift({ id, name, description });
    LS.set(WEB_COLLECTIONS, cols);
    return id;
  }
  const db = await getNativeDb();
  const result = await db.runAsync('INSERT INTO collections (name, description) VALUES (?, ?)', [name, description]);
  return result.lastInsertRowId;
};

export const getCollections = async (): Promise<Collection[]> => {
  if (Platform.OS === 'web') {
    const cols = LS.get<Collection[]>(WEB_COLLECTIONS, []);
    const cbStore = LS.get<CollectionBook[]>(WEB_COL_BOOKS, []);
    return cols.map(c => ({
      ...c,
      bookCount: cbStore.filter(cb => cb.collection_id === c.id).length,
    }));
  }
  const db = await getNativeDb();
  return db.getAllAsync<Collection>(
    'SELECT c.id, c.name, c.description, COUNT(cb.book_id) as bookCount FROM collections c LEFT JOIN collection_books cb ON c.id = cb.collection_id GROUP BY c.id ORDER BY c.id DESC'
  );
};

export const deleteCollection = async (id: number): Promise<void> => {
  if (Platform.OS === 'web') {
    const cols = LS.get<Collection[]>(WEB_COLLECTIONS, []);
    LS.set(WEB_COLLECTIONS, cols.filter(c => c.id !== id));
    const cbStore = LS.get<CollectionBook[]>(WEB_COL_BOOKS, []);
    LS.set(WEB_COL_BOOKS, cbStore.filter(cb => cb.collection_id !== id));
    return;
  }
  const db = await getNativeDb();
  await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM collection_books WHERE collection_id = ?', [id]);
};

export const addBookToCollection = async (collectionId: number, bookId: number): Promise<void> => {
  if (Platform.OS === 'web') {
    const cbStore = LS.get<CollectionBook[]>(WEB_COL_BOOKS, []);
    const exists = cbStore.some(cb => cb.collection_id === collectionId && cb.book_id === bookId);
    if (!exists) { cbStore.push({ collection_id: collectionId, book_id: bookId }); LS.set(WEB_COL_BOOKS, cbStore); }
    return;
  }
  const db = await getNativeDb();
  try { await db.runAsync('INSERT OR IGNORE INTO collection_books (collection_id, book_id) VALUES (?, ?)', [collectionId, bookId]); } catch (_) {}
};

export const removeBookFromCollection = async (collectionId: number, bookId: number): Promise<void> => {
  if (Platform.OS === 'web') {
    const cbStore = LS.get<CollectionBook[]>(WEB_COL_BOOKS, []);
    LS.set(WEB_COL_BOOKS, cbStore.filter(cb => !(cb.collection_id === collectionId && cb.book_id === bookId)));
    return;
  }
  const db = await getNativeDb();
  await db.runAsync('DELETE FROM collection_books WHERE collection_id = ? AND book_id = ?', [collectionId, bookId]);
};

export const getBooksByCollection = async (collectionId: number): Promise<Book[]> => {
  if (Platform.OS === 'web') {
    const cbStore = LS.get<CollectionBook[]>(WEB_COL_BOOKS, []);
    const bookIds = cbStore.filter(cb => cb.collection_id === collectionId).map(cb => cb.book_id);
    const books = webGetBooks().filter(b => b.id !== undefined && bookIds.includes(b.id));
    return books.map(resolveBook);
  }
  const db = await getNativeDb();
  return db.getAllAsync<Book>(
    'SELECT b.* FROM books b INNER JOIN collection_books cb ON b.id = cb.book_id WHERE cb.collection_id = ?',
    [collectionId]
  );
};
