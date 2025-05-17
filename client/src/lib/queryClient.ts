import { QueryClient } from "@tanstack/react-query";

// Configurazione predefinita per i client delle query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurazione standard per tutte le query
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minuto
      queryFn: async ({ queryKey }) => {
        // Supporta i queryKey di tipo array
        const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
        
        if (typeof url !== 'string') {
          throw new Error(`Query key must be a string or an array with a string as the first element, got: ${queryKey}`);
        }
        
        const response = await fetch(url, {
          credentials: 'include', // Includi i cookie per l'autenticazione
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Handle empty responses
        const text = await response.text();
        return text ? JSON.parse(text) : undefined;
      },
    },
  },
});