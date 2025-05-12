import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Synergy } from "@shared/schema";

// Hook to fetch all synergies
export function useSynergies() {
  return useQuery({
    queryKey: ["/api/synergies"],
    refetchOnWindowFocus: false,
  });
}

// Hook to fetch a single synergy by ID
export function useSynergy(id: number) {
  return useQuery({
    queryKey: ["/api/synergies", id],
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// Hook to fetch synergies for a contact
export function useContactSynergies(contactId: number) {
  return useQuery({
    queryKey: ["/api/contacts", contactId, "synergies"],
    enabled: !!contactId,
    refetchOnWindowFocus: false,
  });
}

// Hook to fetch synergies for a company
export function useCompanySynergies(companyId: number) {
  return useQuery({
    queryKey: ["/api/companies", companyId, "synergies"],
    enabled: !!companyId,
    refetchOnWindowFocus: false,
  });
}

// Hook to create a new synergy
export function useCreateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (synergyData: Omit<Synergy, "id" | "createdAt" | "updatedAt">) => {
      // Assicuriamoci che startDate sia un oggetto Date valido
      const processedData = {
        ...synergyData,
        startDate: synergyData.startDate || new Date(),
        description: synergyData.description || null,
        dealId: synergyData.dealId || null,
        status: synergyData.status || null,
        type: synergyData.type || null
      };
      
      return apiRequest("/api/synergies", "POST", processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
    },
  });
}

// Hook to update an existing synergy
export function useUpdateSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Synergy> }) => {
      // Assicuriamoci che i dati siano formattati correttamente
      const processedData = {
        ...data,
        startDate: data.startDate || new Date(),
        description: data.description ?? null,
        dealId: data.dealId ?? null,
        status: data.status ?? null,
        type: data.type ?? null
      };
      
      return apiRequest(`/api/synergies/${id}`, {
        method: "PATCH", 
        data: processedData,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/synergies", variables.id] });
      
      // If we have contact or company ID in the data, invalidate those queries too
      if (variables.data.contactId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/contacts", variables.data.contactId, "synergies"] 
        });
      }
      
      if (variables.data.companyId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/companies", variables.data.companyId, "synergies"] 
        });
      }
    },
  });
}

// Hook to delete a synergy
export function useDeleteSynergy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, contactId, companyId }: { id: number; contactId?: number; companyId?: number }) => {
      return apiRequest(`/api/synergies/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      
      // If we have contact or company ID in the variables, invalidate those queries too
      if (variables.contactId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/contacts", variables.contactId, "synergies"] 
        });
      }
      
      if (variables.companyId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/companies", variables.companyId, "synergies"] 
        });
      }
    },
  });
}