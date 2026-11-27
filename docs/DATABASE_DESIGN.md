
---

# API Specifications & Server Actions

**Arsitektur:** Next.js App Router (React Server Components & Server Actions)
**Prinsip Desain:**

* Operasi pembacaan data (*Read*) dilakukan langsung di level komponen (Server Components) tanpa memanggil *route handlers* terpisah (tanpa *fetch* `api/…`).
* Operasi perubahan data (*Mutations*) menggunakan fungsi asinkron (Server Actions) yang dapat dipanggil baik dari properti form `action` maupun langsung di *event handler* seperti `onClick` atau *auto-save* Editor.

---

## 1. Rangkuman Server Actions Inti

Semua Server Actions diletakkan di dalam berkas direktori `/actions` (misal: `/actions/notes.ts`, `/actions/tags.ts`) dan dideklarasikan dengan `'use server'` di baris teratas.

### 1.1 Manajemen Catatan (`actions/notes.ts`)

#### A. `saveNote`

Menyimpan atau memperbarui catatan. Dipanggil otomatis oleh fitur *debounce* pada editor (saat mengetik).

* **Signature:**
```typescript
async function saveNote(data: { id?: string; title: string; content: string }): Promise<Note | { error: string }>

```


* **Logika di Balik Layar:**
1. Jika tidak ada `id`, buat catatan baru (Create).
2. Jika ada `id`, perbarui catatan (Update).
3. Panggil fungsi *parser* `extractWikiLinks(content)` untuk mengekstrak string tautan (seperti `[[React]]`).
4. Cari ID catatan tujuan berdasarkan string yang diekstrak.
5. Hapus seluruh entri lama `NoteLink` di mana catatan ini bertindak sebagai `sourceNoteId`.
6. Buat entri relasi baru (`createMany`) di `NoteLink` menggunakan ID tujuan.
7. Ekstrak *hashtag* (`#tag`) dan sinkronisasi ke tabel `Tag`.
8. Kembalikan objek `Note` terbaru dan panggil `revalidatePath('/notes')` untuk menyegarkan tampilan Sidebar dan *cache*.



#### B. `deleteNote`

Menghapus catatan.

* **Signature:**
```typescript
async function deleteNote(noteId: string): Promise<{ success: boolean; error?: string }>

```


* **Logika di Balik Layar:**
1. Jalankan Prisma `delete`.
2. Ketergantungan *Foreign Key* (seperti `NoteLink`) akan ditangani otomatis berkat parameter `onDelete: Cascade` pada skema *database*.
3. Lakukan `revalidatePath('/')`.



### 1.2. Pencarian Universal (`actions/search.ts`)

Digunakan secara khusus oleh antarmuka Command Palette (Cmd+K). Membutuhkan optimasi yang tinggi agar dapat merespons di bawah 200 milidetik.

#### A. `globalSearch`

Melakukan *Fuzzy Search* di semua area.

* **Signature:**
```typescript
async function globalSearch(query: string): Promise<SearchResult[]>

// Tipe Pengembalian
type SearchResult = {
  id: string;
  title: string;
  snippet?: string; // Potongan teks yang berisi kata kunci
  type: 'note' | 'tag';
}

```


* **Logika di Balik Layar:**
1. Jika *query* kosong, jangan lakukan pencarian *database*, cukup kembalikan *array* kosong.
2. Gunakan klausa Prisma `OR` menggunakan filter `contains` dan *mode* tidak memedulikan huruf besar/kecil (`insensitive`) untuk mencocokkan parameter dengan `title` catatan, nama `tags`, dan `content` catatan (secara opsional jika *query* cukup spesifik).



---

## 2. Pola Data Fetching (React Server Components)

Di Next.js versi 13+, kita tidak perlu menulis rute *API Endpoint* (misal: `/api/notes`) hanya untuk me-*render* antarmuka halaman. Data ditarik (di-fetch) langsung di dalam komponen asinkron (*async component*).

### A. Memuat Daftar Catatan (*Sidebar*)

Berada di dalam komponen seperti `components/Sidebar.tsx` (RSC).

* **Query Prisma:**
```typescript
const recentNotes = await prisma.note.findMany({
  orderBy: { updatedAt: 'desc' }, // Mengurutkan dari yang terbaru diperbarui
  select: { id: true, title: true, updatedAt: true },
  take: 50 // Batasi tampilan agar tidak membebani memori (Pagination ringan)
});

```



### B. Memuat Isi Catatan dan Linked Mentions (Backlinks)

Berada di halaman utama misalnya `app/note/[id]/page.tsx` (RSC).

* **Query Prisma:**
```typescript
// Mengambil catatan dan mencari tautan masuk (backlinks) dalam satu eksekusi
const noteData = await prisma.note.findUnique({
  where: { id: params.id },
  include: {
    tags: true,          // Mengambil tag yang terkait
    linksIn: {           // Mengambil sisi 'Masuk' dari tabel NoteLink
      include: {
        sourceNote: {    // Mendapatkan data Catatan Asal (yang mengandung tautan)
          select: { id: true, title: true, content: true }
        }
      }
    }
  }
});

```


* **Pemrosesan Tambahan di Server:** Komponen ini juga mem-*parsing* `sourceNote.content` dari daftar `linksIn` untuk mengekstrak kalimat pendek di sekitar kata tautan (sebagai cuplikan konteks di UI *Backlink*).

### C. Memuat Daftar Tag

Berada di halaman khusus seperti `app/tags/page.tsx` (RSC).

* **Query Prisma:**
```typescript
const tagsWithCount = await prisma.tag.findMany({
  orderBy: { name: 'asc' },
  include: {
    _count: {
      select: { notes: true } // Menghitung jumlah catatan di masing-masing tag
    }
  }
});

```



---

## 3. Integrasi Rute API Eksternal (Opsional)

Jika aplikasi harus diekspos ke klien lain atau aplikasi eksternal (misalnya antarmuka mobile React Native yang dibuat terpisah, atau jika menggunakan ekstensi Chrome untuk mengirim tautan web (Web Clipper)), maka rute API tradisional (REST) akan dibutuhkan di folder `app/api/`.

* **Rute Pembuatan Catatan via Ekstensi (Web Clipper):**
* **Endpoint:** `POST /api/clipper`
* **Header:** `Authorization: Bearer <API_KEY_PRIBADI>`
* **Body (JSON):** `{ title: "Artikel Keren", content: "Isi artikel..." }`
* **Respon:** `201 Created` dengan balasan objek `Note`.



*(Catatan: Rute API eksternal ini masuk kategori Fase Selanjutnya (Future Scope) berdasarkan dokumen PRD. Pada rilis ini, implementasi mutasi akan murni menggunakan Server Actions.)*

---