import { QueryClient } from '@tanstack/react-query';

// Funzione per fare le chiamate API
export async function apiRequest(
  url: string, 
  options: RequestInit = {}
): Promise<any> {
  // Opzioni predefinite per le richieste
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Per inviare/ricevere cookies
  };
  
  // Merge delle opzioni
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Se la risposta non è ok, lanciamo un errore
    if (!response.ok) {
      // Proviamo a leggere l'errore come JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Errore API ${response.status}`);
      } catch (e) {
        // Se non possiamo analizzare la risposta come JSON, lanciamo un errore generico
        throw new Error(`Errore API ${response.status}`);
      }
    }
    
    // Controlliamo se la risposta contiene dati JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Restituisci la risposta come testo in caso contrario
    return await response.text();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Opzioni predefinite per le mutazioni
export const defaultMutationOptions = {
  onError: (error: Error) => {
    console.error('Mutation error:', error);
    // Qui potremmo mostrare una notifica/toast di errore
  }
};

// Fetcher predefinito per React Query
const defaultQueryFn = async ({ queryKey }: { queryKey: unknown[] }) => {
  // Usiamo il primo elemento della queryKey come URL
  const url = queryKey[0] as string;
  return apiRequest(url);
};

// Crea l'istanza di QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});