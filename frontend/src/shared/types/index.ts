export interface NoteSummary {
  id: string;
  title: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface NoteTitle {
  id: string;
  title: string;
}

export interface ResolvedLink {
  title: string;
  noteId: string | null;
}

export interface Backlink {
  noteId: string;
  title: string;
  snippet: string;
}

export interface NoteDetail {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  links: ResolvedLink[];
  backlinks: Backlink[];
}

export interface TagWithCount {
  id: string;
  name: string;
  noteCount: number;
}

export type SearchResultType = 'note' | 'tag';

export interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
  type: SearchResultType;
}

export interface GraphNode {
  id: string;
  title: string;
  backlinkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NoteTask {
  id: string;
  noteId: string;
  noteTitle: string;
  lineIndex: number;
  text: string;
  completed: boolean;
  rawLine: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

export interface TaskListResult {
  tasks: NoteTask[];
  stats: TaskStats;
}

export interface ImportVaultResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}


