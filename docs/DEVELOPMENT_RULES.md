
---

# Development Rules & Guidelines

**Proyek:** Personal Knowledge Management (PKM) Web App
**Arsitektur:** Hybrid (Clean Architecture + Feature-Sliced Design) di Next.js

Dokumen ini memuat aturan ketat yang **WAJIB** dipatuhi selama masa pengembangan. Setiap baris kode baru atau *refactoring* harus dievaluasi berdasarkan pedoman ini.

---

## 1. Batasan Lapisan Arsitektur (The Dependency Rule)

Aturan emas Clean Architecture: **Ketergantungan (dependencies) hanya boleh mengarah ke dalam.** Lapisan dalam tidak boleh tahu apapun tentang lapisan luar.

* 🔴 **`src/core/domain/` (Entities & Interfaces)**
* **BOLEH import:** Tidak ada (hanya *built-in* TypeScript/JavaScript).
* **TIDAK BOLEH import:** `react`, `next`, `prisma`, `@/features`, atau *library* eksternal lainnya.


* 🟡 **`src/core/use-cases/` (Business Logic)**
* **BOLEH import:** `@/core/domain/*`.
* **TIDAK BOLEH import:** `react`, `next`, `prisma`, HTTP Request/Response, infrastruktur.


* 🔵 **`src/core/infrastructure/` (Database & External Adapters)**
* **BOLEH import:** `@/core/domain/*`, `prisma`, dan *library* pihak ketiga.
* **TIDAK BOLEH import:** `@/core/use-cases/*` (Infrastruktur dipanggil *oleh* Use Case, bukan sebaliknya), `@/features/*`.


* 🟢 **`src/features/` (UI & Controllers)**
* **BOLEH import:** Komponen dari `src/shared/`, *Use Cases* dan *Infrastructure* (hanya di dalam file `actions`), dan *library* UI (`react`, `tailwind`).
* **TIDAK BOLEH import:** Fitur lain secara langsung (kecuali melalui `shared` atau jika benar-benar terkait erat).



---

## 2. Paradigma Next.js & React

* **Server Components by Default:** Semua komponen React harus berupa *Server Component* secara *default*. Hanya gunakan `'use client'` di baris pertama *file* jika komponen membutuhkan interaktivitas peramban (misal: `useState`, `onClick`, *hooks*, DOM events).
* **Pemisahan Client & Server UI:** Jika sebuah halaman besar membutuhkan interaktivitas, jangan ubah seluruh halaman menjadi `'use client'`. Ekstrak bagian yang interaktif ke komponen terpisah dan panggil di dalam *Server Component* halaman tersebut.
* **Server Actions sebagai Controllers:** Mutasi data (Create, Update, Delete) harus menggunakan fungsi asinkron dengan direktif `'use server'`. Server Actions ini bertindak sebagai *Dependency Injection Container* yang merakit *Repository* dan *Use Case*.

---

## 3. Konvensi Penamaan (Naming Conventions)

Untuk menjaga konsistensi, gunakan konvensi berikut di seluruh proyek:

**File & Folder:**

* Gunakan `kebab-case` untuk folder dan nama *file* non-komponen (misal: `save-note.usecase.ts`, `link-parser.service.ts`).
* Gunakan `PascalCase` untuk *file* komponen React (misal: `MarkdownEditor.tsx`, `Omnibar.tsx`).
* Khusus folder *routing* Next.js, gunakan standar bawaan (misal: `[id]`, `(main)`, `page.tsx`, `layout.tsx`).

**Penamaan Class & Interface:**

* **Interface Port/Repository:** Gunakan awalan `I` (misal: `INoteRepository`).
* **Use Case:** Gunakan akhiran `UseCase` (misal: `CreateNoteUseCase`).
* **Entity/Type:** Gunakan PascalCase sederhana (misal: `Note`, `Tag`).
* **Implementation:** Gunakan nama teknologi sebagai awalan (misal: `PrismaNoteRepository`).

---

## 4. Aturan Penulisan TypeScript

* **Larangan `any`:** Dilarang keras menggunakan tipe `any`. Gunakan `unknown` jika tipe data benar-benar tidak diketahui dan lakukan *type narrowing*, atau definisikan *interface/type* yang tepat.
* **Return Types yang Eksplisit:** Fungsi kompleks, Use Cases, dan Repositories **harus** mendeklarasikan tipe kembaliannya secara eksplisit, bukan mengandalkan inferensi TypeScript (misal: `async execute(): Promise<Note>`).

---

## 5. Alur Kerja Implementasi Fitur Baru (AI Workflow)

Ketika meminta AI (atau saat Anda sendiri) untuk membuat fitur baru, **selalu mulai dari lapisan paling dalam ke lapisan paling luar** dengan urutan berikut:

1. **Langkah 1: Domain** -> Definisikan `Entity` dan `Interface Repository` (Port) di `src/core/domain/`.
2. **Langkah 2: Use Case** -> Tulis logika bisnis aplikasi di `src/core/use-cases/` yang bergantung pada *interface* (Langkah 1).
3. **Langkah 3: Infrastructure** -> Implementasikan antarmuka *database* menggunakan Prisma di `src/core/infrastructure/`.
4. **Langkah 4: Server Action** -> Buat *Controller* di `src/features/[nama-fitur]/actions/` yang menginjeksi infrastruktur (Langkah 3) ke dalam Use Case (Langkah 2).
5. **Langkah 5: UI** -> Bangun komponen React dan integrasikan *Server Action* di `src/features/[nama-fitur]/components/`.

---

## 6. CSS & Styling

* Hanya gunakan **Tailwind CSS**. Dilarang menggunakan *file* `.css` atau `.scss` kustom kecuali untuk konfigurasi global ekstrim (misalnya tipografi spesifik editor atau CSS variabel untuk tema).
* Gunakan `clsx` atau `tailwind-merge` (biasanya dibungkus dalam utilitas `cn()`) untuk menggabungkan nama *class* yang dinamis guna mencegah bentrok *class* Tailwind.

---