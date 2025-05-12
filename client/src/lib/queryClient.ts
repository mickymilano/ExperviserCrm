import { QueryClient } from '@tanstack/react-query';

const apiRoot = '/api';

function handleResponse(response: Response) {
  if (!response.ok) {
    // Verifica se la risposta contiene un formato JSON con un messaggio di errore
    return response.json().then(data => {
      throw new Error(data.message || 'Si è verificato un errore');
    }).catch(err => {
      if (err instanceof SyntaxError) {
        // Se non è JSON valido, usa il testo di stato HTTP
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      throw err;
    });
  }
  
  // Per le risposte non-200, cerchiamo di ottenere dati JSON
  return response.json().catch(() => ({}));
}

export async function apiRequest(
  endpoint: string,
  { body, method = 'GET', headers = {} }: { 
    body?: any; 
    method?: string; 
    headers?: Record<string, string>;
  } = {}
) {
  // Combina l'endpoint con il root API
  const url = `${apiRoot}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Prepara le opzioni di richiesta
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Invia i cookie con le richieste
  };
  
  // Aggiungi il corpo alla richiesta se fornito
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  // Esegui la richiesta fetch e gestisci la risposta
  const response = await fetch(url, options);
  return handleResponse(response);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti
      retry: 1, // Riprova una volta in caso di errore
      queryFn: async ({ queryKey }) => {
        const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
        
        if (typeof url !== 'string') {
          throw new Error('Invalid query key');
        }
        
        return apiRequest(url);
      },
    },
  },
});