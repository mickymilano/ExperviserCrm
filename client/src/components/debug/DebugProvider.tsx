import { useEffect } from 'react';
import { useDebugLogs } from '@/hooks/useDebugLogs';
import { useDebugConsoleStore } from '@/stores/debugConsoleStore';
import { initializeApiMonitoring } from '@/lib/monitoredFetch';
import { debugContext } from '@/lib/debugContext';

interface DebugProviderProps {
  children: React.ReactNode;
}

/**
 * Provider che inizializza e gestisce il sistema di debug dell'applicazione.
 * Questo componente deve essere inserito vicino alla radice dell'albero dei componenti
 * per intercettare errori e fornire funzionalità di debug a tutta l'applicazione.
 */
export default function DebugProvider({ children }: DebugProviderProps) {
  // Accedi all'hook per i log e allo store della console
  const debugLogs = useDebugLogs();
  const { showConsole } = useDebugConsoleStore();
  
  // Inizializza il sistema di debug al mount del componente
  useEffect(() => {
    // Installa il monitoraggio globale delle API
    initializeApiMonitoring();
    
    // Installa gli override della console direttamente dal context
    const resetConsole = debugContext.installConsoleOverrides();
    
    // Log iniziale per verificare il funzionamento
    debugContext.logInfo('Debug Console inizializzata', {
      time: new Date().toISOString(),
      environment: import.meta.env.MODE,
      userAgent: navigator.userAgent
    }, { component: 'DebugProvider' });
    
    // In ambiente di sviluppo, aggiungiamo alcuni log di esempio
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      // Simula alcuni eventi di logging
      setTimeout(() => {
        debugContext.logInfo('Applicazione avviata correttamente', {
          version: '1.0.0',
          buildDate: '2025-05-16',
          environment: import.meta.env.MODE
        }, { component: 'AppStartup' });
        
        debugContext.logDebug('Stato sessione utente', {
          authenticated: true,
          sessionStarted: new Date().toISOString()
        }, { component: 'Authentication' });
        
        // Simula errori e avvisi
        setTimeout(() => {
          // Genera alcuni log per popolare la console
          debugContext.logWarning('Prestazioni API lente', {
            endpoint: '/api/customers',
            responseTime: '2.5s',
            threshold: '1.0s'
          }, { component: 'APIMonitor' });
          
          debugContext.logError('Errore durante il caricamento dei dati', {
            resource: '/api/dashboard/stats',
            status: 404,
            message: 'Resource not found'
          }, { component: 'DataLoader', reportToSentry: false });
          
          // Mostra la console dopo un breve ritardo
          setTimeout(() => {
            showConsole();
          }, 500);
        }, 1000);
      }, 1000);
    }
    
    // Cleanup: ripristina i metodi originali della console
    return () => {
      resetConsole();
    };
  }, [showConsole]);
  
  // Il provider non renderizza nulla di aggiuntivo, solo i children
  return <>{children}</>;
}