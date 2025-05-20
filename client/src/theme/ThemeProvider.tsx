import React, { createContext, useContext, useEffect, useState } from "react";

// Tipi per il tema
type Theme = "light" | "dark" | "system";

// Proprietà del componente ThemeProvider
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Stato del contesto del tema
interface ThemeContextState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Stato iniziale del contesto
const initialState: ThemeContextState = {
  theme: "light", // Default sempre light per EXPERVISER
  setTheme: () => null,
};

// Creazione del contesto
const ThemeContext = createContext<ThemeContextState>(initialState);

// Hook per utilizzare il tema
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve essere usato all'interno di un ThemeProvider");
  }
  return context;
}

// Componente ThemeProvider
export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "experviser-theme",
  ...props
}: ThemeProviderProps) {
  // Stato del tema
  const [theme, setTheme] = useState<Theme>(() => {
    // Recupera il tema dal localStorage oppure usa il default
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
    }
    
    return defaultTheme;
  });

  // Effetto per applicare il tema
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Rimuovi le classi di tema precedenti
    root.classList.remove("light", "dark");
    
    // Applica il tema corrente
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Salva il tema nel localStorage
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  // Valore del contesto
  const contextValue = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    },
  };

  // Render del provider
  return (
    <ThemeContext.Provider {...props} value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}