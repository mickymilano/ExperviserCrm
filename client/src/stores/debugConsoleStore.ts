import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definizione dello stato dello store
interface DebugConsoleState {
  isVisible: boolean;
  toggleVisibility: () => void;
  
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
  
  size: { width: number; height: number };
  setSize: (size: { width: number; height: number }) => void;
  
  isMinimized: boolean;
  toggleMinimized: () => void;
  
  isFilterPanelOpen: boolean;
  toggleFilterPanel: () => void;
}

// Crea lo store con zustand
export const useDebugConsoleStore = create<DebugConsoleState>()(
  persist(
    (set) => ({
      // Stato iniziale
      isVisible: false,
      position: { x: 16, y: 16 },
      size: { width: 700, height: 400 },
      isMinimized: false,
      isFilterPanelOpen: true,
      
      // Azioni
      toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
      
      setPosition: (position) => set({ position }),
      
      setSize: (size) => set({ size }),
      
      toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
      
      toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
    }),
    {
      name: 'debug-console-storage',
    }
  )
);