import { randomUUID } from 'node:crypto';
import type { NoteSummary } from '../../src/core/domain/entities/note.entity.js';
import type { Tag, TagWithCount } from '../../src/core/domain/entities/tag.entity.js';
import type { ITagRepository } from '../../src/core/domain/repositories/tag.repository.interface.js';
import type { InMemoryNoteRepository } from './in-memory-note.repository.js';

interface NoteTagRecord {
  noteId: string;
  tagId: string;
  source: 'MANUAL' | 'INLINE';
}

export class InMemoryTagRepository implements ITagRepository {
  readonly tags = new Map<string, Tag>();
  readonly noteTags: NoteTagRecord[] = [];

  constructor(private readonly noteRepo?: InMemoryNoteRepository) {}

  private getOrCreateTag(name: string): Tag {
    const lower = name.toLowerCase();
    for (const tag of this.tags.values()) {
      if (tag.name === lower) {
        return tag;
      }
    }
    const newTag: Tag = { id: randomUUID(), name: lower };
    this.tags.set(newTag.id, newTag);
    return newTag;
  }

  async listAllWithCount(): Promise<TagWithCount[]> {
    const counts = new Map<string, number>();
    for (const nt of this.noteTags) {
      counts.set(nt.tagId, (counts.get(nt.tagId) ?? 0) + 1);
    }

    return [...this.tags.values()]
      .filter((t) => (counts.get(t.id) ?? 0) > 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        noteCount: counts.get(t.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findNotesByTagName(name: string): Promise<NoteSummary[]> {
    const lower = name.toLowerCase();
    const tag = [...this.tags.values()].find((t) => t.name === lower);
    if (!tag) {
      return [];
    }

    const noteIds = this.noteTags.filter((nt) => nt.tagId === tag.id).map((nt) => nt.noteId);
    if (!this.noteRepo) {
      return [];
    }

    const notes: NoteSummary[] = [];
    for (const id of noteIds) {
      const note = await this.noteRepo.findById(id);
      if (note) {
        notes.push({ id: note.id, title: note.title, updatedAt: note.updatedAt });
      }
    }

    return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async syncTags(noteId: string, inlineTags: string[], manualTags?: string[]): Promise<string[]> {
    // 1. If manualTags specified, delete existing MANUAL
    if (manualTags !== undefined) {
      for (let i = this.noteTags.length - 1; i >= 0; i--) {
        const nt = this.noteTags[i];
        if (nt && nt.noteId === noteId && nt.source === 'MANUAL') {
          this.noteTags.splice(i, 1);
        }
      }
    }

    // 2. Delete existing INLINE
    for (let i = this.noteTags.length - 1; i >= 0; i--) {
      const nt = this.noteTags[i];
      if (nt && nt.noteId === noteId && nt.source === 'INLINE') {
        this.noteTags.splice(i, 1);
      }
    }

    // 3. Insert manual tags
    if (manualTags !== undefined) {
      for (const m of manualTags) {
        const tag = this.getOrCreateTag(m);
        if (!this.noteTags.some((nt) => nt.noteId === noteId && nt.tagId === tag.id)) {
          this.noteTags.push({ noteId, tagId: tag.id, source: 'MANUAL' });
        }
      }
    }

    // 4. Insert inline tags
    for (const inline of inlineTags) {
      const tag = this.getOrCreateTag(inline);
      if (!this.noteTags.some((nt) => nt.noteId === noteId && nt.tagId === tag.id)) {
        this.noteTags.push({ noteId, tagId: tag.id, source: 'INLINE' });
      }
    }

    return this.getTagsForNote(noteId);
  }

  async getTagsForNote(noteId: string): Promise<string[]> {
    const tagIds = this.noteTags.filter((nt) => nt.noteId === noteId).map((nt) => nt.tagId);
    const names = tagIds
      .map((id) => this.tags.get(id)?.name)
      .filter((name): name is string => name !== undefined);
    return [...new Set(names)].sort();
  }
}

