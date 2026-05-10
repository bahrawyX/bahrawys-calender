'use client';

import React from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDom(
  resolvedTheme: ResolvedTheme,
  attribute: 'class' | 'data-theme',
  disableTransitionOnChange: boolean,
): void {
  const root = document.documentElement;

  let styleEl: HTMLStyleElement | null = null;
  if (disableTransitionOnChange) {
    styleEl = document.createElement('style');
    styleEl.textContent = '* { transition: none !important; }';
    document.head.appendChild(styleEl);
  }

  if (attribute === 'class') {
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  } else {
    root.setAttribute('data-theme', resolvedTheme);
  }

  // Set color-scheme for native browser elements (scrollbars, form controls)
  root.style.colorScheme = resolvedTheme;

  if (styleEl) {
    requestAnimationFrame(() => {
      styleEl?.remove();
    });
  }
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('dark');

  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = stored ?? defaultTheme;
    const initialResolved =
      initialTheme === 'system'
        ? (enableSystem ? getSystemTheme() : 'dark')
        : initialTheme;

    setThemeState(initialTheme);
    setResolvedTheme(initialResolved);
    applyThemeToDom(initialResolved, attribute, disableTransitionOnChange);
  }, [attribute, defaultTheme, disableTransitionOnChange, enableSystem, storageKey]);

  React.useEffect(() => {
    if (!enableSystem || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const nextResolved = getSystemTheme();
      setResolvedTheme(nextResolved);
      applyThemeToDom(nextResolved, attribute, disableTransitionOnChange);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [attribute, disableTransitionOnChange, enableSystem, theme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      localStorage.setItem(storageKey, nextTheme);

      const nextResolved =
        nextTheme === 'system'
          ? (enableSystem ? getSystemTheme() : 'dark')
          : nextTheme;

      setResolvedTheme(nextResolved);
      applyThemeToDom(nextResolved, attribute, disableTransitionOnChange);
    },
    [attribute, disableTransitionOnChange, enableSystem, storageKey],
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
