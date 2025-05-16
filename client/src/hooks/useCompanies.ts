import { useQuery } from "@tanstack/react-query";
import type { Company, Contact } from "@/types";

/**
 * Hook per recuperare tutte le aziende dal server
 */
export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ["/api/companies"],
    staleTime: 30 * 1000, // 30 secondi di cache
  });
}

/**
 * Hook per recuperare una singola azienda dal server
 */
export function useCompany(id: number | string | undefined) {
  return useQuery<Company>({
    queryKey: ["/api/companies", id],
    enabled: !!id, // Abilita la query solo se abbiamo un ID
    staleTime: 30 * 1000, // 30 secondi di cache
  });
}

/**
 * Hook per recuperare i contatti associati a un'azienda
 */
export function useCompanyContacts(companyId: number | string | undefined) {
  return useQuery<Contact[]>({
    queryKey: ["/api/companies", companyId, "contacts"],
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 secondi di cache
  });
}