import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { DealInfo, PipelineStage } from "../types";
import { useToast } from "./use-toast";

interface UseDealsOptions {
  companyId?: number;
  contactId?: number;
  status?: string;
  forContactDetail?: boolean;
  forCompanyDetail?: boolean;
}

export const useDeals = (options?: UseDealsOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId, contactId, status, forContactDetail, forCompanyDetail } = options || {};

  // Determine the API URL based on options
  let apiUrl = '/api/deals';
  
  if (forContactDetail && contactId) {
    // Use the specific endpoint for contact's deals
    apiUrl = `/api/contacts/${contactId}/deals`;
  } else if (forCompanyDetail && companyId) {
    // Use the specific endpoint for company's deals
    apiUrl = `/api/companies/${companyId}/deals`;
  } else {
    // Regular deals endpoint with query parameters
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.append('companyId', companyId.toString());
    if (contactId) queryParams.append('contactId', contactId.toString());
    if (status) queryParams.append('status', status);
    
    apiUrl = `/api/deals${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  }

  const {
    data: deals,
    isLoading,
    isError,
    error,
  } = useQuery<DealInfo[]>({
    queryKey: [apiUrl],
  });

  const createDeal = useMutation({
    mutationFn: async (dealData: Omit<DealInfo, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await apiRequest("POST", "/api/deals", dealData);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
      // Invalidate general deals query
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      // Invalidate specific company deals query if companyId is available
      if (variables.companyId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/companies/${variables.companyId}/deals`] 
        });
      }
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create deal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DealInfo> }) => {
      console.log(`Making API request to update deal ${id} with data:`, data);
      return await apiRequest("PATCH", `/api/deals/${id}`, data);
    },
    onSuccess: (data, variables) => {
      console.log("Deal update success:", data);
      // Only show toast notification if not updating stage from kanban view
      if (!variables.data.hasOwnProperty('stageId')) {
        toast({
          title: "Success",
          description: "Deal updated successfully",
        });
      }
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      // Also invalidate specific deal if it exists in cache
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      console.error("Deal update error:", error);
      toast({
        title: "Error",
        description: `Failed to update deal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/deals/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deal deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete deal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    deals,
    isLoading,
    isError,
    error,
    createDeal,
    updateDeal,
    deleteDeal,
  };
};

export const useDeal = (id: number) => {
  const { data, isLoading, isError, error } = useQuery<DealInfo>({
    queryKey: [`/api/deals/${id}`],
    enabled: !!id,
  });
  
  return { data, isLoading, isError, error };
};

export const usePipelineStages = () => {
  return useQuery<PipelineStage[]>({
    queryKey: ['/api/pipeline-stages'],
  });
};
