import { useState, useEffect, useCallback } from 'react';
import { debugContext, type LogEntry } from '@/lib/debugContext';

// Hook che espone le funzionalità di logging alla UI React
export function useDebugLogs() {
  // Stato locale per i log
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Abbonati ai cambiamenti del debugContext
  useEffect(() => {
    const unsubscribe = debugContext.subscribe(setLogs);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Wrapper per le funzionalità del debugContext
  const logError = useCallback((
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ) => {
    debugContext.logError(message, details, options);
  }, []);
  
  const logWarning = useCallback((
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ) => {
    debugContext.logWarning(message, details, options);
  }, []);
  
  const logInfo = useCallback((
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ) => {
    debugContext.logInfo(message, details, options);
  }, []);
  
  const logDebug = useCallback((
    message: string, 
    details?: any, 
    options?: { component?: string }
  ) => {
    debugContext.logDebug(message, details, options);
  }, []);
  
  const clearLogs = useCallback(() => {
    debugContext.clearLogs();
  }, []);
  
  // Funzione per monitorare operazioni asincrone e registrarne le performance
  const logPerformance = useCallback(async <T,>(
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
      debugContext.logInfo(`Performance: ${name} completed in ${duration.toFixed(2)}ms`, 
        { duration, name, success: true },
        { component: options?.component || 'Performance' }
      );
      
      return result;
    } catch (error) {
      // In caso di errore, registra l'errore
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      debugContext.logError(
        `Performance: ${name} failed after ${duration.toFixed(2)}ms`,
        error,
        { component: options?.component || 'Performance', reportToSentry: options?.reportToSentry }
      );
      
      throw error;
    }
  }, []);
  
  // Sovrascrive i metodi della console
  const installGlobalConsoleOverrides = useCallback(() => {
    return debugContext.installConsoleOverrides();
  }, []);

  // Hook fittizio per compatibilità, ma non fa niente perché
  // setLogFilter è ora gestito esternamente
  const setLogFilter = useCallback((filter: any) => {
    // Nessuna operazione, la funzionalità è eliminata in questa versione
  }, []);
  
  return {
    logs,
    logFilter: {},
    setLogFilter,
    logError,
    logWarning,
    logInfo,
    logDebug,
    logPerformance,
    clearLogs,
    installGlobalConsoleOverrides,
  };
}