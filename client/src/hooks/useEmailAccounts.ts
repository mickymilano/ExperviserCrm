import { useQuery } from '@tanstack/react-query';

export interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook per recuperare gli account email configurati nel sistema
 * Utile per selezionare l'account da usare per inviare email
 */
export function useEmailAccounts() {
  return useQuery({
    queryKey: ['/api/email/accounts'],
    queryFn: async () => {
      try {
        // Simulazione temporanea fino all'implementazione del backend reale
        return [
          {
            id: 1,
            name: 'Gmail',
            email: 'user@gmail.com',
            provider: 'gmail',
            isDefault: true,
            userId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Outlook',
            email: 'user@outlook.com',
            provider: 'outlook',
            isDefault: false,
            userId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        // Implementazione reale da attivare quando il backend sarà pronto
        /*
        const response = await fetch('/api/email/accounts');
        if (!response.ok) {
          throw new Error('Errore nel caricamento degli account email');
        }
        return response.json();
        */
      } catch (error) {
        console.error('Error fetching email accounts:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
}