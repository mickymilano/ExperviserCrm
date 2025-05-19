import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  serverSettings?: {
    incomingServer: string;
    incomingPort: number;
    outgoingServer: string;
    outgoingPort: number;
    security: 'none' | 'ssl' | 'tls';
  };
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
        // Utilizziamo l'API reale per recuperare gli account email
        const response = await fetch('/api/email/accounts');
        if (!response.ok) {
          throw new Error('Errore nel caricamento degli account email');
        }
        return response.json();
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
      // Utilizziamo l'API reale per creare un nuovo account email
      return apiRequest('POST', '/api/email/accounts', data);
    },
    onSuccess: () => {
      // Invalida la cache degli account email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      
      // Mostra una notifica di successo
      toast({
        title: "Account email aggiunto",
        description: "Il tuo account email è stato configurato correttamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore durante l'aggiunta dell'account email",
        description: error.message || "Controlla i dettagli dell'account e riprova",
        variant: "destructive",
      });
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
      // Utilizziamo l'API reale per eliminare l'account email
      return apiRequest('DELETE', `/api/email/accounts/${accountId}`);
    },
    onSuccess: () => {
      // Invalida la cache degli account email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      
      // Mostra una notifica di successo
      toast({
        title: "Account email rimosso",
        description: "L'account email è stato rimosso con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rimuovere l'account email",
        variant: "destructive",
      });
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
      // Utilizziamo l'API reale per aggiornare l'account email
      return apiRequest('PATCH', `/api/email/accounts/${id}`, data);
    },
    onSuccess: () => {
      // Invalida la cache degli account email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      
      // Mostra una notifica di successo
      toast({
        title: "Account email aggiornato",
        description: "Le impostazioni dell'account email sono state aggiornate",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare l'account email",
        variant: "destructive",
      });
    }
  });
}

/**
 * Hook per sincronizzare le email di un account specifico
 */
export function useSyncEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountId: number) => {
      // Utilizziamo l'API reale per sincronizzare le email
      return apiRequest('POST', `/api/email/accounts/${accountId}/sync`);
    },
    onSuccess: () => {
      // Invalida la cache delle email per forzare un aggiornamento
      queryClient.invalidateQueries({ queryKey: ['/api/email'] });
      
      // Mostra una notifica di successo
      toast({
        title: "Sincronizzazione avviata",
        description: "La sincronizzazione delle email è stata avviata. Le nuove email saranno disponibili a breve.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore di sincronizzazione",
        description: error.message || "Impossibile sincronizzare le email. Riprova più tardi.",
        variant: "destructive",
      });
    }
  });
}

/**
 * Hook per sincronizzare le email di tutti gli account configurati
 */
export function useSyncAllEmailAccounts() {
  const queryClient = useQueryClient();
  const { data: accounts } = useEmailAccounts();
  const syncAccount = useSyncEmailAccount();
  
  const syncAll = async () => {
    if (!accounts || accounts.length === 0) {
      toast({
        title: "Nessun account configurato",
        description: "Non ci sono account email configurati da sincronizzare.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Avvia la sincronizzazione per ogni account
      for (const account of accounts) {
        await syncAccount.mutateAsync(account.id);
      }
      
      toast({
        title: "Sincronizzazione completata",
        description: `Sincronizzazione avviata per ${accounts.length} account email.`,
      });
    } catch (error: any) {
      toast({
        title: "Errore di sincronizzazione",
        description: error.message || "Impossibile sincronizzare alcuni account email.",
        variant: "destructive",
      });
    }
  };
  
  return {
    syncAll,
    isSyncing: syncAccount.isPending
  };
}

/**
 * Hook per recuperare i dettagli di un singolo account email
 */
export function useEmailAccount(id: number) {
  return useQuery({
    queryKey: [`/api/email/accounts/${id}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/email/accounts/${id}`);
        if (!response.ok) {
          throw new Error("Errore nel caricamento dei dettagli dell'account email");
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching email account details:', error);
        return null;
      }
    },
    enabled: !!id,
  });
}