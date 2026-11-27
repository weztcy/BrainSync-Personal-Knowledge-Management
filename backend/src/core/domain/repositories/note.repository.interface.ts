import type {
  BacklinkSource,
  LinkCandidate,
  Note,
  NoteInput,
  NoteSummary,
  NoteTitle,
} from '../entities/note.entity.js';
import type { GraphData } from '../entities/graph.entity.js';

export interface INoteRepository {
  findById(id: string): Promise<Note | null>;
  /** Case-insensitive exact title match. */
  findByTitle(title: string): Promise<Note | null>;
  /** Notes whose title equals any of `titles` (case-insensitive). Unknown titles are simply absent. */
  findByTitles(titles: string[]): Promise<NoteTitle[]>;
  /** Most recently updated first. */
  listRecent(limit: number): Promise<NoteSummary[]>;
  listTitles(): Promise<NoteTitle[]>;
  /**
   * Creates the note when `note.id` is absent, otherwise updates it, and atomically
   * replaces its outgoing links with `targetLinkIds` (self-links are ignored).
   */
  save(note: NoteInput, targetLinkIds: string[]): Promise<Note>;
  delete(id: string): Promise<void>;

  /** Notes (other than `excludeId`) whose content may contain `[[title]]`. May over-match; callers re-check. */
  findLinkCandidates(title: string, excludeId: string): Promise<LinkCandidate[]>;
  /** Replaces all links pointing AT `noteId` with links from `sourceIds`. */
  replaceIncomingLinks(noteId: string, sourceIds: string[]): Promise<void>;
  /** Notes that link to `noteId`, most recently updated first. */
  findBacklinks(noteId: string): Promise<BacklinkSource[]>;
  /** Complete node and edge graph data for graph visualization. */
  getGraphData(): Promise<GraphData>;
  /** Notes whose content contains markdown task checkboxes ('- ['). */
  findNotesWithTasks(): Promise<Array<{ id: string; title: string; content: string }>>;
  /** Toggles the pinned status of a note. */
  togglePin(id: string, isPinned: boolean): Promise<Note>;
}
