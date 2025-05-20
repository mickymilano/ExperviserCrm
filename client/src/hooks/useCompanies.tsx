import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Company } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useCompanies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: companies,
    isLoading,
    isError,
    error,
  } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const createCompany = useMutation({
    mutationFn: async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest("POST", "/api/companies", companyData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create company: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Company> }) => {
      const response = await apiRequest("PATCH", `/api/companies/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update company: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete company: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    companies,
    isLoading,
    isError,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
  };
};

/**
 * Hook per recuperare i dettagli di un'azienda
 * 
 * @param id ID dell'azienda da recuperare
 * @returns Dati dell'azienda, stato di caricamento ed eventuali errori
 */
export const useCompany = (id: number) => {
  return useQuery<Company>({
    queryKey: [`/api/companies/${id}`],
    enabled: !!id,
  });
};

/**
 * Hook per recuperare i contatti associati a un'azienda
 * Questo hook recupera i contatti con tutte le relative aree di attività,
 * permettendo di visualizzare ruoli e dettagli del contatto nell'azienda.
 * 
 * @param companyId ID dell'azienda di cui recuperare i contatti
 * @returns Lista dei contatti con le rispettive aree di attività, stato di caricamento ed eventuali errori
 */
export const useCompanyContacts = (companyId: number) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [`/api/companies/${companyId}/contacts`],
    enabled: !!companyId,
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to load company contacts: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
