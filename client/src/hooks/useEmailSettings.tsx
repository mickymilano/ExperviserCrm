import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { EmailAccount } from '@shared/schema';
import { apiRequest } from '../lib/queryClient';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  account?: T;
}

// Hook for setting primary email account
export const useSetPrimaryEmailAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest<ApiResponse<EmailAccount>>(`/api/email-accounts/${id}/set-primary`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Primary Account Updated',
        description: 'Primary email account has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
    },
    onError: (error: any) => {
      console.error('Failed to set primary account:', error);
      toast({
        title: 'Error',
        description: 'Failed to set primary account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Hook for toggling account active status
export const useToggleEmailAccountActive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest<ApiResponse<EmailAccount>>(`/api/email-accounts/${id}/toggle-active`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      });
      return response;
    },
    onSuccess: (data: ApiResponse<EmailAccount>) => {
      // The server responds with { success, message, account }
      const isActive = data.account?.isActive;
      const action = isActive ? 'activated' : 'deactivated';
      toast({
        title: `Account ${action}`,
        description: `Email account has been ${action} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
    },
    onError: (error: any) => {
      console.error('Failed to toggle account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Hook for getting account status color
export const useAccountStatusColor = (status: string | null) => {
  if (!status || status === 'unknown') return 'bg-gray-300'; // Unknown or no status
  if (status === 'ok') return 'bg-green-500'; // Working
  if (status === 'error') return 'bg-red-500'; // Error
  if (status === 'warning') return 'bg-yellow-500'; // Warning
  return 'bg-gray-300'; // Default
};