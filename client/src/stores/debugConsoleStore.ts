import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { debugContext } from '../lib/debugContext';

interface DebugConsoleState {
  isVisible: boolean;
  isMinimized: boolean;
  activeTab: 'logs' | 'network' | 'performance' | 'settings';
  toggleVisibility: () => void;
  toggleMinimize: () => void;
  setActiveTab: (tab: 'logs' | 'network' | 'performance' | 'settings') => void;
  showConsole: () => void;
  hideConsole: () => void;
}

// Create the store with persistence to maintain visibility between refreshes
export const useDebugConsoleStore = create<DebugConsoleState>()(
  persist(
    (set) => ({
      // Impostiamo inizialmente a true per verificare che funzioni
      isVisible: true,
      isMinimized: false,
      activeTab: 'logs',
      
      toggleVisibility: () => {
        set((state) => {
          const newState = { 
            isVisible: !state.isVisible,
            // Quando riapriamo la console, la riportiamo in visualizzazione completa
            isMinimized: state.isVisible ? state.isMinimized : false 
          };
          
          debugContext.logInfo('Debug Console visibilità modificata', { 
            isVisible: newState.isVisible
          }, { component: 'DebugConsoleStore' });
          
          return newState;
        });
      },
      
      showConsole: () => {
        set({ isVisible: true, isMinimized: false });
        debugContext.logInfo('Debug Console mostrata', {}, { component: 'DebugConsoleStore' });
      },
      
      hideConsole: () => {
        set({ isVisible: false });
        debugContext.logInfo('Debug Console nascosta', {}, { component: 'DebugConsoleStore' });
      },
      
      toggleMinimize: () => {
        set((state) => {
          const newState = { isMinimized: !state.isMinimized };
          debugContext.logInfo('Debug Console minimizzazione modificata', { 
            isMinimized: newState.isMinimized
          }, { component: 'DebugConsoleStore' });
          return newState;
        });
      },
      
      setActiveTab: (activeTab) => {
        set({ activeTab });
        debugContext.logInfo('Debug Console tab modificato', { 
          activeTab
        }, { component: 'DebugConsoleStore' });
      },
    }),
    {
      name: 'debug-console-state',
      partialize: (state) => ({ 
        isVisible: state.isVisible,
        isMinimized: state.isMinimized,
        activeTab: state.activeTab
      }),
    }
  )
);