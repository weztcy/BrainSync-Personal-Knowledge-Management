'use client';

import {
  Bold,
  Check,
  Code2,
  Columns2,
  Download,
  Eye,
  FileCode2,
  Hash,
  Italic,
  ListTodo,
  Loader2,
  Pin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { deleteNoteAction, listNoteTitlesAction, saveNoteAction, togglePinNoteAction } from '../actions/note.actions';
import { BacklinksPane } from './BacklinksPane';
import { MarkdownViewer } from './MarkdownViewer';
import { cn } from '@/shared/lib/cn';
import type { NoteDetail, NoteTitle } from '@/shared/types';

interface MarkdownEditorProps {
  initialNote?: NoteDetail;
  initialTitle?: string;
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';
type EditorMode = 'edit' | 'split' | 'preview';

export function MarkdownEditor({
  initialNote,
  initialTitle,
}: MarkdownEditorProps): ReactNode {
  const router = useRouter();

  const [noteId, setNoteId] = useState<string | undefined>(initialNote?.id);
  const [title, setTitle] = useState(initialNote?.title ?? initialTitle ?? '');
  const [content, setContent] = useState(initialNote?.content ?? '');
  const [tags, setTags] = useState<string[]>(initialNote?.tags ?? []);
  const [links, setLinks] = useState(initialNote?.links ?? []);
  const [backlinks, setBacklinks] = useState(initialNote?.backlinks ?? []);

  const [mode, setMode] = useState<EditorMode>('split');
  const [isPinned, setIsPinned] = useState(initialNote?.isPinned ?? false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [newTagInput, setNewTagInput] = useState('');

  // Autocomplete state for [[Wiki-Links]]
  const [availableTitles, setAvailableTitles] = useState<NoteTitle[]>([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [linkMatchStart, setLinkMatchStart] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const textToInsert = selected || 'text';
    const replacement = `${prefix}${textToInsert}${suffix}`;
    const newContent = `${content.slice(0, start)}${replacement}${content.slice(end)}`;
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
    }, 10);
  };

  // Load note titles for autocomplete on mount
  useEffect(() => {
    listNoteTitlesAction().then((res) => setAvailableTitles(res));
  }, []);

  // Save handler
  const performSave = useCallback(
    async (currentTitle: string, currentContent: string, currentTags: string[]) => {
      setSaveStatus('saving');
      try {
        const res = await saveNoteAction({
          id: noteId,
          title: currentTitle.trim() || undefined,
          content: currentContent,
          manualTags: currentTags,
        });

        if (res.success && res.data) {
          setSaveStatus('saved');
          setTags(res.data.tags);
          setLinks(res.data.links);
          setBacklinks(res.data.backlinks);

          // If this was a new note, transition URL to the new ID
          if (!noteId) {
            setNoteId(res.data.id);
            router.replace(`/note/${res.data.id}`);
          }
          router.refresh();
        } else {
          setSaveStatus('error');
        }
      } catch {
        setSaveStatus('error');
      }
    },
    [noteId, router],
  );

  // Auto-save debounce effect (1500ms per PRD 3.1)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      void performSave(title, content, tags);
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content, tags, performSave]);

  // Autocomplete detection on content change / cursor move
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    // Look back from cursor to see if user is inside a `[[` sequence
    const textBefore = val.slice(0, cursorPos);
    const lastOpenIndex = textBefore.lastIndexOf('[[');

    if (lastOpenIndex !== -1) {
      const textAfterOpen = textBefore.slice(lastOpenIndex + 2);
      // Ensure no closing brackets or newlines between `[[` and cursor
      if (!textAfterOpen.includes(']]') && !textAfterOpen.includes('\n')) {
        setAutocompleteOpen(true);
        setAutocompleteQuery(textAfterOpen);
        setLinkMatchStart(lastOpenIndex);
        setAutocompleteIndex(0);
        return;
      }
    }

    setAutocompleteOpen(false);
  };

  // Filtered titles for autocomplete
  const filteredTitles = availableTitles
    .filter((item) => item.id !== noteId && item.title.toLowerCase().includes(autocompleteQuery.toLowerCase()))
    .slice(0, 8);

  const insertLinkCompletion = (chosenTitle: string) => {
    if (!textareaRef.current || linkMatchStart === -1) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const before = content.slice(0, linkMatchStart);
    const after = content.slice(cursorPos);

    const insertion = `[[${chosenTitle}]]`;
    const newContent = `${before}${insertion}${after}`;
    setContent(newContent);
    setAutocompleteOpen(false);

    // Reposition cursor right after `]]`
    setTimeout(() => {
      textarea.focus();
      const newCursor = before.length + insertion.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // Keyboard navigation inside textarea (autocomplete popup)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autocompleteOpen || filteredTitles.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteIndex((prev) => (prev + 1) % filteredTitles.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteIndex((prev) => (prev - 1 + filteredTitles.length) % filteredTitles.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selected = filteredTitles[autocompleteIndex];
      if (selected) {
        insertLinkCompletion(selected.title);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAutocompleteOpen(false);
    }
  };

  // Manual tag handling
  const handleAddTag = () => {
    const cleaned = newTagInput.trim().replace(/^#+/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleDelete = async () => {
    if (!noteId) return;
    if (confirm(`Are you sure you want to delete "${title || 'Untitled'}"?`)) {
      await deleteNoteAction(noteId);
      router.push('/');
      router.refresh();
    }
  };

  const handleExportNote = () => {
    const safeTitle = (title.trim() || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleTaskInContent = useCallback((taskIndex: number, completed: boolean) => {
    setContent((prev) => {
      const lines = prev.split(/\r?\n/);
      let currentTaskIdx = 0;
      const taskRegex = /^(\s*[-*+]\s*\[)([ xX])(\]\s*(.*))$/;

      for (let i = 0; i < lines.length; i++) {
        const match = taskRegex.exec(lines[i] ?? '');
        if (match && match[1] !== undefined && match[3] !== undefined) {
          if (currentTaskIdx === taskIndex) {
            const newChar = completed ? 'x' : ' ';
            lines[i] = `${match[1]}${newChar}${match[3]}`;
            break;
          }
          currentTaskIdx++;
        }
      }

      return lines.join('\n');
    });
  }, []);

  const handleTogglePin = async () => {
    if (!noteId) return;
    const next = !isPinned;
    setIsPinned(next);
    const res = await togglePinNoteAction(noteId, next);
    if (!res.success) {
      setIsPinned(!next);
    }
    router.refresh();
  };

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 py-8 flex flex-col min-h-full transition-all duration-200',
        mode === 'split' ? 'max-w-7xl' : 'max-w-3xl',
      )}
    >
      {/* Top Header Controls: Mode Toggle & Auto-save Status */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={cn(
              'px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors',
              mode === 'edit'
                ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200',
            )}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={cn(
              'px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors hidden sm:flex',
              mode === 'split'
                ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200',
            )}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Split
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              'px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors',
              mode === 'preview'
                ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200',
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator per PRD 4.2 */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 select-none">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span className="text-blue-500 font-medium">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-400">Saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && <span className="text-amber-500">Unsaved changes</span>}
            {saveStatus === 'error' && <span className="text-red-500 font-medium">Error saving</span>}
          </div>

          {noteId && (
            <button
              type="button"
              onClick={handleTogglePin}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isPinned
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
              title={isPinned ? 'Unpin note' : 'Pin note to sidebar'}
            >
              <Pin className={cn('w-4 h-4', isPinned && 'fill-amber-500')} />
            </button>
          )}

          <button
            type="button"
            onClick={handleExportNote}
            className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Export note (.md)"
          >
            <Download className="w-4 h-4" />
          </button>

          {noteId && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title Input */}
      <div className="mt-6 mb-4">
        {mode !== 'preview' ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none text-slate-900 dark:text-slate-50 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-hidden tracking-tight"
          />
        ) : (
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {title || 'Untitled Note'}
          </h1>
        )}
      </div>

      {/* Tags Metadata Panel (PRD 3.3) */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 py-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
          >
            <Hash className="w-3 h-3 text-emerald-500" />
            {tag}
            {mode !== 'preview' && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500 ml-0.5"
                title="Remove tag"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {mode !== 'preview' && (
          <div className="inline-flex items-center gap-1 ml-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag..."
              className="text-xs bg-transparent border border-dashed border-slate-300 dark:border-slate-700 rounded-full px-2.5 py-0.5 focus:outline-hidden focus:border-blue-500 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
            />
            {newTagInput.trim() && (
              <button
                type="button"
                onClick={handleAddTag}
                className="p-1 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                title="Add tag"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Formatting Toolbar */}
      {mode !== 'preview' && (
        <div className="flex items-center gap-1 pb-3 mb-4 border-b border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 select-none">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```\n', '\n```')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Code block"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Task item (- [ ])"
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('[[', ']]')}
            className="px-2 py-0.5 font-mono text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-blue-600 dark:text-blue-400"
            title="Wiki-Link ([[Title]])"
          >
            [[ ]]
          </button>
        </div>
      )}

      {/* Editor / Split / Preview */}
      <div className="flex-1 relative">
        {mode === 'split' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start min-h-[450px]">
            {/* Left: Textarea */}
            <div className="relative h-full min-h-[450px]">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Write your note in Markdown... Type [[ to link to another note, or #tag to add tags."
                className="w-full h-full min-h-[450px] bg-transparent resize-y border-none text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-hidden font-mono text-sm leading-relaxed"
              />
              {autocompleteOpen && filteredTitles.length > 0 && (
                <div className="absolute top-12 left-4 z-30 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-1.5">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Link Note ([[)
                  </div>
                  <ul className="space-y-0.5">
                    {filteredTitles.map((item, idx) => (
                      <li
                        key={item.id}
                        onClick={() => insertLinkCompletion(item.title)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs cursor-pointer truncate font-medium transition-colors',
                          idx === autocompleteIndex
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
                        )}
                      >
                        [[{item.title}]]
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="min-h-[450px] border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-8 pt-6 md:pt-0">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                Live Preview
              </div>
              <MarkdownViewer
                content={content || '*Empty note...*'}
                links={links}
                onToggleTask={handleToggleTaskInContent}
              />
            </div>
          </div>
        ) : mode === 'edit' ? (
          <div className="relative h-full min-h-[420px]">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Write your note in Markdown... Type [[ to link to another note, or #tag to add tags."
              className="w-full h-full min-h-[420px] bg-transparent resize-y border-none text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-hidden font-mono text-sm sm:text-base leading-relaxed"
            />

            {/* Wiki-Link Autocomplete Dropdown (PRD 3.2) */}
            {autocompleteOpen && filteredTitles.length > 0 && (
              <div className="absolute top-12 left-4 z-30 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-1.5">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Link Note ([[)
                </div>
                <ul className="space-y-0.5">
                  {filteredTitles.map((item, idx) => (
                    <li
                      key={item.id}
                      onClick={() => insertLinkCompletion(item.title)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs cursor-pointer truncate font-medium transition-colors',
                        idx === autocompleteIndex
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
                      )}
                    >
                      [[{item.title}]]
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[420px]">
            <MarkdownViewer
              content={content || '*No content yet.*'}
              links={links}
              onToggleTask={handleToggleTaskInContent}
            />
          </div>
        )}
      </div>

      {/* Backlinks Pane (Linked Mentions) per PRD 3.2 */}
      <BacklinksPane backlinks={backlinks} currentNoteTitle={title || 'Untitled'} />
    </div>
  );
}

