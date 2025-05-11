import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Contact } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface UseContactsOptions {
  companyId?: number;
}

export const useContacts = (options?: UseContactsOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = options || {};

  // Build the API URL with query parameters if filters are provided
  const apiUrl = companyId 
    ? `/api/contacts?companyId=${companyId}` 
    : '/api/contacts';

  const {
    data: contacts,
    isLoading,
    isError,
    error,
  } = useQuery<Contact[]>({
    queryKey: [apiUrl],
  });

  const createContact = useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest("POST", "/api/contacts", contactData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Contact> }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    contacts,
    isLoading,
    isError,
    error,
    createContact,
    updateContact,
    deleteContact,
  };
};

export const useContact = (id: number) => {
  return useQuery<Contact>({
    queryKey: [`/api/contacts/${id}`],
    enabled: !!id,
  });
};

/**
 * Hook per recuperare le aziende associate a un contatto
 * Questo hook recupera le aziende con le relative informazioni sull'area di attività,
 * consentendo di visualizzare il ruolo del contatto in ciascuna azienda e altre informazioni
 * sulla relazione.
 * 
 * @param contactId ID del contatto di cui recuperare le aziende associate
 * @returns Lista delle aziende associate con dettagli sulla relazione, stato di caricamento ed eventuali errori
 */
export const useContactCompanies = (contactId: number) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [`/api/contacts/${contactId}/companies`],
    enabled: !!contactId,
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to load contact companies: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
