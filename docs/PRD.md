
---

# Product Requirements Document (PRD)

**Project Name:** Personal Knowledge Management (PKM) Web App
**Tech Stack Utama:** Next.js (App Router), TypeScript, Tailwind CSS
**Tipe Aplikasi:** Single Page Application (SPA-like experience) via Server-Side Rendering & Client Components

## 1. Visi Produk & Objektif

Aplikasi ini adalah platform *Personal Knowledge Management* (PKM) berbasis web yang dirancang untuk mengatasi fragmentasi informasi. Objektif utamanya adalah menyediakan lingkungan penulisan yang minim distraksi, kemampuan pengelompokan yang dinamis melalui sistem *tag*, dan navigasi pengetahuan asosiatif melalui *bi-directional linking* (tautan dua arah). Aplikasi ini berfokus pada kepemilikan data pengguna, kecepatan akses, dan kemudahan pencarian.

## 2. Target Pengguna & Use Case Utama

**Target Pengguna:**

* *Software Engineer / Developer*: Untuk mencatat *snippet* kode, dokumentasi API, dan konsep teknis.
* *Penulis / Mahasiswa / Peneliti*: Untuk mengumpulkan literatur, ide tulisan, dan membangun metode *Zettelkasten*.

**Skenario Penggunaan Utama (Use Cases):**

1. **Frictionless Capture:** Pengguna membuka aplikasi dan dapat langsung mengetik catatan baru tanpa harus menentukan struktur *folder* terlebih dahulu.
2. **Idea Association:** Saat menulis tentang "React Context", pengguna dapat mengetik `[[State Management]]` untuk secara otomatis menghubungkannya dengan catatan lain yang relevan.
3. **Instant Retrieval:** Pengguna menekan kombinasi tombol (Cmd/Ctrl + K) untuk mencari kata kunci secara instan di seluruh basis data catatan.

---

## 3. Spesifikasi Fungsional (Functional Requirements)

### 3.1. Manajemen Catatan (Note Management)

Fungsionalitas inti dari aplikasi adalah pengelolaan catatan teks berbasis Markdown.

* **Pembuatan Catatan:** Pengguna dapat membuat catatan baru melalui tombol UI atau *shortcut* keyboard (Cmd/Ctrl + N). Catatan baru akan langsung terbuka dengan *state* kosong.
* **Editor Markdown:**
* Mendukung penuh standar Markdown (Heading, Bold, Italic, List, Blockquote, Code Block).
* Mendukung *syntax highlighting* untuk *code block* (berdasarkan bahasa pemrograman yang ditulis).
* **Auto-save:** Sistem akan menyimpan perubahan secara otomatis ke basis data setelah pengguna berhenti mengetik (menggunakan metode *debounce*, misal: 1500ms).


* **Metadata Catatan:** Setiap file catatan menyimpan informasi waktu pembuatan (`createdAt`) dan waktu pembaruan terakhir (`updatedAt`).

### 3.2. Relasi Tautan Dua Arah (Bi-directional Linking)

Ini adalah fitur kunci untuk mengubah catatan menjadi sebuah graf pengetahuan (*knowledge graph*).

* **Sintaks Penghubung:** Menggunakan kurung siku ganda `[[Judul Catatan]]` untuk menautkan catatan saat ini ke catatan lain.
* **Auto-Complete Suggestions:** Saat pengguna mengetik `[[`, sebuah *dropdown* akan muncul menampilkan daftar judul catatan yang ada. Menekan *Enter* atau mengklik opsi akan melengkapi teks otomatis.
* **Backlinks Display (Linked Mentions):** Di area bawah antarmuka catatan yang sedang dibuka, terdapat bagian khusus yang mencantumkan seluruh catatan lain yang memiliki *link* ke catatan saat ini. Tampilan ini menyertakan sedikit cuplikan (*snippet*) kalimat asal tempat tautan itu berada.
* **Unresolved/Ghost Links:** Jika pengguna mengetik `[[Catatan yang Belum Ada]]`, teks tersebut tetap menjadi tautan yang dapat diklik (dengan warna visual berbeda, misalnya abu-abu). Mengklik tautan tersebut akan mengarahkan pengguna ke *editor* dengan catatan baru menggunakan judul tersebut.

### 3.3. Sistem Organisasi (Tagging System)

Sebagai pengganti struktur *folder* hierarkis yang kaku, sistem *tag* digunakan untuk kategorisasi.

* **Multi-tagging:** Pengguna dapat menyematkan banyak *tag* pada satu catatan.
* **Pendeteksian Tag:** Tag diinput melalui panel khusus metadata atau terdeteksi otomatis dari teks Markdown menggunakan simbol *hashtag* `#nama-tag`.
* **Tag Explorer:** Sebuah bagian di *Sidebar* yang mendaftar semua *tag* unik yang pernah dibuat, lengkap dengan jumlah (kalkulasi) catatan yang menggunakan *tag* tersebut.
* **Tag Filtering View:** Mengklik sebuah *tag* akan membuka halaman arsip yang menampilkan daftar semua catatan yang memiliki *tag* tersebut, diurutkan dari yang paling baru diperbarui.

### 3.4. Pencarian Universal (Omnibar / Command Palette)

Pencarian harus menjadi cara tercepat untuk navigasi dalam aplikasi.

* **Trigger:** Diaktifkan menggunakan *shortcut* global `Cmd + K` (Mac) atau `Ctrl + K` (Windows/Linux).
* **Tampilan:** Berupa modal/dialog yang menimpa layar di tengah (Command UI).
* **Algoritma Pencarian:**
* *Fuzzy Search* yang dapat menoleransi sedikit kesalahan ketik (*typo*).
* Indeks prioritas: 1) Kecocokan Judul, 2) Kecocokan Tag, 3) Kecocokan Isi Konten.


* **Interaksi:** Mendukung navigasi murni menggunakan *keyboard* (panah atas/bawah untuk memilih hasil, Enter untuk membuka).

---

## 4. Spesifikasi Non-Fungsional (Non-Functional Requirements)

### 4.1. Antarmuka Pengguna & Pengalaman (UI/UX)

* **Desain Minimalis:** Antarmuka harus bersih, mengutamakan ruang putih (*whitespace*), dan tipografi yang nyaman untuk membaca tulisan panjang (memanfaatkan `@tailwindcss/typography`).
* **Responsivitas:** Layout menyesuaikan dengan layar.
* *Desktop*: Tampilan *Sidebar* (kiri) dan Editor (Kanan).
* *Mobile*: *Sidebar* disembunyikan di dalam *drawer* (menu hamburger) dan editor mengambil 100% lebar layar.


* **Tema:** Mendukung pengaturan warna *Light Mode* dan *Dark Mode*, terintegrasi dengan preferensi sistem operasi.

### 4.2. Performa & Arsitektur Jaringan

* **Client-Side Navigation:** Transisi antar catatan harus instan dan tidak memicu *Full Page Reload*.
* **Optimasi Render:** Memanfaatkan React Server Components (RSC) Next.js untuk *pre-render* daftar catatan dan *backlinks*, sehingga meringankan beban *client*.
* **State Management:** Status sinkronisasi aplikasi (misal: tulisan "Saving..." atau "Saved") harus terlihat jelas namun tidak intrusif oleh pengguna untuk memastikan data telah masuk ke *backend*.

### 4.3. Keamanan Dasar

* Proteksi terhadap XSS (*Cross-Site Scripting*). Karena aplikasi akan merender (*parsing*) string Markdown menjadi HTML, pustaka *parser* harus memfilter tag HTML mentah atau *script* berbahaya yang disisipkan oleh pengguna.

---

## 5. Ringkasan Model Data (High-Level Data Model)

Aplikasi ini membutuhkan penyimpanan relasional untuk menangani kompleksitas tautan antar catatan. Entitas utamanya meliputi:

1. **Note:** Menyimpan `id`, `title`, `content` (raw Markdown text), `createdAt`, `updatedAt`.
2. **Tag:** Menyimpan `id`, `name`. Relasi *Many-to-Many* dengan Note.
3. **NoteLink:** Sebuah tabel persimpangan (*junction table*) untuk memetakan graf pengetahuan. Menyimpan `sourceNoteId` dan `targetNoteId` untuk mencatat bahwa *Catatan A* menautkan tautan ke *Catatan B*.

---

## 6. Out of Scope (Di Luar Cakupan Rilis Saat Ini)

Fitur-fitur berikut diakui bernilai namun **tidak** akan dimasukkan dalam lingkup proyek rilis ini untuk menjaga fokus pengembangan:

* Autentikasi multi-user / Sistem *Login* (aplikasi diasumsikan *single-tenant* atau *local-first* untuk sementara waktu).
* Visualisasi Graf (Tampilan *node* titik-titik antar catatan seperti fitur *Graph View* di Obsidian).
* Fitur kolaborasi (mengedit dokumen bersama pengguna lain secara *real-time*).
* Ekspor dokumen ke PDF.

---