import { useQuery } from "@tanstack/react-query";

/**
 * Hook per recuperare gli account email dell'utente
 * @returns Oggetto con i dati degli account e lo stato di caricamento
 */
export function useAccounts() {
  return useQuery({
    queryKey: ['/api/email/accounts'],
    queryFn: async () => {
      try {
        // In fase di sviluppo, simula account predefiniti se l'API non risponde
        const isDev = process.env.NODE_ENV === 'development';
        
        const response = await fetch('/api/email/accounts');
        
        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } else if (isDev) {
          // Dati di esempio per lo sviluppo
          return [
            {
              id: 1,
              name: 'Account Aziendale',
              email: 'info@experviser.com',
              provider: 'gmail',
              isActive: true,
              lastSyncedAt: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'Account Supporto',
              email: 'support@experviser.com',
              provider: 'outlook',
              isActive: true,
              lastSyncedAt: new Date().toISOString(),
            }
          ];
        }
        
        return [];
      } catch (error) {
        console.error("[useQuery] Error fetching /api/email/accounts:", error);
        
        // In fase di sviluppo, restituisci account fittizi per testing UI
        if (process.env.NODE_ENV === 'development') {
          return [
            {
              id: 1,
              name: 'Account Aziendale',
              email: 'info@experviser.com',
              provider: 'gmail',
              isActive: true,
              lastSyncedAt: new Date().toISOString(),
            }
          ];
        }
        
        return [];
      }
    },
    refetchOnWindowFocus: false
  });
}