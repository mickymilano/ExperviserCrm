import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export function useUserProfile() {
  const queryClient = useQueryClient();

  // Get current user profile
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
    retry: false,
  });

  // Update user profile
  const updateProfile = useMutation({
    mutationFn: (profileData: any) => 
      apiRequest('PATCH', '/api/auth/profile', profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update user password
  const updatePassword = useMutation({
    mutationFn: (passwordData: { currentPassword: string, newPassword: string }) => 
      apiRequest('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify(passwordData),
      }),
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    updateProfile,
    updatePassword,
  };
}