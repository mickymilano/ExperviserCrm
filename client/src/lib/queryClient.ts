import { QueryClient } from '@tanstack/react-query';
import type { QueryFunction } from '@tanstack/react-query';
import { showSuccessNotification, showErrorNotification } from './notification';

// Funzione per fare le chiamate API
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  customOptions: RequestInit = {}
): Promise<any> {
  // Recupera il token da localStorage
  const token = localStorage.getItem("auth_token");
  
  // In modalità development, se non c'è un token e il token non è stato richiesto
  // in precedenza (prima richiesta), possiamo generare un token temporaneo
  if (!token && process.env.NODE_ENV === 'development') {
    const tempToken = "dev-temp-token";
    localStorage.setItem("auth_token", tempToken);
    console.log("Token temporaneo generato per sviluppo");
  }

  // Rileggiamo il token (nel caso sia stato appena creato)
  const currentToken = localStorage.getItem("auth_token");

  // Assicuriamoci che l'endpoint inizi con / se non lo fa già
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Costruiamo l'URL completo
  const url = normalizedEndpoint;

  console.log(`API Request: ${method} ${url}`, data);

  // Opzioni predefinite per le richieste
  const defaultOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Include il token di autenticazione se presente
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
    },
    credentials: 'include', // Per inviare/ricevere cookies
    ...(data ? { body: JSON.stringify(data) } : {})
  };
  
  // Merge delle opzioni
  const fetchOptions = {
    ...defaultOptions,
    ...customOptions,
    headers: {
      ...defaultOptions.headers,
      ...(customOptions.headers || {}),
    },
  };
  
  // Verifica se è una operazione di salvataggio (operazione di scrittura)
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Se la risposta non è ok, lanciamo un errore
    if (!response.ok) {
      // In modalità development, gestiamo alcune richieste in modo speciale
      if (process.env.NODE_ENV === 'development') {
        // Se siamo in sviluppo e la chiamata è per verificare l'utente attuale
        if (url === '/api/auth/me' && response.status === 401) {
          console.log('Simulazione autenticazione in modalità sviluppo');
          
          // Ritorna un utente fittizio per lo sviluppo
          return {
            id: 1,
            username: 'admin',
            email: 'admin@experviser.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'super_admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date()
          };
        }
      }
      
      // Proviamo a leggere l'errore come JSON
      try {
        const errorData = await response.json();
        const errorMessage = errorData.message || `Errore API ${response.status}`;
        
        // Mostra notifica di errore per operazioni di scrittura
        if (isWriteOperation) {
          showErrorNotification(`Errore durante il salvataggio: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      } catch (e) {
        // Se non possiamo analizzare la risposta come JSON, lanciamo un errore generico
        const errorMessage = `Errore API ${response.status}`;
        
        // Mostra notifica di errore per operazioni di scrittura
        if (isWriteOperation) {
          showErrorNotification(`Errore durante il salvataggio: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }
    }
    
    // Mostra notifica di successo per operazioni di scrittura
    if (isWriteOperation) {
      // Determina il tipo di operazione
      let successMessage = 'Operazione completata';
      
      // Mappiamo il tipo di operazione a un messaggio specifico
      if (method === 'POST') {
        successMessage = 'Creazione completata';
      } else if (method === 'PUT') {
        successMessage = 'Aggiornamento completato';
      } else if (method === 'PATCH') {
        successMessage = 'Salvataggio completato';
      } else if (method === 'DELETE') {
        successMessage = 'Eliminazione completata';
      }
      
      showSuccessNotification(successMessage);
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
    
    // Mostra notifica di errore per operazioni di scrittura (se non catturato sopra)
    if (isWriteOperation && error instanceof Error) {
      showErrorNotification(`Errore durante il salvataggio: ${error.message}`);
    }
    
    throw error;
  }
}

// Opzioni predefinite per le mutazioni
export const defaultMutationOptions = {
  onError: (error: Error) => {
    console.error('Mutation error:', error);
    // Già gestito nella funzione apiRequest
  }
};

// Fetcher predefinito per React Query
const defaultQueryFn: QueryFunction = async (context) => {
  // Usiamo il primo elemento della queryKey come URL
  const url = context.queryKey[0] as string;
  return apiRequest("GET", url);
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