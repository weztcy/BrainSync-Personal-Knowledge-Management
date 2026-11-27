export type SearchResultType = 'note' | 'tag';

export interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
  type: SearchResultType;
}

