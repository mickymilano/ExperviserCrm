import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Contact } from "../types";
import { useToast } from "./use-toast";

interface UseContactsOptions {
  companyId?: number;
}

export const useContacts = (options?: UseContactsOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = options || {};

  // Build the API URL with query parameters if filters are provided
  // Add includeAreas=true to get contacts with their areas of activity in a single request
  const apiUrl = companyId 
    ? `/api/contacts?companyId=${companyId}&includeAreas=true` 
    : '/api/contacts?includeAreas=true';

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
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
      
      // Invalidate all contact-related queries with a more effective pattern
      queryClient.invalidateQueries({ queryKey: [['/api/contacts']] });
      
      // Invalidate any specific company queries if the contact is linked to a company
      if (data.areasOfActivity && data.areasOfActivity.length > 0) {
        data.areasOfActivity.forEach((area: { companyId?: number }) => {
          if (area.companyId) {
            queryClient.invalidateQueries({ 
              queryKey: [[`/api/companies/${area.companyId}`]] 
            });
            queryClient.invalidateQueries({ 
              queryKey: [[`/api/companies/${area.companyId}/contacts`]] 
            });
          }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: [['/api/dashboard']] });
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
    onSuccess: (updatedContact, variables) => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      
      // Invalidate the specific contact query
      queryClient.invalidateQueries({ 
        queryKey: [[`/api/contacts/${variables.id}`]] 
      });
      
      // Invalidate all contacts queries
      queryClient.invalidateQueries({ 
        queryKey: [['/api/contacts']]
      });
      
      // Invalidate any specific company queries if the contact is linked to companies
      // First, get fresh contact data with associated companies
      queryClient.fetchQuery({ 
        queryKey: [`/api/contacts/${variables.id}/companies`],
      }).then((companiesData: any) => {
        if (companiesData && Array.isArray(companiesData)) {
          companiesData.forEach((company: any) => {
            if (company.id) {
              queryClient.invalidateQueries({
                queryKey: [[`/api/companies/${company.id}`]]
              });
              queryClient.invalidateQueries({
                queryKey: [[`/api/companies/${company.id}/contacts`]]
              });
            }
          });
        }
      }).catch(() => {
        // Fallback invalidation if we can't get fresh data
        queryClient.invalidateQueries({
          queryKey: [['/api/companies']]
        });
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [['/api/dashboard']]
      });
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
      // Invalidate all contacts queries regardless of parameters
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      // Explicitly invalidate queries with includeAreas parameter
      queryClient.invalidateQueries({ queryKey: ['/api/contacts?includeAreas=true'] });
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

export function useContact(id: number) {
  return useQuery<Contact>({
    queryKey: [`/api/contacts/${id}`],
    enabled: !!id,
  });
}

/**
 * Hook to retrieve companies associated with a contact
 * This hook retrieves companies with their related activity area information,
 * allowing you to view the contact's role in each company and other information
 * about the relationship.
 * 
 * @param contactId ID of the contact whose associated companies to retrieve
 * @returns List of associated companies with relationship details, loading state and any errors
 */
export function useContactCompanies(contactId: number) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [`/api/contacts/${contactId}/companies`],
    enabled: !!contactId,
  });
}
