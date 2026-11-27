import type { NoteDetail } from '../../domain/entities/note.entity.js';
import { NotFoundError } from '../../domain/errors/domain.errors.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface.js';
import { buildBacklinkSnippet, extractWikiLinks } from '../../domain/services/link-parser.service.js';

export class GetNoteUseCase {
  constructor(
    private readonly noteRepository: INoteRepository,
    private readonly tagRepository?: ITagRepository,
  ) {}

  async execute(id: string): Promise<NoteDetail> {
    const note = await this.noteRepository.findById(id);
    if (!note) {
      throw new NotFoundError(`Note ${id} not found`);
    }

    const linkTitles = extractWikiLinks(note.content);
    const [resolved, backlinkSources, tags] = await Promise.all([
      this.noteRepository.findByTitles(linkTitles),
      this.noteRepository.findBacklinks(id),
      this.tagRepository ? this.tagRepository.getTagsForNote(id) : Promise.resolve([]),
    ]);
    const idByTitle = new Map(resolved.map((r) => [r.title.toLowerCase(), r.id]));

    return {
      ...note,
      tags,
      links: linkTitles.map((title) => ({ title, noteId: idByTitle.get(title.toLowerCase()) ?? null })),
      backlinks: backlinkSources.map((source) => ({
        noteId: source.id,
        title: source.title,
        snippet: buildBacklinkSnippet(source.content, note.title),
      })),
    };
  }
}
