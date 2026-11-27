'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore, type ReactNode } from 'react';
import { useTheme } from './ThemeProvider';

const emptySubscribe = () => () => {};

export function ThemeToggle(): ReactNode {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();

  if (!isMounted) {
    return (
      <button
        type="button"
        suppressHydrationWarning
        className="p-1.5 text-slate-400 dark:text-slate-500 rounded-md transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <span className="inline-block w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

