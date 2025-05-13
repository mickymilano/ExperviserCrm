import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  // Ottieni il tema dal localStorage o usa 'system' come default
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
    }
    return 'system';
  });

  // Applica il tema alla classe del documento
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Rimuovi le classi di tema esistenti
    root.classList.remove('light', 'dark');
    
    // Ottieni la preferenza del sistema
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    
    // Applica il tema
    if (theme === 'system') {
      root.classList.add(systemTheme);
      localStorage.removeItem('theme');
    } else {
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Aggiungi un listener per i cambiamenti della preferenza del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}