import type { Note } from '../../domain/entities/note.entity.js';
import { ConflictError, NotFoundError, ValidationError } from '../../domain/errors/domain.errors.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface.js';
import { extractWikiLinks, linksToTitle } from '../../domain/services/link-parser.service.js';
import { extractHashTags, normalizeTagNames } from '../../domain/services/tag-parser.service.js';

export const MAX_TITLE_LENGTH = 255;
export const DEFAULT_TITLE = 'Untitled';

export interface SaveNoteCommand {
  id?: string;
  title?: string;
  content?: string;
  manualTags?: string[];
}

export type SavedNoteResult = Note & { tags: string[] };

export class SaveNoteUseCase {
  constructor(
    private readonly noteRepository: INoteRepository,
    private readonly tagRepository?: ITagRepository,
  ) {}

  async execute(command: SaveNoteCommand): Promise<SavedNoteResult> {
    const existing = command.id === undefined ? null : await this.requireExisting(command.id);
    const title = await this.resolveTitle(command, existing);
    const content = command.content ?? existing?.content ?? '';

    // Domain logic (pure regex) -> titles; the repository turns titles into ids.
    const linkedNotes = await this.noteRepository.findByTitles(extractWikiLinks(content));
    const saved = await this.noteRepository.save(
      { ...(existing ? { id: existing.id } : {}), title, content },
      linkedNotes.map((linked) => linked.id),
    );

    // Links INTO this note depend only on its title, so refresh them when it is new or renamed
    // (back-fills ghost links that now resolve and drops links made stale by a rename).
    if (!existing || existing.title !== saved.title) {
      await this.refreshIncomingLinks(saved);
    }

    let tags: string[] = [];
    if (this.tagRepository) {
      const inlineTags = extractHashTags(content);
      const manualTags = command.manualTags ? normalizeTagNames(command.manualTags) : undefined;
      tags = await this.tagRepository.syncTags(saved.id, inlineTags, manualTags);
    }

    return { ...saved, tags };
  }

  private async requireExisting(id: string): Promise<Note> {
    const existing = await this.noteRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Note ${id} not found`);
    }
    return existing;
  }

  private async resolveTitle(command: SaveNoteCommand, existing: Note | null): Promise<string> {
    if (!existing) {
      const requested = (command.title ?? '').trim();
      return requested === '' ? this.generateUntitledTitle() : this.assertTitleAvailable(requested);
    }

    if (command.title === undefined) {
      return existing.title;
    }
    const requested = command.title.trim();
    if (requested === '') {
      throw new ValidationError('Title must not be empty');
    }
    return this.assertTitleAvailable(requested, existing.id);
  }

  private async assertTitleAvailable(title: string, ownId?: string): Promise<string> {
    if (title.length > MAX_TITLE_LENGTH) {
      throw new ValidationError(`Title must be at most ${MAX_TITLE_LENGTH} characters`);
    }
    const clash = await this.noteRepository.findByTitle(title);
    if (clash && clash.id !== ownId) {
      throw new ConflictError(`A note titled "${clash.title}" already exists`);
    }
    return title;
  }

  /** "Untitled", "Untitled 2", "Untitled 3", ... */
  private async generateUntitledTitle(): Promise<string> {
    let candidate = DEFAULT_TITLE;
    for (let suffix = 2; await this.noteRepository.findByTitle(candidate); suffix += 1) {
      candidate = `${DEFAULT_TITLE} ${suffix}`;
    }
    return candidate;
  }

  private async refreshIncomingLinks(note: Note): Promise<void> {
    const candidates = await this.noteRepository.findLinkCandidates(note.title, note.id);
    const sourceIds = candidates.filter((c) => linksToTitle(c.content, note.title)).map((c) => c.id);
    await this.noteRepository.replaceIncomingLinks(note.id, sourceIds);
  }
}
