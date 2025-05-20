import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { toast } from "./use-toast";

// Hook for fetching all leads
export function useLeads() {
  return useQuery({
    queryKey: ["/api/leads"],
  });
}

// Hook for fetching a single lead by ID
export function useLead(id: number) {
  return useQuery({
    queryKey: [`/api/leads/${id}`],
    enabled: !!id,
  });
}

// Hook for creating a new lead
export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/leads", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead created",
        description: "The lead has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead.",
        variant: "destructive",
      });
    },
  });
}

// Hook for updating a lead
export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/leads/${id}`, "PATCH", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.id}`] });
      toast({
        title: "Lead updated",
        description: "The lead has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
        variant: "destructive",
      });
    },
  });
}

// Hook for deleting a lead
export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/leads/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead deleted",
        description: "The lead has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead.",
        variant: "destructive",
      });
    },
  });
}

// Hook for converting a lead to a contact
export function useConvertLeadToContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: number; data?: any }) => 
      apiRequest(`/api/leads/${leadId}/convert`, "POST", data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Lead converted",
        description: "The lead has been successfully converted to a contact.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to contact.",
        variant: "destructive",
      });
    },
  });
}