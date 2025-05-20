import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Meeting } from "../types";
import { useToast } from "./use-toast";

export const useMeetings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: meetings,
    isLoading,
    isError,
    error,
  } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const createMeeting = useMutation({
    mutationFn: async (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest("POST", "/api/meetings", meetingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to schedule meeting: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Meeting> }) => {
      const response = await apiRequest("PATCH", `/api/meetings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update meeting: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting canceled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel meeting: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    meetings,
    isLoading,
    isError,
    error,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
};

export const useMeeting = (id: number) => {
  return useQuery<Meeting>({
    queryKey: [`/api/meetings/${id}`],
    enabled: !!id,
  });
};
