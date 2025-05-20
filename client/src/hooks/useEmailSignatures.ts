import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { mockEmailSignatures } from '@/mock/mockEmailData';

export interface EmailSignature {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
}

/**
 * Hook per recuperare le firme email dell'utente
 */
export function useEmailSignatures() {
  const queryClient = useQueryClient();

  // Query per recuperare le firme
  const signaturesQuery = useQuery({
    queryKey: ['/api/email/signatures'],
    queryFn: async () => {
      try {
        // Note: In produzione, questo codice dovrebbe utilizzare un endpoint reale
        // Simulazione per demo e sviluppo
        return mockEmailSignatures;

        // Implementazione per produzione - decommentare quando l'API è pronta
        /*
        const response = await fetch('/api/email/signatures');
        if (!response.ok) {
          throw new Error('Errore nel caricamento delle firme email');
        }
        return response.json();
        */
      } catch (error) {
        console.error('Error fetching email signatures:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  // Mutation per creare una nuova firma
  const createSignatureMutation = useMutation({
    mutationFn: async (data: Omit<EmailSignature, 'id'>) => {
      // Simulazione per demo e sviluppo
      const newId = Math.max(0, ...mockEmailSignatures.map(s => s.id)) + 1;
      const newSignature = { ...data, id: newId };
      mockEmailSignatures.push(newSignature);
      return newSignature;

      // Implementazione per produzione
      // return apiRequest('POST', '/api/email/signatures', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
    },
  });

  // Mutation per aggiornare una firma esistente
  const updateSignatureMutation = useMutation({
    mutationFn: async (data: EmailSignature) => {
      // Simulazione per demo e sviluppo
      const index = mockEmailSignatures.findIndex(s => s.id === data.id);
      if (index >= 0) {
        mockEmailSignatures[index] = data;
      }
      return data;

      // Implementazione per produzione
      // return apiRequest('PATCH', `/api/email/signatures/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
    },
  });

  // Mutation per eliminare una firma
  const deleteSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulazione per demo e sviluppo
      const index = mockEmailSignatures.findIndex(s => s.id === id);
      if (index >= 0) {
        mockEmailSignatures.splice(index, 1);
      }
      return { success: true };

      // Implementazione per produzione
      // return apiRequest('DELETE', `/api/email/signatures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
    },
  });

  // Mutation per impostare una firma come predefinita
  const setDefaultSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulazione per demo e sviluppo
      mockEmailSignatures.forEach(s => {
        s.isDefault = s.id === id;
      });
      return { success: true, id };

      // Implementazione per produzione
      // return apiRequest('PATCH', `/api/email/signatures/${id}/default`, { isDefault: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/signatures'] });
    },
  });

  return {
    signatures: signaturesQuery.data || [],
    isLoading: signaturesQuery.isLoading,
    error: signaturesQuery.error,
    createSignature: createSignatureMutation.mutate,
    updateSignature: updateSignatureMutation.mutate,
    deleteSignature: deleteSignatureMutation.mutate,
    setDefaultSignature: setDefaultSignatureMutation.mutate,
    isCreating: createSignatureMutation.isPending,
    isUpdating: updateSignatureMutation.isPending,
    isDeleting: deleteSignatureMutation.isPending,
    isSettingDefault: setDefaultSignatureMutation.isPending,
  };
}