import { useQuery } from '@tanstack/react-query';

export interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  isActive: boolean;
  lastSyncedAt?: string;
  syncFrequency?: number;
}

/**
 * Hook per recuperare gli account email configurati
 */
export function useAccounts() {
  // In una versione di produzione, questo useQuery chiamerebbe le API
  // Per ora implementiamo una versione fittizia con dati simulati
  
  return useQuery({
    queryKey: ['/api/email/accounts'],
    queryFn: async () => {
      // In modalità di produzione, questo sarebbe un fetch reale
      // return await fetch('/api/email/accounts').then(res => res.json());
      
      // Per ora, restituiamo dati simulati
      const mockAccounts: EmailAccount[] = [
        {
          id: 1,
          name: 'Account Aziendale',
          email: 'info@experviser.com',
          provider: 'gmail',
          isActive: true,
          lastSyncedAt: new Date().toISOString(),
          syncFrequency: 15 // minuti
        },
        {
          id: 2,
          name: 'Account Supporto',
          email: 'support@experviser.com',
          provider: 'outlook',
          isActive: true,
          lastSyncedAt: new Date().toISOString(),
          syncFrequency: 30 // minuti
        }
      ];
      
      return mockAccounts;
    },
    staleTime: 5 * 60 * 1000 // 5 minuti
  });
}

/**
 * Hook per recuperare un account email specifico per ID
 */
export function useAccount(id: number) {
  const { data: accounts } = useAccounts();
  
  return useQuery({
    queryKey: ['/api/email/accounts', id],
    queryFn: async () => {
      // In modalità di produzione questo sarebbe un fetch reale
      // return await fetch(`/api/email/accounts/${id}`).then(res => res.json());
      
      // Per ora, filtriamo dai dati simulati
      if (accounts) {
        const account = accounts.find(acc => acc.id === id);
        if (account) return account;
      }
      
      throw new Error('Account non trovato');
    },
    enabled: !!id && !!accounts,
    staleTime: 5 * 60 * 1000 // 5 minuti
  });
}