import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

export interface EmailAccount {
  id: number;
  userId: number;
  name: string;
  email: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  imapUsername?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  provider?: string;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
  serverSettings?: {
    incomingServer?: string;
    incomingPort?: number;
    outgoingServer?: string;
    outgoingPort?: number;
    security?: string;
  };
}

interface UseEmailAccountsResult {
  emailAccounts: EmailAccount[];
  isLoading: boolean;
  error: Error | null;
  addAccount: (account: Omit<EmailAccount, 'id'>) => Promise<EmailAccount>;
  updateAccount: (id: number, account: Partial<EmailAccount>) => Promise<EmailAccount>;
  deleteAccount: (id: number) => Promise<void>;
  syncAccounts: () => Promise<void>;
  setPrimaryAccount: (id: number) => Promise<void>;
}

export function useEmailAccounts(): UseEmailAccountsResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch email accounts
  const { 
    data: emailAccounts = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/email/accounts'],
    queryFn: async () => {
      const response = await fetch('/api/email/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch email accounts');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add a new email account
  const addAccountMutation = useMutation({
    mutationFn: async (account: Omit<EmailAccount, 'id'>) => {
      const response = await apiRequest('POST', '/api/email/accounts', account);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      toast({
        title: t('email.accountAdded', 'Account email aggiunto'),
        description: t('email.accountAddedDescription', 'Il tuo account email è stato aggiunto con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountAddError', 'Errore'),
        description: error.message || t('email.accountAddErrorDescription', 'Si è verificato un errore durante l\'aggiunta dell\'account email'),
        variant: 'destructive',
      });
    },
  });

  // Update an email account
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, account }: { id: number; account: Partial<EmailAccount> }) => {
      const response = await apiRequest('PATCH', `/api/email/accounts/${id}`, account);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      toast({
        title: t('email.accountUpdated', 'Account email aggiornato'),
        description: t('email.accountUpdatedDescription', 'Il tuo account email è stato aggiornato con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountUpdateError', 'Errore'),
        description: error.message || t('email.accountUpdateErrorDescription', 'Si è verificato un errore durante l\'aggiornamento dell\'account email'),
        variant: 'destructive',
      });
    },
  });

  // Delete an email account
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/email/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      toast({
        title: t('email.accountDeleted', 'Account email eliminato'),
        description: t('email.accountDeletedDescription', 'Il tuo account email è stato eliminato con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountDeleteError', 'Errore'),
        description: error.message || t('email.accountDeleteErrorDescription', 'Si è verificato un errore durante l\'eliminazione dell\'account email'),
        variant: 'destructive',
      });
    },
  });

  // Sync email accounts
  const syncAccountsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/email/accounts/sync');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: t('email.accountsSynced', 'Account email sincronizzati'),
        description: t('email.accountsSyncedDescription', 'I tuoi account email sono stati sincronizzati con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountsSyncError', 'Errore'),
        description: error.message || t('email.accountsSyncErrorDescription', 'Si è verificato un errore durante la sincronizzazione degli account email'),
        variant: 'destructive',
      });
    },
  });

  // Set primary account
  const setPrimaryAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/email/accounts/${id}/primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      toast({
        title: t('email.primaryAccountSet', 'Account primario impostato'),
        description: t('email.primaryAccountSetDescription', 'Il tuo account email primario è stato impostato con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.primaryAccountSetError', 'Errore'),
        description: error.message || t('email.primaryAccountSetErrorDescription', 'Si è verificato un errore durante l\'impostazione dell\'account email primario'),
        variant: 'destructive',
      });
    },
  });

  // Return the hook result
  return {
    emailAccounts,
    isLoading,
    error,
    addAccount: (account) => addAccountMutation.mutateAsync(account),
    updateAccount: (id, account) => updateAccountMutation.mutateAsync({ id, account }),
    deleteAccount: (id) => deleteAccountMutation.mutateAsync(id),
    syncAccounts: () => syncAccountsMutation.mutateAsync(),
    setPrimaryAccount: (id) => setPrimaryAccountMutation.mutateAsync(id),
  };
}

/**
 * Hook per eliminare un account email
 */
export function useDeleteEmailAccount() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/email/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      toast({
        title: t('email.accountDeleted', 'Account email eliminato'),
        description: t('email.accountDeletedDescription', 'L\'account email è stato eliminato con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountDeleteError', 'Errore eliminazione'),
        description: error.message || t('email.accountDeleteErrorDescription', 'Si è verificato un errore durante l\'eliminazione dell\'account email'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook per sincronizzare un singolo account email
 */
export function useSyncEmailAccount() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/email/accounts/${id}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: t('email.accountSynced', 'Account sincronizzato'),
        description: t('email.accountSyncedDescription', 'L\'account email è stato sincronizzato con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountSyncError', 'Errore sincronizzazione'),
        description: error.message || t('email.accountSyncErrorDescription', 'Si è verificato un errore durante la sincronizzazione dell\'account email'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook per sincronizzare tutti gli account email
 */
export function useSyncAllEmailAccounts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/email/accounts/sync');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: t('email.accountsSynced', 'Account sincronizzati'),
        description: t('email.accountsSyncedDescription', 'Tutti gli account email sono stati sincronizzati con successo'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('email.accountsSyncError', 'Errore sincronizzazione'),
        description: error.message || t('email.accountsSyncErrorDescription', 'Si è verificato un errore durante la sincronizzazione degli account email'),
        variant: 'destructive',
      });
    },
  });
}