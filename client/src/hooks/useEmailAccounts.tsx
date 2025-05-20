import { useMutation, useQuery } from '@tanstack/react-query';
import { EmailAccount, InsertEmailAccount } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useEmailAccounts = () => {
  return useQuery<EmailAccount[]>({
    queryKey: ['/api/email-accounts'],
  });
};

export const useEmailAccount = (id: number | null) => {
  return useQuery<EmailAccount | undefined>({
    queryKey: ['/api/email-accounts', id],
    queryFn: async () => {
      if (!id) return undefined;
      const accounts = await queryClient.fetchQuery<EmailAccount[]>({ queryKey: ['/api/email-accounts'] });
      return accounts.find((account: EmailAccount) => account.id === id);
    },
    enabled: !!id,
  });
};

export const useDeleteEmailAccount = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/email-accounts/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({}), // Empty body, but needed for correct fetch handling
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: 'Account Deleted',
        description: 'Email account has been deleted successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to delete email account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete email account.',
        variant: 'destructive',
      });
    },
  });
};

export const useSyncEmailAccount = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/email-accounts/${id}/sync`, {
        method: 'POST',
        body: JSON.stringify({}), // Empty body, but needed for POST
      });
      const data = await response.json();
      return data as { success: boolean; message: string; count: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: 'Emails Synced',
        description: data.message,
      });
    },
    onError: (error) => {
      console.error('Failed to sync emails:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize emails. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useSyncAllEmailAccounts = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest('/api/email-accounts/sync-all', {
          method: 'POST',
          body: JSON.stringify({}), // Empty body, but needed for POST
        });
        const data = await response.json();
        return data as { success: boolean; message: string; count: number };
      } catch (error) {
        console.error('Error syncing all email accounts:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: 'All Accounts Synced',
        description: data.message,
      });
    },
    onError: (error) => {
      console.error('Failed to sync all email accounts:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize all email accounts. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useCreateEmailAccount = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (accountData: InsertEmailAccount) => {
      return apiRequest('/api/email-accounts', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: 'Account Created',
        description: 'Email account has been added successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to create email account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create email account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateEmailAccount = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, accountData }: { id: number; accountData: Partial<InsertEmailAccount> }) => {
      return apiRequest(`/api/email-accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(accountData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: 'Account Updated',
        description: 'Email account has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to update email account:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useSetPrimaryEmailAccount = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/email-accounts/${id}/set-primary`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: 'Primary Account Set',
        description: 'Primary email account has been updated.',
      });
    },
    onError: (error) => {
      console.error('Failed to set primary account:', error);
      toast({
        title: 'Error',
        description: 'Failed to set primary account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleEmailAccountActive = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest(`/api/email-accounts/${id}/toggle-active`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: variables.isActive ? 'Account Enabled' : 'Account Disabled',
        description: `Email account has been ${variables.isActive ? 'enabled' : 'disabled'}.`,
      });
    },
    onError: (error) => {
      console.error('Failed to toggle account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// A helper hook to get the color for account status
export const useAccountStatusColor = (status: string) => {
  switch (status) {
    case 'ok':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    default:
      return 'bg-gray-300';
  }
};