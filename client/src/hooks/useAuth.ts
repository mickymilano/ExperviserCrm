import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

// Augment the User type to remove the password field in the frontend
export type SafeUser = Omit<User, "password">;

export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we have a token
  const token = localStorage.getItem("auth_token");
  
  // Query to get the current user info
  const { 
    data: user, 
    isLoading,
    error,
    refetch
  } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          await refetch();
        } catch (err) {
          console.error("Failed to authenticate with stored token:", err);
          localStorage.removeItem("auth_token");
          window.location.href = "/auth/login";
        }
      }
      setIsInitialized(true);
    };
    
    initAuth();
  }, [token, refetch]);

  // Login function 
  const loginMutation = useMutation({
    mutationFn: async ({ emailOrUsername, password }: { emailOrUsername: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ emailOrUsername, password })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.token) {
        localStorage.setItem("auth_token", data.token);
        
        // Force a refetch of user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.fullName || data.user.username}!`,
        });
        
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        throw new Error("Invalid login response");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    }
  });

  // Mutation to handle logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) return null;
      
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${storedToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok && response.status !== 401) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.ok;
    },
    onSuccess: () => {
      // Remove the token
      localStorage.removeItem("auth_token");
      
      // Invalidate and clear the user query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.setQueryData(["/api/auth/me"], null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to login page
      window.location.href = "/auth/login";
    },
    onError: (error: any) => {
      console.error("Logout error:", error);
      
      // Even if the server-side logout fails, we still want to clear local state
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/auth/me"], null);
      
      toast({
        title: "Logout issue",
        description: "You have been logged out, but there was an issue with the server",
        variant: "destructive",
      });
      
      // Redirect to login page
      window.location.href = "/auth/login";
    }
  });
  
  const login = (emailOrUsername: string, password: string) => {
    loginMutation.mutate({ emailOrUsername, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const hasToken = !!token;

  return {
    user,
    isLoading: isLoading || !isInitialized,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasToken,
    loginMutation,
    logoutMutation
  };
}