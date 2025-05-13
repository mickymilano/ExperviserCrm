import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Synergy } from '@shared/schema';

// Tipo per la creazione di una sinergia
interface CreateSynergyData {
  contactId: number;
  companyId: number;
  type: string;
  status?: string | null;
  description?: string | null;
  dealId?: number | null;
  startDate: Date;
  endDate?: Date | null;
}

// Tipo per l'aggiornamento di una sinergia
interface UpdateSynergyData {
  id: number;
  data: Partial<CreateSynergyData>;
}

/**
 * Hook principale per gestire le sinergie
 * Combina le funzionalità di recupero, creazione, aggiornamento ed eliminazione
 */
export function useSynergies() {
  // Query per recuperare tutte le sinergie
  const { 
    data: synergies, 
    isLoading, 
    isError, 
    error 
  } = useQuery<Synergy[]>({
    queryKey: ['/api/synergies'],
  });
  
  // Mutazioni per operazioni CRUD
  const createSynergy = useCreateSynergy();
  const updateSynergy = useUpdateSynergy();
  const deleteSynergy = useDeleteSynergy();
  
  return {
    synergies: synergies || [],
    isLoading,
    isError,
    error,
    createSynergy,
    updateSynergy,
    deleteSynergy,
  };
}

/**
 * Hook per ottenere una mutazione per creare una nuova sinergia
 */
export function useCreateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSynergyData) => {
      try {
        // Converti le date in formato stringa YYYY-MM-DD
        const formattedData = {
          ...data,
          startDate: data.startDate.toISOString().split('T')[0],
          endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : null,
        };
        
        const response = await fetch('/api/synergies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create synergy');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error creating synergy:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create synergy',
          variant: 'destructive',
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalida le query per forzare un aggiornamento dei dati
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
    },
  });
}

/**
 * Hook per ottenere una mutazione per aggiornare una sinergia esistente
 */
export function useUpdateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: UpdateSynergyData) => {
      try {
        // Converti le date in formato stringa YYYY-MM-DD
        const formattedData = {
          ...data,
          startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : undefined,
          endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : null,
        };
        
        const response = await fetch(`/api/synergies/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update synergy');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error updating synergy:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update synergy',
          variant: 'destructive',
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalida le query per forzare un aggiornamento dei dati
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
    },
  });
}

/**
 * Hook per ottenere una mutazione per eliminare una sinergia
 */
export function useDeleteSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await fetch(`/api/synergies/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete synergy');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error deleting synergy:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete synergy',
          variant: 'destructive',
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalida le query per forzare un aggiornamento dei dati
      queryClient.invalidateQueries({ queryKey: ['/api/synergies'] });
    },
  });
}