
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type LayoutPosition = 'sidebar' | 'top';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  layoutPosition: LayoutPosition;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setLayoutPosition: (position: LayoutPosition) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [layoutPosition, setLayoutPositionState] = useState<LayoutPosition>('sidebar');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    // Carregar configurações salvas
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLayout = localStorage.getItem('layoutPosition') as LayoutPosition;
    const savedFontSize = localStorage.getItem('fontSize') as FontSize;

    if (savedTheme) setThemeState(savedTheme);
    if (savedLayout) setLayoutPositionState(savedLayout);
    if (savedFontSize) setFontSizeState(savedFontSize);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setLayoutPosition = (position: LayoutPosition) => {
    setLayoutPositionState(position);
    localStorage.setItem('layoutPosition', position);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      layoutPosition,
      fontSize,
      setTheme,
      setLayoutPosition,
      setFontSize,
    }}>
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
