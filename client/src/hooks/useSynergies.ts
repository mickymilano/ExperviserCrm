import { useMutation, useQueryClient } from "@tanstack/react-query";

// Interfaccia per i dati di creazione di una sinergia
export interface CreateSynergyData {
  type: string;
  status: string;
  contactId: number;
  companyId: number;
  dealId?: number | null;
  description?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

// Hook per creare una nuova sinergia
export function useCreateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSynergyData) => {
      console.log("Creating synergy with data:", data);
      const response = await fetch("/api/synergies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create synergy: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalida la query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
    },
  });
}

// Hook per aggiornare una sinergia esistente
export function useUpdateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateSynergyData> }) => {
      console.log(`Updating synergy ${id} with data:`, data);
      const response = await fetch(`/api/synergies/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update synergy: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalida la query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
    },
  });
}

// Hook per eliminare una sinergia
export function useDeleteSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log(`Deleting synergy ${id}`);
      const response = await fetch(`/api/synergies/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete synergy: ${error}`);
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalida la query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
    },
  });
}