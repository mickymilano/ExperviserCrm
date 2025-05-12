import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export default function useTheme() {
  // Lo stato del tema è memorizzato sia nello stato interno che in localStorage
  const [theme, setThemeState] = useState<Theme>(() => {
    // Controlla se esiste un tema salvato nel localStorage
    const savedTheme = localStorage.getItem('experviser-theme');
    
    // Se c'è un tema salvato, usalo, altrimenti usa la preferenza del sistema o 'light' come fallback
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Controlla le preferenze di sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Funzione per cambiare il tema
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('experviser-theme', newTheme);
  };

  // Applica il tema al documento
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Rimuovi la classe opposta e aggiungi quella corretta
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return { theme, setTheme };
}