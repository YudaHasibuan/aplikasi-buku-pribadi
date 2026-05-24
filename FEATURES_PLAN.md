# 📚 Personal Book Repository — Feature Plan
> App Name: **MyApp** · Platform: **Expo (Web + Mobile)** · Theme: **Dark / Indigo**

---

## 🗂️ Overview

| Kategori | Total Fitur | Status |
|---|---|---|
| Book Management | 6 | 🚧 Planned |
| Reading Tracker | 4 | 🚧 Planned |
| Search & Filter | 4 | 🚧 Planned |
| Collections & Shelves | 3 | 🚧 Planned |
| Statistics Dashboard | 4 | 🚧 Planned |
| Settings & Profile | 3 | 🚧 Planned |
| Export & Backup | 2 | 🚧 Planned |

---

## 1. 📖 Book Management

### 1.1 Upload & Add Book ⭐ Priority: HIGH
- [x] Form tambah buku manual (judul, penulis, genre, penerbit, tahun terbit, sinopsis)
- [x] **Upload Cover Buku** — pilih gambar dari galeri atau kamera (expo-image-picker)
- [x] Preview cover sebelum disimpan
- [x] Validasi form (field wajib, format ISBN)
- [x] Simpan data ke local storage / SQLite (expo-sqlite)

### 1.2 Edit & Delete Buku ⭐ Priority: HIGH
- [x] Edit semua informasi buku
- [x] Hapus buku dari koleksi (dengan konfirmasi dialog)
- [ ] Arsip buku (soft delete — tidak muncul di library tapi data tetap ada)

### 1.3 Detail Halaman Buku ⭐ Priority: HIGH
- [x] Halaman detail buku dengan cover besar, sinopsis, metadata lengkap
- [x] Rating bintang (1–5) per buku
- [ ] Review / catatan pribadi
- [x] Tombol aksi: Mulai Baca, Tandai Selesai, Edit, Hapus

### 1.4 Scan ISBN / Barcode 🔵 Priority: MEDIUM
- [x] Kamera scan barcode ISBN (expo-camera)
- [x] Fetch data otomatis dari Open Library API berdasarkan ISBN
- [x] Auto-fill form dari hasil API (judul, penulis, cover, penerbit)

### 1.5 Import dari Open Library API 🔵 Priority: MEDIUM
- [ ] Pencarian buku di Open Library / Google Books API
- [ ] Tambah buku langsung dari hasil pencarian API ke koleksi pribadi
- [ ] Cover otomatis terunduh dari API

### 1.6 Buku Digital (PDF/ePub) 🟡 Priority: LOW
- [x] Upload file PDF ke koleksi (expo-document-picker)
- [x] Membuka file lokal PDF lewat app pembaca default system (expo-intent-launcher & Linking)
- [x] Link path file tersimpan di database lokal

---

## 2. 📊 Reading Tracker

### 2.1 Status Baca ⭐ Priority: HIGH
- [x] Status: **Ingin Baca** · **Sedang Dibaca** · **Selesai Dibaca** · **Ditunda**
- [x] Ganti status dengan swipe gesture atau tombol

### 2.2 Progress Halaman ⭐ Priority: HIGH
- [x] Input halaman terakhir dibaca (misal: hal. 145 dari 320) atau persentase
- [x] Progress bar otomatis berdasarkan halaman saat ini / total halaman
- [x] Tampil persentase di kartu buku

### 2.3 Sesi Baca (Reading Session) 🔵 Priority: MEDIUM
- [ ] Timer baca otomatis (start/stop/pause)
- [ ] Simpan log sesi baca: tanggal, durasi, halaman yang dibaca
- [ ] Riwayat sesi baca per buku

### 2.4 Target Baca 🔵 Priority: MEDIUM
- [ ] Set target buku per bulan / per tahun
- [ ] Notifikasi pengingat baca harian (expo-notifications)
- [ ] Progress target di dashboard

---

## 3. 🔍 Search & Filter

### 3.1 Global Search ⭐ Priority: HIGH
- [x] Cari berdasarkan judul, penulis, genre, ISBN
- [x] Hasil pencarian real-time (debounce 300ms)
- [ ] Highlight kata kunci di hasil

### 3.2 Filter & Sort 🔵 Priority: MEDIUM
- [ ] Filter berdasarkan: Genre, Status Baca, Rating, Tahun Terbit
- [ ] Urutkan berdasarkan: Judul A-Z, Terbaru Ditambah, Rating Tertinggi, Progress
- [ ] Multiple filter aktif sekaligus
- [ ] Tampilan list / grid toggle

### 3.3 Filter Genre 🔵 Priority: MEDIUM
- [ ] Chip filter genre di bagian atas library
- [ ] Genre kustom yang bisa dibuat sendiri

### 3.4 History Pencarian 🟡 Priority: LOW
- [ ] Simpan riwayat pencarian terakhir
- [ ] Hapus riwayat pencarian

---

## 4. 📂 Collections & Shelves

### 4.1 Buat Koleksi / Rak Buku ⭐ Priority: HIGH
- [x] Buat rak buku kustom (misal: "Bacaan Favorit", "Buku Kerja", "Wishlist")
- [x] Tambahkan buku ke rak tertentu
- [x] Hapus dan rename rak (rename blm, tapi hapus sdh)

### 4.2 Wishlist Buku 🔵 Priority: MEDIUM
- [ ] Tab khusus "Ingin Beli/Baca" sebagai daftar keinginan
- [ ] Tandai buku wishlist sebagai "sudah dibeli"

### 4.3 Favorites ⭐ Priority: HIGH
- [x] Tombol favorit ❤️ di setiap buku
- [ ] Tab khusus daftar buku favorit

---

## 5. 📈 Statistics Dashboard

### 5.1 Ringkasan Koleksi ⭐ Priority: HIGH
- [x] Total buku dimiliki
- [x] Total buku selesai dibaca
- [x] Total buku sedang dibaca
- [x] Rerata Progres Baca
- [x] Total E-Book (PDF) yang dimiliki

### 5.2 Grafik Aktivitas Baca 🔵 Priority: MEDIUM
- [x] Segment stacked bar chart visualisasi status membaca
- [ ] Streak membaca (berapa hari berturut-turut)
- [ ] Waktu total membaca (dari sesi baca)

### 5.3 Distribusi Genre 🔵 Priority: MEDIUM
- [x] Deteksi genre terfavorit berdasarkan jumlah koleksi
- [ ] Genre terfavorit berdasarkan rating tertinggi

### 5.4 Milestones & Badge 🟡 Priority: LOW
- [ ] Badge "Kutu Buku" setelah 50 buku selesai
- [ ] Milestone: 10, 25, 50, 100 buku selesai
- [ ] Tampil di halaman profil

---

## 6. ⚙️ Settings & Profile

### 6.1 Profil Pengguna ⭐ Priority: HIGH
- [ ] Nama pengguna dan avatar
- [ ] Upload foto profil (expo-image-picker)
- [ ] Bio singkat

### 6.2 Tema Aplikasi 🔵 Priority: MEDIUM
- [ ] Toggle Dark Mode / Light Mode
- [ ] Pilihan warna aksen (Indigo, Emerald, Amber, Rose)
- [ ] Ukuran font konten

### 6.3 Notifikasi 🟡 Priority: LOW
- [ ] Aktifkan/nonaktifkan pengingat baca harian
- [ ] Atur waktu pengingat

---

## 7. 💾 Export & Backup

### 7.1 Export Data 🔵 Priority: MEDIUM
- [ ] Export koleksi buku ke file **JSON**
- [ ] Export ke **CSV** (kompatibel dengan Excel / Google Sheets)
- [ ] Share daftar buku via WhatsApp/Email (expo-sharing)

### 7.2 Backup & Restore 🟡 Priority: LOW
- [ ] Backup data ke file lokal
- [ ] Restore data dari file backup

---

## 🛠️ Stack Teknologi

| Kebutuhan | Library |
|---|---|
| Framework | Expo SDK 54, Expo Router v6 |
| Database Lokal | `expo-sqlite` |
| Upload Gambar | `expo-image-picker` |
| Scan Barcode | `expo-barcode-scanner` |
| Notifikasi | `expo-notifications` |
| Dokumen | `expo-document-picker` |
| Share | `expo-sharing` |
| Animasi | `react-native-reanimated` |
| Grafik | `victory-native` atau `react-native-gifted-charts` |
| Icons | `@expo/vector-icons` (MaterialIcons) |
| External API | Open Library API / Google Books API (gratis) |

---

## 🗺️ Roadmap Pengerjaan

```
Phase 1 — Core (Week 1-2)
  ✅ UI Design (Library + Discover screen)
  ✅ Database Setup (expo-sqlite schema)
  ✅ Form Tambah Buku + Upload Cover
  ✅ Halaman Detail Buku
  ✅ Edit & Hapus Buku

Phase 2 — Features (Week 3-4)
  ✅ Status & Progress Baca
  ✅ Search & Filter
  ✅ Koleksi / Rak Buku Kustom
  ✅ Favorit (Toggle ❤️ pada detail)

Phase 3 — Enhancements (Week 5-6)
  ✅ Scan ISBN (Barcode)
  ✅ E-Book (PDF) Repository Support
  ✅ Statistics Dashboard
  🚧 Timer Baca & Target Baca

Phase 4 — Polish (Week 7+)
  ✅ Profil & Avatar
  ✅ Export CSV/JSON
  🚧 Notifikasi Pengingat
  🚧 Badge & Milestones
```

> 💡 **Mulai dari mana?** Rekomendasinya adalah **Phase 1**: setup database SQLite dan form tambah buku dengan fitur upload cover. Ini adalah fondasi semua fitur berikutnya.
