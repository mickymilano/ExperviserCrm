import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Branch } from "@/types";
import { apiRequest } from "@/lib/queryClient";

export const useBranches = (companyId?: number) => {
  const queryClient = useQueryClient();
  
  // Query per ottenere tutte le filiali o quelle di una specifica azienda
  const { data: branches, isLoading, error } = useQuery({
    queryKey: companyId ? ['/api/branches/company', companyId] : ['/api/branches'],
    queryFn: async () => {
      console.log('useBranches: iniziando la richiesta API', companyId ? `per l'azienda ${companyId}` : 'per tutte le filiali');
      
      try {
        // Utilizziamo fetch direttamente per vedere l'errore completo
        const url = companyId ? `/api/branches/company/${companyId}` : '/api/branches';
        console.log('useBranches: chiamata fetch diretta a:', url);
        
        const response = await fetch(url);
        console.log('useBranches: risposta fetch status:', response.status);
        
        if (!response.ok) {
          console.error('useBranches: risposta non ok:', response.status, response.statusText);
          // Proviamo a leggere l'errore come JSON
          try {
            const errorData = await response.json();
            console.error('useBranches: dettaglio errore:', errorData);
          } catch (e) {
            console.error('useBranches: impossibile leggere error json');
          }
          return [];
        }
        
        const result = await response.json();
        console.log('useBranches: risposta API ricevuta:', result);
        
        // Se il risultato è null o undefined, restituiamo un array vuoto
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('useBranches: errore durante la richiesta API:', err);
        // In caso di errore restituiamo un array vuoto
        return [];
      }
    },
    retry: 1,
  });

  // Mutation per eliminare una filiale
  const deleteBranch = useMutation({
    mutationFn: async (branchId: number) => {
      return await apiRequest("DELETE", `/api/branches/${branchId}`);
    },
    onSuccess: () => {
      // Invalida la query esistente per aggiornare l'elenco delle filiali
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: ['/api/branches/company', companyId] });
      }
    },
  });

  return { branches, isLoading, error, deleteBranch };
};

export const useBranch = (branchId: number) => {
  return useQuery({
    queryKey: [`/api/branches/${branchId}`],
    enabled: !!branchId,
    retry: false,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branch: Omit<Branch, "id" | "createdAt" | "updatedAt">) => {
      return await apiRequest("/api/branches", "POST", branch);
    },
    onSuccess: (data, variables) => {
      // Invalida la query esistente per aggiornare l'elenco delle filiali
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches/company', variables.companyId] });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branch: Partial<Branch> & { id: number }) => {
      return await apiRequest("PUT", `/api/branches/${branch.id}`, branch);
    },
    onSuccess: (data, variables) => {
      // Invalida le query esistenti per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: [`/api/branches/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches/company', variables.companyId] });
    },
  });
};