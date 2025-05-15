import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from "@sentry/react";

// Definizioni dei tipi
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'log';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
  component?: string;
  stack?: string;
}

interface LogFilter {
  level?: LogLevel[];
  component?: string[];
  search?: string;
}

interface DebugLogsState {
  logs: LogEntry[];
  maxLogs: number;
  logFilter: LogFilter;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setLogFilter: (filter: LogFilter) => void;
}

// Store Zustand per i log
const useDebugLogsStore = create<DebugLogsState>((set) => ({
  logs: [],
  maxLogs: 1000, // Limite massimo di log conservati
  logFilter: {},
  
  addLog: (log) => set((state) => {
    // Crea un nuovo log con ID e timestamp
    const newLog: LogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...log,
    };
    
    // Aggiungi il log e mantieni solo gli ultimi maxLogs
    const updatedLogs = [newLog, ...state.logs].slice(0, state.maxLogs);
    
    return { logs: updatedLogs };
  }),
  
  clearLogs: () => set({ logs: [] }),
  
  setLogFilter: (filter) => set({ logFilter: filter }),
}));

// Hook personalizzato che espone le funzionalità di logging
export function useDebugLogs() {
  const { logs, addLog, clearLogs, logFilter, setLogFilter } = useDebugLogsStore();
  
  // Funzione per registrare un errore
  const logError = (
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ) => {
    const error = details instanceof Error ? details : new Error(message);
    const stack = error.stack;
    
    addLog({
      level: 'error',
      message,
      details: details instanceof Error ? error.message : details,
      component: options?.component,
      stack
    });
    
    // Opzionalmente invia a Sentry
    if (options?.reportToSentry !== false) {
      Sentry.captureException(error, {
        extra: {
          details,
          component: options?.component
        }
      });
    }
    
    // Log sulla console nativa per debug
    console.error(`[${options?.component || 'App'}]`, message, details);
  };
  
  // Funzione per registrare un warning
  const logWarning = (
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ) => {
    addLog({
      level: 'warn',
      message,
      details,
      component: options?.component
    });
    
    // Opzionalmente invia a Sentry
    if (options?.reportToSentry !== false) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: {
          details,
          component: options?.component
        }
      });
    }
    
    // Log sulla console nativa per debug
    console.warn(`[${options?.component || 'App'}]`, message, details);
  };
  
  // Funzione per registrare un'informazione
  const logInfo = (
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ) => {
    addLog({
      level: 'info',
      message,
      details,
      component: options?.component
    });
    
    // Opzionalmente invia a Sentry solo in casi selezionati
    if (options?.reportToSentry) {
      Sentry.captureMessage(message, {
        level: 'info',
        extra: {
          details,
          component: options?.component
        }
      });
    }
    
    // Log sulla console nativa per debug
    console.info(`[${options?.component || 'App'}]`, message, details);
  };
  
  // Funzione per registrare un messaggio di debug
  const logDebug = (
    message: string, 
    details?: any, 
    options?: { component?: string }
  ) => {
    addLog({
      level: 'debug',
      message,
      details,
      component: options?.component
    });
    
    // Log sulla console nativa per debug
    console.debug(`[${options?.component || 'App'}]`, message, details);
  };

  // Funzione per registrare una metrica di performance
  const logPerformance = async <T>(
    name: string,
    operation: () => Promise<T>,
    options?: { component?: string, reportToSentry?: boolean }
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      // Esegui l'operazione
      const result = await operation();
      
      // Calcola il tempo di esecuzione
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Registra la metrica
      addLog({
        level: 'info',
        message: `Performance: ${name} completed in ${duration.toFixed(2)}ms`,
        details: { duration, name },
        component: options?.component || 'Performance'
      });
      
      return result;
    } catch (error) {
      // In caso di errore, registra l'errore
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logError(
        `Performance: ${name} failed after ${duration.toFixed(2)}ms`,
        error,
        { component: options?.component || 'Performance', reportToSentry: options?.reportToSentry }
      );
      
      throw error;
    }
  };
  
  // Override globale dei metodi console (opzionale, attivabile con un flag)
  const installGlobalConsoleOverrides = () => {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      log: console.log,
    };
    
    // Sostituisci i metodi della console
    console.error = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string' && message.startsWith('[')) {
        // Già loggato dal nostro sistema, passa al metodo originale
        originalConsole.error(...args);
        return;
      }
      
      logError(
        typeof message === 'string' ? message : 'Error object',
        rest.length > 0 ? rest : message
      );
      
      // Chiama il metodo originale per mantenere i log nella console del browser
      originalConsole.error(...args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string' && message.startsWith('[')) {
        // Già loggato dal nostro sistema, passa al metodo originale
        originalConsole.warn(...args);
        return;
      }
      
      logWarning(
        typeof message === 'string' ? message : 'Warning object',
        rest.length > 0 ? rest : message
      );
      
      // Chiama il metodo originale
      originalConsole.warn(...args);
    };
    
    console.info = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string' && message.startsWith('[')) {
        // Già loggato dal nostro sistema, passa al metodo originale
        originalConsole.info(...args);
        return;
      }
      
      logInfo(
        typeof message === 'string' ? message : 'Info object',
        rest.length > 0 ? rest : message
      );
      
      // Chiama il metodo originale
      originalConsole.info(...args);
    };
    
    console.debug = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string' && message.startsWith('[')) {
        // Già loggato dal nostro sistema, passa al metodo originale
        originalConsole.debug(...args);
        return;
      }
      
      logDebug(
        typeof message === 'string' ? message : 'Debug object',
        rest.length > 0 ? rest : message
      );
      
      // Chiama il metodo originale
      originalConsole.debug(...args);
    };
    
    // Restituisci una funzione per ripristinare i metodi originali
    return () => {
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      console.log = originalConsole.log;
    };
  };
  
  return {
    logs,
    logFilter,
    setLogFilter,
    clearLogs,
    logError,
    logWarning,
    logInfo,
    logDebug,
    logPerformance,
    installGlobalConsoleOverrides,
  };
}