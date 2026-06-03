import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';
type LayoutPosition = 'sidebar' | 'top';
type FontSize = 'small' | 'medium' | 'large';

const THEME_STORAGE_KEY = 'app-theme';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  layoutPosition: LayoutPosition;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLayoutPosition: (position: LayoutPosition) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
      return storedTheme;
    }
  } catch {
    // Mantém fallback do sistema se localStorage estiver indisponível.
  }

  return 'system';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return resolveTheme(theme);

  const resolvedTheme = resolveTheme(theme);
  const root = window.document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getInitialTheme()));
  const [layoutPosition, setLayoutPosition] = useState<LayoutPosition>('sidebar');
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignora ambientes sem persistência local.
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setResolvedTheme(applyTheme(theme));

    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => setResolvedTheme(applyTheme('system'));

    media.addEventListener('change', handleSystemThemeChange);
    return () => media.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${fontSize}`);
  }, [fontSize]);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    layoutPosition,
    fontSize,
    setTheme,
    toggleTheme,
    setLayoutPosition,
    setFontSize,
  }), [theme, resolvedTheme, layoutPosition, fontSize]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
