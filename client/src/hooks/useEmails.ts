import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Email } from "@/types";
import { apiRequest } from "@/lib/queryClient";

// Riceve tutte le email
export function useEmails() {
  return useQuery<Email[]>({
    queryKey: ["/api/emails"],
    retry: false,
  });
}

// Riceve una email specifica
export function useEmail(id: number) {
  return useQuery<Email>({
    queryKey: ["/api/emails", id],
    enabled: !!id,
    retry: false,
  });
}

// Marca una email come letta
export function useMarkEmailAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailId: number) => {
      return await apiRequest(`/api/emails/${emailId}/read`, {
        method: "PATCH"
      });
    },
    onSuccess: (_, emailId) => {
      // Aggiorna l'email specifica
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId] });
      
      // Aggiorna la lista delle email
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      
      // Aggiorna le attività, perché potrebbe esserci un'attività collegata all'email
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    }
  });
}

// Marca una email come non letta
export function useMarkEmailAsUnread() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailId: number) => {
      return await apiRequest(`/api/emails/${emailId}/unread`, {
        method: "PATCH"
      });
    },
    onSuccess: (_, emailId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

// Marca una email come importante (con stella)
export function useToggleEmailStarred() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ emailId, isStarred }: { emailId: number, isStarred: boolean }) => {
      return await apiRequest(`/api/emails/${emailId}/star`, {
        method: "PATCH",
        body: JSON.stringify({ isStarred })
      });
    },
    onSuccess: (_, { emailId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

// Sposta un'email in una cartella
export function useMoveEmailToFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ emailId, folder }: { emailId: number, folder: string }) => {
      return await apiRequest(`/api/emails/${emailId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ folder })
      });
    },
    onSuccess: (_, { emailId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

// Applica etichette a un'email
export function useUpdateEmailLabels() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ emailId, labels }: { emailId: number, labels: string[] }) => {
      return await apiRequest(`/api/emails/${emailId}/labels`, {
        method: "PATCH",
        body: JSON.stringify({ labels })
      });
    },
    onSuccess: (_, { emailId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

// Elimina un'email (sposta nel cestino)
export function useDeleteEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailId: number) => {
      return await apiRequest(`/api/emails/${emailId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

// Invia una nuova email
export function useSendEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailData: Partial<Email>) => {
      return await apiRequest("/api/emails/send", {
        method: "POST",
        body: JSON.stringify(emailData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    }
  });
}