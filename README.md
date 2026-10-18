# 📚 Kita.id - Personal Library & Reading Tracker

![Kita.id Banner](https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop)

**Kita.id** (Aplikasi Buku Pribadi) adalah aplikasi mobile komprehensif yang dirancang untuk mengelola koleksi buku fisik maupun digital Anda, memantau progres membaca, serta memberikan wawasan analitik tentang kebiasaan membaca Anda. Dibangun menggunakan teknologi modern dengan sistem desain *editorial* yang hangat dan premium: tipografi serif Fraunces + Plus Jakarta Sans, 8 tema warna (termasuk mode gelap), gradien lembut, dan animasi halus.

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

### 4. 📊 Statistics Dashboard
Pantau perjalanan membaca Anda lewat visualisasi interaktif yang elegan:
- **Target Membaca Tahunan:** Tetapkan target jumlah buku dan pantau progresnya lewat *ring chart*.
- **Donut Chart Status Baca:** Distribusi Sedang Dibaca, Selesai, Ingin Baca, dan Ditunda.
- **Genre Favorit & Rating Tertinggi:** Dihitung otomatis dari koleksi Anda.
- **Pencapaian (Milestones):** Lencana terbuka saat 1, 5, 10, 25, dan 50 buku selesai dibaca.
- **Inspirational Quote:** Kutipan dari tokoh ternama setiap kali Anda membuka *dashboard*.

### 5. 📈 Reading Progress Tracker & Rating
Catat persentase progres membaca (0-100%) lewat *bottom sheet* dengan pilihan cepat. Status otomatis berubah menjadi "Selesai" di 100%. Saat membaca PDF di dalam aplikasi, progres tersimpan otomatis berdasarkan halaman terakhir. Beri rating 1–5 bintang langsung dari halaman detail.

### 6. 🎨 8 Tema & Profil
Pilih tema Lavender, Biru Langit, Zamrud, Amber, Mawar, Kertas Tua, Tengah Malam, atau Noir Emas. Atur nama dan foto profil, lalu *export* / *restore* seluruh koleksi dalam satu file JSON.

---

## 🛠️ Tech Stack & Arsitektur

Aplikasi ini dibangun menggunakan arsitektur modern berbasis React Native dengan ekosistem Expo:

- **Framework:** React Native 0.85 / Expo SDK 56 (New Architecture, React Compiler)
- **Routing:** Expo Router (File-based routing, typed routes)
- **Database Lokal:** Expo SQLite di native, `localStorage` di web (lihat `database/db.ts`)
- **Storage/Asset Picker:** Expo Image Picker & Expo Document Picker
- **Native Modules:** Expo Camera (Barcode Scanning), WebView + PDF.js (PDF Reader), Expo Sharing & File System (Backup)
- **Design System:** Token di `constants/design.ts`, tema di `contexts/ThemeContext.tsx`, komponen UI di `components/ui/`
- **Tipografi:** Fraunces (judul) + Plus Jakarta Sans (teks) via `@expo-google-fonts`
- **Visual:** Expo Linear Gradient, Expo Blur, React Native SVG, Reanimated 4
- **Icons:** SF Symbols di iOS, Material Icons di Android/Web (`components/ui/icon-symbol.tsx`)

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi Lokal

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) dan [Git](https://git-scm.com/) di mesin Anda. Sangat disarankan menginstal aplikasi **Expo Go** di HP Anda (iOS/Android).

1. **Clone repositori ini**
   ```bash
   git clone https://github.com/YudaHasibuan/aplikasi-buku-pribadi.git
   cd aplikasi-buku-pribadi
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
- [x] **Phase 4: Polish** (Design system & 8 tema, Profil, Rating, Target Membaca, Export/Restore JSON, Rename Rak).
- [ ] **Phase 5: Next** (Reading Timer, Notifikasi Pengingat, Ekspor CSV, Lokalisasi Bahasa).

*(Selengkapnya dapat dilihat pada file `FEATURES_PLAN.md` di dalam repositori).*

---

## 👨‍💻 Kontributor / Pengembang
Dikembangkan oleh **Yuda Hasibuan** untuk menciptakan pengalaman perpustakaan digital personal yang imersif dan produktif.
