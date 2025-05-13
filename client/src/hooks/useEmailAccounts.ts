import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmailAccount } from "@/types";
import { apiRequest } from "@/lib/queryClient";

// Riceve tutti gli account email
export function useEmailAccounts() {
  return useQuery<EmailAccount[]>({
    queryKey: ["/api/email/accounts"],
    retry: false,
  });
}

// Riceve un account email specifico
export function useEmailAccount(id: number) {
  return useQuery<EmailAccount>({
    queryKey: ["/api/email/accounts", id],
    enabled: !!id,
    retry: false,
  });
}

// Crea un nuovo account email
export function useCreateEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: Omit<EmailAccount, "id">) => {
      return await apiRequest("/api/email/accounts", "POST", account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
    }
  });
}

// Aggiorna un account email
export function useUpdateEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, account }: { id: number, account: Partial<EmailAccount> }) => {
      return await apiRequest(`/api/email/accounts/${id}`, "PATCH", account);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
    }
  });
}

// Elimina un account email
export function useDeleteEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/email/accounts/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
    }
  });
}

// Sincronizza tutti gli account email (scarica nuove email)
export function useSyncAllEmailAccounts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/email/sync", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
    }
  });
}

// Sincronizza un account email specifico
export function useSyncEmailAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/email/accounts/${id}/sync`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
    }
  });
}

// Verifica la connessione di un account email
export function useVerifyEmailAccount() {
  return useMutation({
    mutationFn: async (account: Partial<EmailAccount>) => {
      return await apiRequest("/api/email/verify-account", "POST", account);
    }
  });
}