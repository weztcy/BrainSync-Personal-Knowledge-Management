'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/lib/cn';
import type { ResolvedLink } from '@/shared/types';

interface MarkdownViewerProps {
  content: string;
  links: ResolvedLink[];
  onToggleTask?: (taskIndex: number, completed: boolean) => void;
}

export function MarkdownViewer({ content, links, onToggleTask }: MarkdownViewerProps): ReactNode {
  // Map lowercased title to noteId for instant O(1) lookup
  const linkMap = new Map(links.map((l) => [l.title.toLowerCase().trim(), l.noteId]));
  let checkboxCounter = 0;

  /**
   * Replaces [[Title]] with a custom link token before markdown rendering,
   * so ReactMarkdown can render them as Next.js Links or Ghost links.
   */
  const transformContent = (raw: string): string => {
    // Replace [[Title]] with [Title](wiki://Title)
    return raw.replace(/\[\[([^[\]\n|]+)\]\]/g, (_, title: string) => {
      const trimmed = title.trim();
      return `[${trimmed}](wiki://${encodeURIComponent(trimmed)})`;
    });
  };

  const processed = transformContent(content);

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:font-medium prose-pre:bg-slate-900 prose-pre:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          input: ({ checked, disabled, ...props }) => {
            if (props.type === 'checkbox') {
              const taskIdx = checkboxCounter++;
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!onToggleTask}
                  onChange={(e) => {
                    onToggleTask?.(taskIdx, e.target.checked);
                  }}
                  className={cn(
                    'w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 mr-2 align-middle transition-colors',
                    onToggleTask ? 'cursor-pointer hover:border-blue-500' : 'cursor-default',
                  )}
                />
              );
            }
            return <input checked={checked} disabled={disabled} {...props} />;
          },
          a: ({ href, children }) => {
            if (href && href.startsWith('wiki://')) {
              const rawTitle = decodeURIComponent(href.replace('wiki://', '')).trim();
              const lower = rawTitle.toLowerCase();
              const noteId = linkMap.get(lower);

              if (noteId) {
                // Resolved bi-directional link
                return (
                  <Link
                    href={`/note/${noteId}`}
                    className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold bg-blue-50/80 dark:bg-blue-950/40 px-1 py-0.5 rounded text-[0.95em]"
                    title={`Go to note: ${rawTitle}`}
                  >
                    <span>[[</span>
                    {children}
                    <span>]]</span>
                  </Link>
                );
              }

              // Unresolved / Ghost link (PRD 3.2: clickable with different visual style)
              return (
                <Link
                  href={`/note/new?title=${encodeURIComponent(rawTitle)}`}
                  className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400 border-b border-dashed border-slate-400 dark:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/60 px-1 py-0.5 rounded text-[0.95em]"
                  title={`Ghost link: create note "${rawTitle}"`}
                >
                  <span>[[</span>
                  {children}
                  <span className="text-[10px] ml-1 text-slate-400 italic">new</span>
                  <span>]]</span>
                </Link>
              );
            }

            return (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer noopener"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

