import { randomUUID } from 'node:crypto';
import type {
  BacklinkSource,
  LinkCandidate,
  Note,
  NoteInput,
  NoteSummary,
  NoteTitle,
} from '../../src/core/domain/entities/note.entity.js';
import type { INoteRepository } from '../../src/core/domain/repositories/note.repository.interface.js';
import type { GraphData } from '../../src/core/domain/entities/graph.entity.js';

/** In-memory test double: lets use cases be tested without Prisma or PostgreSQL. */
export class InMemoryNoteRepository implements INoteRepository {
  readonly notes = new Map<string, Note>();
  /** Set of `${sourceId}>${targetId}` edges. */
  readonly links = new Set<string>();

  async findById(id: string): Promise<Note | null> {
    return this.notes.get(id) ?? null;
  }

  async findByTitle(title: string): Promise<Note | null> {
    const key = title.toLowerCase();
    return [...this.notes.values()].find((note) => note.title.toLowerCase() === key) ?? null;
  }

  async findByTitles(titles: string[]): Promise<NoteTitle[]> {
    const keys = new Set(titles.map((title) => title.toLowerCase()));
    return [...this.notes.values()]
      .filter((note) => keys.has(note.title.toLowerCase()))
      .map(({ id, title }) => ({ id, title }));
  }

  async listRecent(limit: number): Promise<NoteSummary[]> {
    return [...this.notes.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
      .map(({ id, title, isPinned, updatedAt }) => ({ id, title, isPinned: isPinned ?? false, updatedAt }));
  }

  async listTitles(): Promise<NoteTitle[]> {
    return [...this.notes.values()].map(({ id, title }) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
  }

  async save(input: NoteInput, targetLinkIds: string[]): Promise<Note> {
    const now = new Date();
    const existing = input.id ? this.notes.get(input.id) : undefined;
    const note: Note = {
      id: input.id ?? randomUUID(),
      title: input.title,
      content: input.content,
      isPinned: input.isPinned ?? existing?.isPinned ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.notes.set(note.id, note);

    for (const edge of [...this.links]) {
      if (edge.startsWith(`${note.id}>`)) this.links.delete(edge);
    }
    for (const target of targetLinkIds) {
      if (target !== note.id) this.links.add(`${note.id}>${target}`);
    }
    return note;
  }

  async delete(id: string): Promise<void> {
    this.notes.delete(id);
    for (const edge of [...this.links]) {
      const [source, target] = edge.split('>');
      if (source === id || target === id) this.links.delete(edge);
    }
  }

  async findLinkCandidates(title: string, excludeId: string): Promise<LinkCandidate[]> {
    const needle = `[[${title}`.toLowerCase();
    return [...this.notes.values()]
      .filter((note) => note.id !== excludeId && note.content.toLowerCase().includes(needle))
      .map(({ id, content }) => ({ id, content }));
  }

  async replaceIncomingLinks(noteId: string, sourceIds: string[]): Promise<void> {
    for (const edge of [...this.links]) {
      if (edge.endsWith(`>${noteId}`)) this.links.delete(edge);
    }
    for (const source of sourceIds) {
      if (source !== noteId) this.links.add(`${source}>${noteId}`);
    }
  }

  async findBacklinks(noteId: string): Promise<BacklinkSource[]> {
    return [...this.links]
      .filter((edge) => edge.endsWith(`>${noteId}`))
      .map((edge) => this.notes.get(edge.split('>')[0] ?? ''))
      .filter((note): note is Note => note !== undefined)
      .map(({ id, title, content }) => ({ id, title, content }));
  }

  /** Test helper: targets linked from `noteId`, as titles. */
  linkedTitlesFrom(noteId: string): string[] {
    return [...this.links]
      .filter((edge) => edge.startsWith(`${noteId}>`))
      .map((edge) => this.notes.get(edge.split('>')[1] ?? '')?.title ?? '?')
      .sort();
  }

  async getGraphData(): Promise<GraphData> {
    return {
      nodes: [...this.notes.values()].map((n) => ({ id: n.id, title: n.title, backlinkCount: 0 })),
      edges: [...this.links].map((l) => {
        const [source, target] = l.split('>');
        return { source: source ?? '', target: target ?? '' };
      }),
    };
  }

  async findNotesWithTasks(): Promise<Array<{ id: string; title: string; content: string }>> {
    return [...this.notes.values()]
      .filter((n) => n.content.includes('- ['))
      .map(({ id, title, content }) => ({ id, title, content }));
  }

  async togglePin(id: string, isPinned: boolean): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error(`Note ${id} not found`);
    }
    const updated = { ...note, isPinned, updatedAt: new Date() };
    this.notes.set(id, updated);
    return updated;
  }
}
