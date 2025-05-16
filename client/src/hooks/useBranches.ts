import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Branch } from "@/types";
import { apiRequest } from "@/lib/queryClient";

export const useBranches = (companyId?: number) => {
  const queryClient = useQueryClient();
  
  // Query per ottenere tutte le filiali
  const { data: branches, isLoading, error } = useQuery({
    queryKey: companyId ? ['/api/branches', companyId] : ['/api/branches'],
    retry: false,
  });

  // Mutation per eliminare una filiale
  const deleteBranch = useMutation({
    mutationFn: async (branchId: number) => {
      return await apiRequest(`/api/branches/${branchId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalida la query esistente per aggiornare l'elenco delle filiali
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: ['/api/branches', companyId] });
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
      return await apiRequest("/api/branches", {
        method: "POST",
        body: JSON.stringify(branch)
      });
    },
    onSuccess: (data, variables) => {
      // Invalida la query esistente per aggiornare l'elenco delle filiali
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches', variables.companyId] });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branch: Partial<Branch> & { id: number }) => {
      return await apiRequest(`/api/branches/${branch.id}`, {
        method: "PUT",
        body: JSON.stringify(branch)
      });
    },
    onSuccess: (data, variables) => {
      // Invalida le query esistenti per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: [`/api/branches/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches', variables.companyId] });
    },
  });
};