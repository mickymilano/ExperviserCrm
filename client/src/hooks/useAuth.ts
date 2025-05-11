import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

// Augment the User type to remove the password field in the frontend
export type SafeUser = Omit<User, "password">;

export function useAuth() {
  const queryClient = useQueryClient();

  // Check if we have a token
  const token = localStorage.getItem("auth_token");
  
  // Query to get the current user info
  const { 
    data: user, 
    isLoading,
    error
  } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      
      // apiRequest will automatically add the token from localStorage
      return apiRequest("GET", "/api/auth/me");
    },
    enabled: !!token, // Only run this query if we have a token
    retry: false, // Don't retry on error (e.g., if token is invalid)
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to handle logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!token) return;
      
      // apiRequest will automatically add the token from localStorage
      return apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Remove the token
      localStorage.removeItem("auth_token");
      
      // Invalidate the user query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.setQueryData(["/api/auth/me"], null);
      
      // Redirect to login page
      window.location.href = "/auth/login";
    }
  });

  // Login function (to be used in login form)
  const login = async (emailOrUsername: string, password: string) => {
    try {
      const result = await apiRequest("POST", "/api/auth/login", { 
        emailOrUsername, 
        password 
      });
      
      if (result && result.token) {
        localStorage.setItem("auth_token", result.token);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        return result;
      }
      
      throw new Error("Invalid login response");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    token
  };
}