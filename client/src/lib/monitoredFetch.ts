import { debugContext } from './debugContext';

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
  
  try {
    // Log della richiesta
    debugContext.logInfo(`API Request: ${options.method || 'GET'} ${url}`, {
      headers: options.headers,
      body: options.body
    }, { component: 'APIClient' });
    
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
      
      debugContext.logError(`API Error: ${options.method || 'GET'} ${url} (${response.status})`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        duration
      }, { component: 'APIClient' });
    } else {
      debugContext.logInfo(`API Success: ${options.method || 'GET'} ${url} (${response.status})`, {
        status: response.status,
        duration
      }, { component: 'APIClient' });
    }
    
    return response;
  } catch (error) {
    // Calcola il tempo di esecuzione anche in caso di errore
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log dell'errore
    debugContext.logError(`API Exception: ${options.method || 'GET'} ${url}`, {
      error,
      duration
    }, { component: 'APIClient' });
    
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
 */
export const initializeApiMonitoring = () => {
  // Sostituisce l'implementazione di default con quella connessa al sistema di log
  queryErrorHandler = (error: unknown) => {
    debugContext.logError('Query error', error, {
      component: 'React Query'
    });
  };
  
  debugContext.logInfo('API Monitoring initialized', {
    timestamp: new Date().toISOString()
  }, { component: 'APIMonitor' });
};