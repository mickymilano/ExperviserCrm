import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { apiRequest } from "../lib/apiRequest";
import type { Company } from "@shared/schema";

// Hook per ottenere i dettagli di una singola azienda
export function useCompany(id: number) {
  return useQuery({
    queryKey: [`/api/companies/${id}`],
    enabled: !!id && !isNaN(id),
  });
}

// Hook per ottenere tutte le aziende
export function useCompanies(params?: any) {
  return useQuery({
    queryKey: ["/api/companies", params],
  });
}

// Hook per ottenere i contatti associati a un'azienda
export function useCompanyContacts(companyId: number) {
  return useQuery({
    queryKey: [`/api/companies/${companyId}/contacts`],
    enabled: !!companyId && !isNaN(companyId),
  });
}

// Hook per ottenere i contatti non associati ad alcuna azienda
export function useUnassignedContacts() {
  return useQuery({
    queryKey: ["/api/contacts/unassigned"],
  });
}

// Hook per aggiornare l'associazione tra un contatto e un'azienda
export function useUpdateContactCompany() {
  return useMutation({
    mutationFn: async ({ contactId, companyId }: { contactId: number, companyId: number | null }) => {
      return apiRequest(`/api/contacts/${contactId}/company`, {
        method: "PATCH",
        data: { companyId },
      });
    },
    onSuccess: () => {
      // Invalida tutte le query correlate ai contatti e alle aziende
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

// Hook per creare o aggiornare un'azienda
export function useCreateUpdateCompany() {
  return useMutation({
    mutationFn: async (companyData: any) => {
      const isUpdate = !!companyData.id;
      const url = isUpdate ? `/api/companies/${companyData.id}` : "/api/companies";
      const method = isUpdate ? "PATCH" : "POST";
      
      return apiRequest(url, {
        method,
        data: companyData,
      });
    },
    onSuccess: () => {
      // Invalida tutte le query correlate alle aziende
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}