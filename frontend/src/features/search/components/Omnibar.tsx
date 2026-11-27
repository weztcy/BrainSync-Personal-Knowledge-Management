'use client';

import { FileText, Hash, Loader2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { globalSearchAction } from '../actions/search.actions';
import type { SearchResult } from '@/shared/types';
import { cn } from '@/shared/lib/cn';

interface OmnibarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Omnibar({ isOpen, onClose }: OmnibarProps): ReactNode {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearchAction(trimmed);
        setResults(res);
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const displayedResults = query.trim() ? results : [];

  const handleSelect = useCallback(
    (item: SearchResult) => {
      onClose();
      if (item.type === 'tag') {
        const tagName = item.title.replace(/^#/, '');
        router.push(`/tags/${encodeURIComponent(tagName)}`);
      } else {
        router.push(`/note/${item.id}`);
      }
    },
    [router, onClose],
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (displayedResults.length > 0 ? (prev + 1) % displayedResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (displayedResults.length > 0 ? (prev - 1 + displayedResults.length) % displayedResults.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = displayedResults[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && displayedResults.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, displayedResults.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search Omnibar"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, tags, or content... (↑↓ to navigate, Enter to open)"
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden text-sm sm:text-base"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() && displayedResults.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-slate-400">
              No matching notes or tags found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && (
            <div className="p-6 text-center text-xs text-slate-400">
              Type keywords to search across titles, #tags, and content with fuzzy matching.
            </div>
          )}

          <ul ref={listRef} className="space-y-0.5">
            {displayedResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'px-3 py-2 rounded-lg cursor-pointer flex items-start gap-3 transition-colors',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300',
                  )}
                >
                  <div className="mt-0.5 shrink-0 text-slate-400">
                    {item.type === 'tag' ? (
                      <Hash className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      <span
                        className={cn(
                          'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded tracking-wide shrink-0',
                          item.type === 'tag'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
                        )}
                      >
                        {item.type}
                      </span>
                    </div>
                    {item.snippet && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

