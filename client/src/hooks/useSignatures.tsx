import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from './use-toast';
import { Signature, InsertSignature } from '@shared/schema';
import { apiRequest, queryClient } from '../lib/queryClient';

// Get all signatures
export const useSignatures = () => {
  return useQuery({
    queryKey: ['/api/signatures'],
    queryFn: async () => {
      const response = await apiRequest('/api/signatures');
      return response as Signature[];
    },
  });
};

// Get a specific signature
export const useSignature = (id: number) => {
  return useQuery({
    queryKey: ['/api/signatures', id],
    queryFn: async () => {
      const response = await apiRequest(`/api/signatures/${id}`);
      return response as Signature;
    },
    enabled: !!id,
  });
};

// Create a new signature
export const useCreateSignature = () => {
  return useMutation({
    mutationFn: async (signatureData: InsertSignature) => {
      const response = await apiRequest('/api/signatures', {
        method: 'POST',
        body: JSON.stringify(signatureData),
      });
      return response as Signature;
    },
    onSuccess: () => {
      toast({
        title: 'Signature Created',
        description: 'Email signature has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
    },
    onError: (error: any) => {
      console.error('Failed to create signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to create signature. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Update an existing signature
export const useUpdateSignature = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSignature> }) => {
      const response = await apiRequest(`/api/signatures/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response as Signature;
    },
    onSuccess: () => {
      toast({
        title: 'Signature Updated',
        description: 'Email signature has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
    },
    onError: (error: any) => {
      console.error('Failed to update signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to update signature. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Delete a signature
export const useDeleteSignature = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/signatures/${id}`, {
        method: 'DELETE',
      });
      return id;
    },
    onSuccess: () => {
      toast({
        title: 'Signature Deleted',
        description: 'Email signature has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete signature. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Set a signature as default
export const useSetDefaultSignature = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/signatures/${id}/set-default`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Default Signature Updated',
        description: 'Default email signature has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
    },
    onError: (error: any) => {
      console.error('Failed to set default signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default signature. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Get signatures associated with an account
export const useAccountSignatures = (accountId: number) => {
  return useQuery({
    queryKey: ['/api/email-accounts', accountId, 'signatures'],
    queryFn: async () => {
      const response = await apiRequest(`/api/email-accounts/${accountId}/signatures`);
      return response as Signature[];
    },
    enabled: !!accountId,
  });
};

// Assign a signature to an account
export const useAssignSignatureToAccount = () => {
  return useMutation({
    mutationFn: async ({ accountId, signatureId }: { accountId: number; signatureId: number }) => {
      const response = await apiRequest(
        `/api/email-accounts/${accountId}/signatures/${signatureId}`,
        {
          method: 'POST',
        }
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Signature Assigned',
        description: 'Signature has been assigned to the email account.',
      });
      // We need to invalidate both signatures and email accounts
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
    },
    onError: (error: any) => {
      console.error('Failed to assign signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign signature to account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Remove a signature from an account
export const useRemoveSignatureFromAccount = () => {
  return useMutation({
    mutationFn: async ({ accountId, signatureId }: { accountId: number; signatureId: number }) => {
      await apiRequest(`/api/email-accounts/${accountId}/signatures/${signatureId}`, {
        method: 'DELETE',
      });
      return { accountId, signatureId };
    },
    onSuccess: ({ accountId }) => {
      toast({
        title: 'Signature Removed',
        description: 'Signature has been removed from the email account.',
      });
      // Invalidate the specific account's signatures query
      queryClient.invalidateQueries({
        queryKey: ['/api/email-accounts', accountId, 'signatures'],
      });
    },
    onError: (error: any) => {
      console.error('Failed to remove signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove signature from account. Please try again.',
        variant: 'destructive',
      });
    },
  });
};