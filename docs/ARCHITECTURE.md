
---

# Architecture & Directory Structure (Deep Dive)

**Kerangka Kerja:** Next.js App Router
**Pola Arsitektur:** Hybrid (Feature-Based Slicing + Clean Architecture)

## 1. Aturan Batasan Lapisan (Layer Constraints)

Untuk menjaga agar arsitektur ini tidak bocor (*leaky abstractions*), kita menetapkan aturan impor yang sangat ketat:

* 🔴 **`src/core/domain/`**: Lapisan paling suci. **TIDAK BOLEH** ada *import* dari `react`, `next`, `prisma`, atau *library* eksternal lainnya. Hanya berisi TypeScript murni.
* 🟡 **`src/core/use-cases/`**: Hanya boleh mengimpor dari `domain` dan antarmuka (*interfaces*) dari `repositories`. Tidak boleh tahu tentang HTTP, Request, Response, atau UI.
* 🔵 **`src/core/infrastructure/`**: Boleh mengimpor `prisma` dan *library* eksternal. Bertugas menjembatani *database* dengan kontrak yang diminta oleh Use Cases.
* 🟢 **`src/features/`**: Tempat React dan Next.js berada. Boleh mengimpor UI dari `shared`, menggunakan *hooks*, dan memanggil **Server Actions**.
* 🟣 **Server Actions (`src/features/*/actions/`)**: Bertindak sebagai *Controller / DI Container*. Lapisan inilah yang merakit Use Case dengan Infrastructure.

---

## 2. Struktur Folder & Contoh Kontrak Kode

Mari kita bedah arsitektur ini menggunakan fitur **"Manajemen Catatan (Notes)"** sebagai contoh.

### Lapisan 1: Domain (`src/core/domain/`)

Berisi definisi entitas dan *interface* repositori (Port) yang mendikte bagaimana data harus diambil/disimpan, tanpa peduli *database* apa yang digunakan.

```text
src/core/domain/
├── entities/
│   └── note.entity.ts
├── services/
│   └── link-parser.service.ts   # Logika murni Regex tanpa dependency luar
└── repositories/
    └── note.repository.interface.ts

```

**Detail `note.repository.interface.ts`:**

```typescript
import { Note } from '../entities/note.entity';

export interface INoteRepository {
  findById(id: string): Promise<Note | null>;
  save(note: Note, targetLinkIds: string[], tags: string[]): Promise<Note>;
  delete(id: string): Promise<void>;
}

```

### Lapisan 2: Use Cases (`src/core/use-cases/`)

Berisi logika bisnis spesifik aplikasi. *Use case* tidak mengimpor Prisma, ia hanya bergantung pada `INoteRepository`.

```text
src/core/use-cases/
└── notes/
    └── save-note.usecase.ts

```

**Detail `save-note.usecase.ts`:**

```typescript
import { INoteRepository } from '../../domain/repositories/note.repository.interface';
import { extractWikiLinks } from '../../domain/services/link-parser.service';

export class SaveNoteUseCase {
  // Dependency Injection melalui Constructor
  constructor(private noteRepository: INoteRepository) {}

  async execute(id: string, title: string, content: string) {
    // 1. Eksekusi logika domain murni (Regex Parser)
    const links = extractWikiLinks(content);
    
    // 2. Format entitas
    const note = { id, title, content, updatedAt: new Date() };

    // 3. Simpan via Repository Interface (Tidak peduli Prisma atau MySQL)
    return await this.noteRepository.save(note, links.targetIds, links.tags);
  }
}

```

### Lapisan 3: Infrastructure (`src/core/infrastructure/`)

Di sinilah Prisma ORM hidup. Lapisan ini "mengimplementasikan" antarmuka dari Domain.

```text
src/core/infrastructure/
└── database/
    ├── prisma.client.ts
    └── prisma-note.repository.ts

```

**Detail `prisma-note.repository.ts`:**

```typescript
import { prisma } from './prisma.client';
import { INoteRepository } from '../../domain/repositories/note.repository.interface';
import { Note } from '../../domain/entities/note.entity';

export class PrismaNoteRepository implements INoteRepository {
  async save(note: Note, targetLinkIds: string[], tags: string[]): Promise<Note> {
    // Di sini kita mengeksekusi prisma.$transaction yang rumit
    // (Persis seperti yang didefinisikan di DATABASE_DESIGN.md)
    return await prisma.$transaction(async (tx) => { ... });
  }
  
  async findById(id: string): Promise<Note | null> {
    return await prisma.note.findUnique({ where: { id } });
  }
  
  async delete(id: string): Promise<void> {
    await prisma.note.delete({ where: { id } });
  }
}

```

### Lapisan 4: Features & Interface Adapters (`src/features/`)

Folder ini adalah area bagi *Frontend Developer*. Komponen dibagi berdasarkan fitur (Vertical Slicing).

```text
src/features/
└── notes/
    ├── components/
    │   ├── MarkdownEditor.tsx    # [Client Component] UI Editor (Tiptap)
    │   └── BacklinksPane.tsx     # [Server Component] Merender daftar relasi
    └── actions/
        └── note.actions.ts       # [Server Action] Controller & DI Container

```

**Detail `note.actions.ts` (Tempat Perakitan / Dependency Injection):**
Di sinilah Next.js menghubungkan antarmuka UI dengan *backend core*. Kita merakit *Use Case* dengan *Prisma Repository* di sini.

```typescript
'use server'

import { revalidatePath } from 'next/cache';
import { PrismaNoteRepository } from '@/core/infrastructure/database/prisma-note.repository';
import { SaveNoteUseCase } from '@/core/use-cases/notes/save-note.usecase';

export async function saveNoteAction(payload: { id: string; title: string; content: string }) {
  try {
    // 1. Dependency Injection (Manual Setup)
    const repository = new PrismaNoteRepository();
    const useCase = new SaveNoteUseCase(repository);

    // 2. Eksekusi Use Case
    const savedNote = await useCase.execute(payload.id, payload.title, payload.content);

    // 3. Revalidasi Cache Next.js (Memicu UI untuk re-render)
    revalidatePath(`/note/${payload.id}`);
    revalidatePath('/sidebar-route');

    return { success: true, data: savedNote };
  } catch (error) {
    return { success: false, error: 'Gagal menyimpan catatan' };
  }
}

```

### Lapisan 5: Next.js App Router (`src/app/`)

Lapisan terluar yang hanya bertugas mengatur URL (Rute) dan memanggil komponen dari `src/features`.

```text
src/app/
└── (main)/
    └── note/[id]/page.tsx

```

**Detail `page.tsx`:**

```tsx
import { MarkdownEditor } from '@/features/notes/components/MarkdownEditor';
import { BacklinksPane } from '@/features/notes/components/BacklinksPane';
// ... fetch data awal dari DB ...

export default async function NotePage({ params }: { params: { id: string } }) {
  return (
    <main className="flex flex-col h-screen">
      {/* Client Component untuk mengetik */}
      <MarkdownEditor initialData={...} /> 
      
      {/* Server Component untuk menampilkan relasi graf */}
      <BacklinksPane noteId={params.id} />
    </main>
  );
}

```

---

## 3. Mengapa Arsitektur Ini Sepadan dengan Usahanya?

Walaupun pada awalnya terlihat banyak fail (boilerplate) untuk sebuah aplikasi PKM, arsitektur ini memberikan **Superpower** berikut:

1. **Testability (Pengujian Mudah):** Anda bisa melakukan *Unit Test* pada `SaveNoteUseCase` tanpa harus me-*mock* Prisma atau menyalakan PostgreSQL. Cukup buat `MockNoteRepository` di memori.
2. **Mencegah "God Files":** Logika yang panjang (seperti Regex pencarian *link*, transaksi Prisma, dan UI React) tidak akan bercampur dalam satu *file* `page.tsx` atau `actions.ts` yang panjangnya ribuan baris.
3. **Future-Proof (Tahan Perubahan):** Jika besok Vercel Postgres berbayar mahal dan Anda ingin pindah ke Supabase atau MongoDB, Anda **hanya perlu** membuat `SupabaseNoteRepository.ts` tanpa mengubah kode di folder `domain`, `use-cases`, atau `features/UI`.

---