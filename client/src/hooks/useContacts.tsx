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
    select: async (contacts) => {
      // For each contact, fetch their areas of activity
      return await Promise.all(
        contacts.map(async (contact) => {
          try {
            const areasOfActivityResponse = await fetch(`/api/contacts/${contact.id}/areas-of-activity`);
            if (areasOfActivityResponse.ok) {
              const areasOfActivity = await areasOfActivityResponse.json();
              return {
                ...contact,
                areasOfActivity,
              };
            }
            return contact;
          } catch (error) {
            console.error(`Failed to fetch areas of activity for contact ${contact.id}:`, error);
            return contact;
          }
        })
      );
    }
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
 * Hook to retrieve companies associated with a contact
 * This hook retrieves companies with their related activity area information,
 * allowing you to view the contact's role in each company and other information
 * about the relationship.
 * 
 * @param contactId ID of the contact whose associated companies to retrieve
 * @returns List of associated companies with relationship details, loading state and any errors
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
