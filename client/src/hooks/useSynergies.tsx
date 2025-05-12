import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Synergy } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Definisci il tipo per i dati di creazione di una sinergia
type CreateSynergyData = Omit<Synergy, "id" | "createdAt" | "updatedAt">;
// Definisci il tipo per i dati di aggiornamento di una sinergia
type UpdateSynergyData = { id: number; data: Partial<Synergy> };

/**
 * Interfaccia migliorata per la creazione di una sinergia
 * Tutti i campi: contactId, companyId e dealId sono obbligatori
 * per evitare la creazione di sinergie incomplete
 */
export interface SynergyCreateData {
  type: string; // tipo di sinergia (business, partnership, etc.)
  contactId: number; // OBBLIGATORIO: ID del contatto
  companyId: number; // OBBLIGATORIO: ID dell'azienda
  dealId: number; // OBBLIGATORIO: ID del deal che ha generato la sinergia
  status: string; // stato della sinergia (active, archived, etc.)
  description?: string; // descrizione opzionale
  startDate?: Date; // data di inizio opzionale (default: now())
  endDate?: Date | null; // data di fine opzionale
}

/**
 * Interfaccia migliorata per l'aggiornamento di una sinergia
 * Non è possibile modificare i campi contactId, companyId o dealId
 * per mantenere l'integrità dei dati
 */
export interface SynergyUpdateData {
  id: number; // ID della sinergia da aggiornare
  status?: string; // nuovo stato (opzionale)
  description?: string; // nuova descrizione (opzionale)
  endDate?: Date; // nuova data di fine (opzionale)
}

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

/**
 * Hook per creare una nuova sinergia
 * Verifica che tutti i campi obbligatori siano presenti
 */
export function useCreateSynergy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SynergyCreateData) => {
      // Verifica che tutti i campi obbligatori siano presenti
      if (!data.contactId) {
        throw new Error("Il campo contactId è obbligatorio per creare una sinergia");
      }
      
      if (!data.companyId) {
        throw new Error("Il campo companyId è obbligatorio per creare una sinergia");
      }
      
      if (!data.dealId) {
        throw new Error("Il campo dealId è obbligatorio per creare una sinergia");
      }

      const response = await fetch("/api/synergies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante la creazione della sinergia: ${response.status} - ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      
      if (data.dealId) {
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${data.dealId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/deals", data.dealId, "synergies"] });
      }
      
      if (data.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${data.contactId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/contacts", data.contactId, "synergies"] });
      }
      
      if (data.companyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/companies/${data.companyId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies", data.companyId, "synergies"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

/**
 * Hook per aggiornare una sinergia esistente
 * Non permette la modifica dei campi contactId, companyId o dealId
 */
export function useUpdateSynergy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: SynergyUpdateData) => {
      // Verifica che non si stiano modificando campi che non dovrebbero essere modificati
      if ('contactId' in data || 'companyId' in data || 'dealId' in data) {
        throw new Error("Non è possibile modificare contactId, companyId o dealId di una sinergia esistente");
      }

      const response = await fetch(`/api/synergies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante l'aggiornamento della sinergia: ${response.status} - ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      queryClient.invalidateQueries({ queryKey: [`/api/synergies/${data.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/synergies", data.id] });
      
      if (data.dealId) {
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${data.dealId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/deals", data.dealId, "synergies"] });
      }
      
      if (data.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${data.contactId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/contacts", data.contactId, "synergies"] });
      }
      
      if (data.companyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/companies/${data.companyId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies", data.companyId, "synergies"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

/**
 * Hook per archiviare una sinergia
 * L'archiviazione è l'unico modo per "rimuovere" una sinergia dalla vista attiva
 * Le sinergie non vengono mai eliminate fisicamente dal database
 */
export function useArchiveSynergy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/synergies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "archived",
          endDate: new Date().toISOString() 
        }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante l'archiviazione della sinergia: ${response.status} - ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/synergies", data.id] });
      
      if (data.dealId) {
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${data.dealId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/deals", data.dealId, "synergies"] });
      }
      
      if (data.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${data.contactId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/contacts", data.contactId, "synergies"] });
      }
      
      if (data.companyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/companies/${data.companyId}/synergies`] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies", data.companyId, "synergies"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// Hook to delete a synergy (for backward compatibility)
export function useDeleteSynergy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, contactId, companyId }: { id: number; contactId?: number; companyId?: number }) => {
      // NOTA: Questo hook è mantenuto per retrocompatibilità, ma è deprecato.
      // Utilizzare useArchiveSynergy per nascondere le sinergie senza eliminare i dati.
      toast({
        title: "Attenzione",
        description: "L'eliminazione diretta delle sinergie è disabilitata. Utilizzare l'archiviazione invece.",
        variant: "default",
      });
      
      // Archiviamo invece di eliminare
      const response = await fetch(`/api/synergies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "archived",
          endDate: new Date().toISOString() 
        }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante l'archiviazione della sinergia: ${response.status} - ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/synergies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/synergies", variables.id] });
      
      // If we have contact or company ID in the variables, invalidate those queries too
      if (variables.contactId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/contacts", variables.contactId, "synergies"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/contacts/${variables.contactId}/synergies`] 
        });
      }
      
      if (variables.companyId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/companies", variables.companyId, "synergies"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/companies/${variables.companyId}/synergies`]
        });
      }
      
      if (data.dealId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/deals", data.dealId, "synergies"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/deals/${data.dealId}/synergies`]
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}