import { create } from 'zustand';

interface DebugConsoleState {
  isVisible: boolean;
  isMinimized: boolean;
  activeTab: 'logs' | 'network' | 'performance' | 'settings';
  toggleVisibility: () => void;
  toggleMinimize: () => void;
  setActiveTab: (tab: 'logs' | 'network' | 'performance' | 'settings') => void;
}

export const useDebugConsoleStore = create<DebugConsoleState>((set) => ({
  isVisible: false,
  isMinimized: false,
  activeTab: 'logs',
  
  toggleVisibility: () => set((state) => ({ 
    isVisible: !state.isVisible,
    // Quando riapriamo la console, la riportiamo in visualizzazione completa
    isMinimized: state.isVisible ? state.isMinimized : false 
  })),
  
  toggleMinimize: () => set((state) => ({ 
    isMinimized: !state.isMinimized 
  })),
  
  setActiveTab: (activeTab) => set({ activeTab }),
}));