# 📚 Kita.id - Personal Library & Reading Tracker

![Kita.id Banner](https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop)

**Kita.id** (Aplikasi Buku Pribadi) adalah aplikasi mobile komprehensif yang dirancang untuk mengelola koleksi buku fisik maupun digital Anda, memantau progres membaca, serta memberikan wawasan analitik tentang kebiasaan membaca Anda. Dibangun menggunakan teknologi modern dengan desain antarmuka *Dark Glassmorphism* yang elegan dan premium.

---

## ✨ Fitur Unggulan

### 1. 📖 Manajemen Koleksi Buku (Smart Library)
- **Tambah Buku Manual:** Masukkan detail judul, penulis, cover, dan genre.
- **Rak Kustom (Custom Collections):** Buat rak buku khusus tanpa batas (misal: "Buku Favorit", "Wishlist", "Tugas Kuliah") dan kelompokkan buku-buku Anda dengan mudah.
- **Pencarian Real-Time:** Temukan koleksi buku Anda secara instan menggunakan pencarian global pintar.

### 2. 📷 Barcode Scanner & Auto-Fill (Smart Scan)
Punya buku fisik? Cukup arahkan kamera HP ke *barcode* ISBN di sampul belakang buku. Aplikasi secara asinkron akan mengambil metadata dari **OpenLibrary API** dan mengisi formulir buku secara otomatis (Judul, Penulis, Cover, Genre, dll).

### 3. 📄 E-Book & PDF Repository
Tidak hanya buku fisik, Anda kini bisa menyimpan koleksi buku digital! Unggah *file* PDF/e-book ke dalam aplikasi, lacak progresnya, dan baca langsung menggunakan PDF Reader bawaan sistem Anda secara *seamless*.

### 4. 📊 Statistics Dashboard & Hub
Pantau perjalanan membaca Anda lewat visualisasi interaktif yang elegan:
- **Live Counters:** Lihat total buku, koleksi PDF, dan progres rata-rata membaca Anda.
- **Stacked Bar Chart:** Analitik persentase status membaca (Sedang Dibaca, Selesai, Ingin Baca, Ditunda).
- **Deteksi Genre Otomatis:** Sistem akan menampilkan genre terfavorit dari koleksi Anda.
- **Habits Tracker:** Daftar periksa kebiasaan membaca untuk memacu semangat literasi harian.
- **Inspirational Quote:** Menyajikan kutipan berkelas dari tokoh ternama setiap kali Anda membuka *dashboard*.

### 5. 📈 Reading Progress Tracker
Catat persentase progres membaca Anda (0-100%). Aplikasi secara cerdas akan mengganti status menjadi "Selesai" jika Anda menyentuh 100%, lengkap dengan *progress bar* visual yang estetik di setiap halaman detail buku.

---

## 🛠️ Tech Stack & Arsitektur

Aplikasi ini dibangun menggunakan arsitektur modern berbasis React Native dengan ekosistem Expo:

- **Framework:** React Native / Expo SDK 56
- **Routing:** Expo Router v4 (File-based routing)
- **Database Lokal:** Expo SQLite (Penyimpanan persisten *offline*)
- **Storage/Asset Picker:** Expo Image Picker & Expo Document Picker
- **Native Modules:** Expo Camera (Barcode Scanning), Expo Intent Launcher & Linking (PDF Reader)
- **Styling:** Vanilla StyleSheet dengan pola desain *Dark Glassmorphism* modern (Slate/Indigo Palette)
- **Icons:** Expo Symbols / Material Icons

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi Lokal

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) dan [Git](https://git-scm.com/) di mesin Anda. Sangat disarankan menginstal aplikasi **Expo Go** di HP Anda (iOS/Android).

1. **Clone repositori ini**
   ```bash
   git clone https://github.com/YudaHasibuan/aplikasi-buku-pribadi.git
   cd aplikasi-buku-pribadi/myapp
   ```

2. **Instal dependensi**
   ```bash
   npm install
   ```

3. **Jalankan Development Server**
   ```bash
   npx expo start -c
   ```

4. **Jalankan di HP Anda (Paling Disarankan)**
   - Buka aplikasi **Expo Go** di HP Anda.
   - Pilih *Scan QR Code* dan arahkan kamera ke QR yang muncul di terminal komputer Anda.

*(Catatan: Menggunakan Emulator lokal mungkin tidak mendukung pemindaian kamera secara penuh).*

---

## 🗺️ Roadmap Pengembangan (Current Status)

Proyek ini menggunakan metodologi pengembangan berbasis fase.

- [x] **Phase 1: Core System** (Setup UI, SQLite, Expo Router, Bottom Tabs, CRUD Buku).
- [x] **Phase 2: Management & Tracking** (Reading Tracker 0-100%, Real-time Search, Custom Shelf/Rak Buku, Sistem Relasional Many-to-Many).
- [x] **Phase 3: Enhancements** (ISBN Camera Scanner, PDF File Integration, UI Analytics/Statistics Dashboard).
- [ ] **Phase 4: Polish** (Reading Timer, Profiling, Ekspor CSV/JSON, Lokalisasi Bahasa).

*(Selengkapnya dapat dilihat pada file `FEATURES_PLAN.md` di dalam repositori).*

---

## 👨‍💻 Kontributor / Pengembang
Dikembangkan oleh **Yuda Hasibuan** untuk menciptakan pengalaman perpustakaan digital personal yang imersif dan produktif.
