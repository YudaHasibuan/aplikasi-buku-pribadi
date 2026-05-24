import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
// Promise guard: prevents concurrent initDb calls from opening DB multiple times
let initPromise: Promise<void> | null = null;

// Initialize database — safe for concurrent calls
export const initDb = async (): Promise<void> => {
  // Already initialized
  if (db) return;
  // Already initializing — wait for the in-flight promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync('books.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          genre TEXT,
          cover TEXT,
          progress INTEGER DEFAULT 0,
          status TEXT DEFAULT 'Ingin Baca',
          rating INTEGER DEFAULT 0,
          synopsis TEXT,
          is_favorite INTEGER DEFAULT 0,
          pdf_uri TEXT
        );
        CREATE TABLE IF NOT EXISTS collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT
        );
        CREATE TABLE IF NOT EXISTS collection_books (
          collection_id INTEGER,
          book_id INTEGER,
          PRIMARY KEY (collection_id, book_id),
          FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      // Migrate existing databases safely
      try { await db.execAsync(`ALTER TABLE books ADD COLUMN is_favorite INTEGER DEFAULT 0;`); } catch (e) {}
      try { await db.execAsync(`ALTER TABLE books ADD COLUMN pdf_uri TEXT;`); } catch (e) {}
    } catch (e) {
      // Reset so caller can retry
      db = null;
      initPromise = null;
      throw e;
    }
  })();

  return initPromise;
};


// --- Settings / Profile ---
export const getSetting = async (key: string, defaultValue: string = ''): Promise<string> => {
  if (!db) await initDb();
  const row = await db!.getFirstAsync<{value: string}>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : defaultValue;
};

export const setSetting = async (key: string, value: string) => {
  if (!db) await initDb();
  await db!.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};

export interface Book {
  id?: number;
  title: string;
  author: string;
  genre?: string;
  cover?: string;
  progress?: number;
  status?: string; // 'Ingin Baca', 'Sedang Dibaca', 'Selesai', 'Ditunda'
  rating?: number;
  synopsis?: string;
  is_favorite?: number; // 0 or 1
  pdf_uri?: string;
}

// Add a new book
export const addBook = async (book: Book) => {
  if (!db) await initDb();
  const result = await db!.runAsync(
    'INSERT INTO books (title, author, genre, cover, synopsis, status, is_favorite, pdf_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      book.title,
      book.author,
      book.genre || '',
      book.cover || '',
      book.synopsis || '',
      book.status || 'Ingin Baca',
      book.is_favorite || 0,
      book.pdf_uri || '',
    ]
  );
  return result.lastInsertRowId;
};

// Get all books
export const getAllBooks = async (): Promise<Book[]> => {
  if (!db) await initDb();
  return await db!.getAllAsync<Book>('SELECT * FROM books ORDER BY id DESC');
};

// Get a single book by ID
export const getBookById = async (id: number): Promise<Book | null> => {
  if (!db) await initDb();
  return await db!.getFirstAsync<Book>('SELECT * FROM books WHERE id = ?', [id]);
};

// Update a book
export const updateBook = async (id: number, book: Book) => {
  if (!db) await initDb();
  return await db!.runAsync(
    'UPDATE books SET title = ?, author = ?, genre = ?, cover = ?, synopsis = ?, status = ?, progress = ?, rating = ?, is_favorite = ?, pdf_uri = ? WHERE id = ?',
    [
      book.title,
      book.author,
      book.genre || '',
      book.cover || '',
      book.synopsis || '',
      book.status || 'Ingin Baca',
      book.progress || 0,
      book.rating || 0,
      book.is_favorite || 0,
      book.pdf_uri || '',
      id,
    ]
  );
};

// Delete a book
export const deleteBook = async (id: number) => {
  if (!db) await initDb();
  return await db!.runAsync('DELETE FROM books WHERE id = ?', [id]);
};

// --- Collections ---

export interface Collection {
  id?: number;
  name: string;
  description?: string;
  bookCount?: number;
}

export const addCollection = async (name: string, description: string = '') => {
  if (!db) await initDb();
  const result = await db!.runAsync('INSERT INTO collections (name, description) VALUES (?, ?)', [name, description]);
  return result.lastInsertRowId;
};

export const getCollections = async (): Promise<Collection[]> => {
  if (!db) await initDb();
  // Get collections with their book counts
  return await db!.getAllAsync<Collection>(`
    SELECT c.id, c.name, c.description, COUNT(cb.book_id) as bookCount 
    FROM collections c 
    LEFT JOIN collection_books cb ON c.id = cb.collection_id 
    GROUP BY c.id ORDER BY c.id DESC
  `);
};

export const deleteCollection = async (id: number) => {
  if (!db) await initDb();
  return await db!.runAsync('DELETE FROM collections WHERE id = ?', [id]);
};

export const addBookToCollection = async (collectionId: number, bookId: number) => {
  if (!db) await initDb();
  try {
    await db!.runAsync('INSERT INTO collection_books (collection_id, book_id) VALUES (?, ?)', [collectionId, bookId]);
  } catch (e) {
    // Already in collection
  }
};

export const removeBookFromCollection = async (collectionId: number, bookId: number) => {
  if (!db) await initDb();
  await db!.runAsync('DELETE FROM collection_books WHERE collection_id = ? AND book_id = ?', [collectionId, bookId]);
};

export const getBooksByCollection = async (collectionId: number): Promise<Book[]> => {
  if (!db) await initDb();
  return await db!.getAllAsync<Book>(`
    SELECT b.* FROM books b 
    INNER JOIN collection_books cb ON b.id = cb.book_id 
    WHERE cb.collection_id = ?
  `, [collectionId]);
};
