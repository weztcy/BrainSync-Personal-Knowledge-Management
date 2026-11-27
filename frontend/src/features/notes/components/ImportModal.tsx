'use client';

import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import { importNotesAction, importZipAction } from '../actions/import.actions';
import type { ImportVaultResult } from '@/shared/types';
import { cn } from '@/shared/lib/cn';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps): ReactNode {
  if (!isOpen) return null;
  return <ImportModalDialog onClose={onClose} />;
}

function ImportModalDialog({ onClose }: { onClose: () => void }): ReactNode {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [status, setStatus] = useState<'idle' | 'importing' | 'completed' | 'error'>('idle');
  const [result, setResult] = useState<ImportVaultResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'importing') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, onClose]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    // If user dropped or selected a .zip file, prioritize that zip file
    const zipFile = fileArray.find((f) => f.name.toLowerCase().endsWith('.zip'));
    if (zipFile) {
      setSelectedFiles([zipFile]);
      return;
    }

    // Otherwise gather all markdown files
    for (const file of fileArray) {
      if (file.name.toLowerCase().endsWith('.md')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setErrorMessage(null);
    } else {
      setErrorMessage('Please select a .zip archive or .md Markdown files.');
    }
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleStartImport = async () => {
    if (selectedFiles.length === 0) return;

    setStatus('importing');
    setErrorMessage(null);

    try {
      const firstFile = selectedFiles[0];
      const isZip = selectedFiles.length === 1 && firstFile?.name.toLowerCase().endsWith('.zip');

      if (isZip && firstFile) {
        const zipBase64 = await fileToBase64(firstFile);
        const res = await importZipAction(zipBase64, overwrite);

        if (!res.success || !res.result) {
          setStatus('error');
          setErrorMessage(res.error ?? 'Failed to import ZIP archive');
          return;
        }

        setResult(res.result);
        setStatus('completed');
      } else {
        const notesToImport = await Promise.all(
          selectedFiles.map(async (f) => ({
            filename: f.name,
            title: f.name.replace(/\.md$/i, ''),
            content: await f.text(),
          })),
        );

        const res = await importNotesAction(notesToImport, overwrite);

        if (!res.success || !res.result) {
          setStatus('error');
          setErrorMessage(res.error ?? 'Failed to import Markdown notes');
          return;
        }

        setResult(res.result);
        setStatus('completed');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred during import');
    }
  };

  const handleFinish = () => {
    onClose();
    router.refresh();
  };

  const firstFile = selectedFiles[0];
  const isZip = selectedFiles.length === 1 && firstFile?.name.toLowerCase().endsWith('.zip');
  const totalFileSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import Vault or Notes"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (status !== 'importing') onClose();
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Import Vault or Notes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import Markdown (.md) files or a ZIP archive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'importing'}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* View 1: Idle selection */}
          {status === 'idle' && (
            <>
              {/* Drag and drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors',
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-950/50',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.md"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xs mb-3 text-blue-600 dark:text-blue-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Click to choose files or drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports .zip vault archives or individual .md files
                </p>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Selected for Import:</span>
                    <span className="font-mono text-slate-500">{formatBytes(totalFileSize)}</span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {isZip && firstFile ? (
                      <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200">
                        <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-medium truncate">{firstFile.name}</span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded font-mono">
                          ZIP Vault
                        </span>
                      </div>
                    ) : (
                      selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-0.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto font-mono shrink-0">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Overwrite Option */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      Overwrite existing notes if title matches
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
                      If unchecked, existing notes with the same title will be safely preserved.
                    </span>
                  </div>
                </label>
              </div>

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}

          {/* View 2: Importing Progress */}
          {status === 'importing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Importing Notes & Extracting Links...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Processing {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}, resolving [[wiki-links]] and indexing tags into your knowledge base.
              </p>
            </div>
          )}

          {/* View 3: Completed Results */}
          {status === 'completed' && result && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Import Completed Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your knowledge base has been updated with the imported notes.
                </p>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Total</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {result.total}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block">Imported</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {result.imported}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-center">
                  <span className="text-xs text-amber-600 dark:text-amber-400 block">Skipped</span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {result.skipped}
                  </span>
                </div>
              </div>

              {/* Errors list if any occurred */}
              {result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-1">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300 block">
                    {result.errors.length} item(s) had warnings or issues:
                  </span>
                  <ul className="text-[11px] text-red-600 dark:text-red-400 space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* View 4: Error during import */}
          {status === 'error' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Import Failed
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 max-w-sm">
                {errorMessage || 'An error occurred while importing your vault.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          {status === 'idle' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartImport}
                disabled={selectedFiles.length === 0}
                className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Import {selectedFiles.length > 0 ? `(${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})` : ''}
              </button>
            </>
          )}

          {status === 'importing' && (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              Please wait...
            </span>
          )}

          {status === 'completed' && (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
            >
              Done
            </button>
          )}

          {status === 'error' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="px-3.5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
