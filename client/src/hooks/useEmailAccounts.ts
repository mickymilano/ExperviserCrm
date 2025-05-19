import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
        // Nessun account preconfiguraro - permettiamo all'utente di aggiungere i propri account
        return [];

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

/**
 * Interfaccia per i dati necessari per creare un nuovo account email
 */
export interface CreateEmailAccountData {
  name: string;
  email: string;
  password: string;
  provider: string;
  serverSettings?: {
    incomingServer: string;
    incomingPort: number;
    outgoingServer: string;
    outgoingPort: number;
    security: 'none' | 'ssl' | 'tls';
  };
}

/**
 * Hook per creare un nuovo account email
 */
export function useCreateEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEmailAccountData) => {
      // In un ambiente reale, questa sarebbe una chiamata API
      // Per ora, simuliamo la risposta
      return {
        success: true,
        account: {
          id: Math.floor(Math.random() * 1000) + 3,
          name: data.name,
          email: data.email,
          provider: data.provider,
          isDefault: false,
          userId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      // Versione per ambiente di produzione:
      // return apiRequest('POST', '/api/email/accounts', data);
    },
    onSuccess: () => {
      // Invalida la cache degli account email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
    }
  });
}

/**
 * Hook per eliminare un account email
 */
export function useDeleteEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountId: number) => {
      // In un ambiente reale, questa sarebbe una chiamata API
      // Per ora, simuliamo la risposta
      return {
        success: true,
        message: 'Account email eliminato con successo'
      };
      
      // Versione per ambiente di produzione:
      // return apiRequest('DELETE', `/api/email/accounts/${accountId}`);
    },
    onSuccess: () => {
      // Invalida la cache degli account email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
    }
  });
}

/**
 * Hook per aggiornare un account email
 */
export function useUpdateEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<EmailAccount> }) => {
      // In un ambiente reale, questa sarebbe una chiamata API
      // Per ora, simuliamo la risposta
      return {
        success: true,
        account: {
          id,
          ...data,
          updatedAt: new Date().toISOString()
        }
      };
      
      // Versione per ambiente di produzione:
      // return apiRequest('PATCH', `/api/email/accounts/${id}`, data);
    },
    onSuccess: () => {
      // Invalida la cache degli account email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
    }
  });
}