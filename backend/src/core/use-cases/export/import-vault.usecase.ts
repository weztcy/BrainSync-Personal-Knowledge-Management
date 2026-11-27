import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';
import type { SaveNoteUseCase } from '../notes/save-note.usecase.js';

export interface ImportNoteItem {
  filename?: string;
  title?: string;
  content: string;
}

export interface ImportVaultInput {
  notes: ImportNoteItem[];
  overwrite?: boolean;
}

export interface ImportVaultResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export class ImportVaultUseCase {
  constructor(
    private readonly noteRepository: INoteRepository,
    private readonly saveNoteUseCase: SaveNoteUseCase,
  ) {}

  async execute(input: ImportVaultInput): Promise<ImportVaultResult> {
    const total = input.notes.length;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of input.notes) {
      try {
        const title = this.resolveTitle(item);
        if (!title) {
          skipped++;
          continue;
        }

        const existing = await this.noteRepository.findByTitle(title);

        if (existing) {
          if (!input.overwrite) {
            skipped++;
            continue;
          }

          // Overwrite existing note
          await this.saveNoteUseCase.execute({
            id: existing.id,
            title,
            content: item.content,
          });
          imported++;
        } else {
          // Create new note
          await this.saveNoteUseCase.execute({
            title,
            content: item.content,
          });
          imported++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error importing "${item.title || item.filename || 'unknown'}": ${msg}`);
      }
    }

    return {
      total,
      imported,
      skipped,
      errors,
    };
  }

  private resolveTitle(item: ImportNoteItem): string {
    if (item.title && item.title.trim()) {
      return item.title.trim();
    }

    if (item.filename && item.filename.trim()) {
      return item.filename.replace(/\.md$/i, '').trim();
    }

    // Try extracting title from first h1 in content: `# My Title`
    const h1Match = /^#\s+(.+)$/m.exec(item.content);
    if (h1Match && h1Match[1]?.trim()) {
      return h1Match[1].trim();
    }

    return 'Untitled';
  }
}

