import type { NoteSummary } from '../entities/note.entity.js';
import type { TagWithCount } from '../entities/tag.entity.js';

export interface ITagRepository {
  /**
   * Returns all tags with count of associated notes, ordered alphabetically.
   * If a tag has 0 notes, it can be excluded or pruned.
   */
  listAllWithCount(): Promise<TagWithCount[]>;

  /**
   * Returns all notes associated with the given tag name, ordered by updatedAt desc.
   */
  findNotesByTagName(name: string): Promise<NoteSummary[]>;

  /**
   * Synchronizes tags for a note.
   * - Replaces INLINE tags with the provided list.
   * - If manualTags is provided (array), replaces MANUAL tags as well.
   * Returns all tag names currently attached to the note.
   */
  syncTags(noteId: string, inlineTags: string[], manualTags?: string[]): Promise<string[]>;

  /**
   * Returns all tag names attached to a specific note.
   */
  getTagsForNote(noteId: string): Promise<string[]>;
}

