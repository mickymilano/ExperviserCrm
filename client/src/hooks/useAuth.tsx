import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));

  // Get current user data if token exists
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!token, // Only fetch user data if token exists
    // We'll use the default queryFn from queryClient.ts
    // but remove our custom queryFn to fix the HTTP method error
  });

  // Set auth header for all requests and update query client
  useEffect(() => {
    if (token) {
      console.log("Token in localStorage:", token?.substring(0, 10) + "...");
      // Refetch user data when token changes
      setTimeout(() => {
        refetch();
      }, 100);
    } else {
      console.log("No token in localStorage");
      // Clear user data when token is removed
      queryClient.setQueryData(['/api/auth/me'], null);
    }
  }, [token, refetch, queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { emailOrUsername: string; password: string }) => {
      try {
        const response = await apiRequest("POST", "/api/auth/login", credentials);
        console.log("Login response:", response);
        
        if (response.token) {
          localStorage.setItem("auth_token", response.token);
          setToken(response.token);
          return response;
        }
        throw new Error("Authentication failed");
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Login successful, data:", data);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      refetch();
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        if (token) {
          await apiRequest("POST", "/api/auth/logout");
        }
        localStorage.removeItem("auth_token");
        setToken(null);
        return true;
      } catch (error) {
        console.error("Logout error:", error);
        // Always remove token even if API call fails
        localStorage.removeItem("auth_token");
        setToken(null);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  const login = async (emailOrUsername: string, password: string) => {
    return loginMutation.mutateAsync({ emailOrUsername, password });
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading && !!token,
    login,
    logout,
    loginMutation,
    logoutMutation
  };
}