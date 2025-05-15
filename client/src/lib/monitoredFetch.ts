import { useDebugLogs } from '@/hooks/useDebugLogs';

/**
 * Wrapper per fetch che aggiunge il monitoraggio degli errori delle chiamate API.
 * 
 * @param url URL da chiamare
 * @param options Opzioni standard di fetch
 * @returns Promise con la risposta
 */
export async function monitoredFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const startTime = performance.now();
  
  // Estraiamo useDebugLogs al di fuori dei componenti React
  // In un'applicazione reale, questo sarebbe gestito tramite un pattern singleton
  // o un sistema di eventi per aggiornare i log
  const debug = { 
    logInfo: (msg: string, details?: any) => console.info(msg, details),
    logError: (msg: string, details?: any) => console.error(msg, details)
  };
  
  try {
    // Log della richiesta
    debug.logInfo(`API Request: ${options.method || 'GET'} ${url}`, {
      headers: options.headers,
      body: options.body
    });
    
    // Esegui la richiesta
    const response = await fetch(url, options);
    
    // Calcola il tempo di risposta
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log del risultato
    if (!response.ok) {
      let errorData: any = null;
      
      try {
        // Tenta di leggere il corpo della risposta di errore come JSON
        errorData = await response.clone().json();
      } catch (e) {
        try {
          // Se non è JSON, prova a leggere come testo
          errorData = await response.clone().text();
        } catch (textError) {
          // Se fallisce anche la lettura come testo, usa un valore predefinito
          errorData = "Impossibile leggere il corpo della risposta";
        }
      }
      
      debug.logError(`API Error: ${options.method || 'GET'} ${url} (${response.status})`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        duration
      });
    } else {
      debug.logInfo(`API Success: ${options.method || 'GET'} ${url} (${response.status})`, {
        status: response.status,
        duration
      });
    }
    
    return response;
  } catch (error) {
    // Calcola il tempo di esecuzione anche in caso di errore
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log dell'errore
    debug.logError(`API Exception: ${options.method || 'GET'} ${url}`, {
      error,
      duration
    });
    
    throw error; // Rilancia l'errore per permettere la gestione esterna
  }
}

/**
 * Versione JSON del monitoredFetch che gestisce automaticamente la 
 * deserializzazione della risposta e la gestione degli errori HTTP.
 */
export async function monitoredFetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await monitoredFetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json() as T;
}

/**
 * Hook globale per il monitoraggio delle richieste API in React Query
 * Da utilizzare nella configurazione di QueryClient
 */
export let queryErrorHandler = (error: unknown) => {
  // Implementazione di default, verrebbe sostituita a runtime
  console.error('Query error:', error);
};

/**
 * Inizializza il sistema di monitoraggio globale per le chiamate API
 * Da chiamare all'avvio dell'app
 */
export const initializeApiMonitoring = (debug: ReturnType<typeof useDebugLogs>) => {
  // Sostituisce l'implementazione di default con quella connessa al sistema di log
  queryErrorHandler = (error: unknown) => {
    debug.logError('Query error', error, {
      component: 'React Query'
    });
  };
  
  // In questa funzione si possono aggiungere altre configurazioni globali
  // come l'intercezione di axios, fetch, ecc.
};