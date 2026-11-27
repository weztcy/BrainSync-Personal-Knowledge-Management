'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('brainsync-theme');
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

function getServerSnapshot(): Theme {
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }): ReactNode {
  const theme = useSyncExternalStore(subscribe, getStoredTheme, getServerSnapshot);

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem('brainsync-theme', newTheme);
    window.dispatchEvent(new Event('storage'));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function apply() {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const isServer = typeof window === 'undefined';
  const isSystemDark = !isServer && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme: 'light' | 'dark' =
    theme === 'dark' || (theme === 'system' && isSystemDark) ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

