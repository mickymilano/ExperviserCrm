import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Fetch all synergies
export function useSynergies(options = {}) {
  return useQuery({
    queryKey: ['/api/synergies'],
    ...options,
  });
}

// Fetch synergies for a specific contact
export function useContactSynergies(contactId: number, options = {}) {
  return useQuery({
    queryKey: ['/api/synergies/contact', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      return apiRequest(`/api/synergies/contact/${contactId}`);
    },
    enabled: !!contactId,
    ...options,
  });
}

// Fetch synergies for a specific company
export function useCompanySynergies(companyId: number, options = {}) {
  return useQuery({
    queryKey: ['/api/synergies/company', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return apiRequest(`/api/synergies/company/${companyId}`);
    },
    enabled: !!companyId,
    ...options,
  });
}

// Fetch synergies for a specific deal
export function useDealSynergies(dealId: number, options = {}) {
  return useQuery({
    queryKey: ['/api/synergies/deal', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      return apiRequest(`/api/synergies/deal/${dealId}`);
    },
    enabled: !!dealId,
    ...options,
  });
}

// Create a new synergy
export function useCreateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => {
      return apiRequest('/api/synergies', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      // Invalidate all queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/contact'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/deal'] });
    },
    onError: (error: any) => {
      console.error('Error creating synergy:', error);
      toast({
        title: 'Error',
        description: 'Failed to create synergy. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// Update an existing synergy
export function useUpdateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/synergies/${id}`, {
        method: 'PATCH',
        data,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/contact'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/deal'] });
      
      // Also invalidate specific synergy queries
      if (variables.data.contactId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/synergies/contact', variables.data.contactId]
        });
      }
      if (variables.data.companyId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/synergies/company', variables.data.companyId]
        });
      }
      if (variables.data.dealId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/synergies/deal', variables.data.dealId]
        });
      }
    },
    onError: (error: any) => {
      console.error('Error updating synergy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update synergy. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// Delete a synergy
export function useDeleteSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/synergies/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidate all synergy queries
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/contact'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/synergies/deal'] });
    },
    onError: (error: any) => {
      console.error('Error deleting synergy:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete synergy. Please try again.',
        variant: 'destructive',
      });
    },
  });
}