export interface Note {
  id: string;
  title: string;
  /** Raw Markdown. */
  content: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Lightweight projection used by lists (sidebar, tag pages). */
export interface NoteSummary {
  id: string;
  title: string;
  isPinned: boolean;
  updatedAt: Date;
}

/** Minimal projection used for wiki-link autocomplete and link resolution. */
export interface NoteTitle {
  id: string;
  title: string;
}

/** Data required to create (no `id`) or update (with `id`) a note. */
export interface NoteInput {
  id?: string;
  title: string;
  content: string;
  isPinned?: boolean;
}

/** A `[[Title]]` written in a note; `noteId` is null for unresolved ("ghost") links. */
export interface ResolvedLink {
  title: string;
  noteId: string | null;
}

/** Another note that links to the current one, with the sentence containing the link. */
export interface Backlink {
  noteId: string;
  title: string;
  snippet: string;
}

/** A note that links to a target, as loaded from storage (before snippet extraction). */
export interface BacklinkSource {
  id: string;
  title: string;
  content: string;
}

/** A note whose content may mention a given title (used to refresh incoming links). */
export interface LinkCandidate {
  id: string;
  content: string;
}

export interface NoteDetail extends Note {
  tags: string[];
  links: ResolvedLink[];
  backlinks: Backlink[];
}
