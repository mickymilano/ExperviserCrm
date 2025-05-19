import { useQuery } from '@tanstack/react-query';

export interface EmailAccount {
  id: number;
  userId: number;
  email: string;
  name?: string;
  provider: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAccounts() {
  return useQuery({
    queryKey: ['/api/email/accounts'],
    queryFn: async () => {
      const response = await fetch('/api/email/accounts');
      if (!response.ok) {
        throw new Error('Errore nel recupero degli account email');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
}