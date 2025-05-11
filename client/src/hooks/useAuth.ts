import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

// Augment the User type to remove the password field in the frontend
export type SafeUser = Omit<User, "password">;

export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we have a token - riload on every render in dev mode
  const hasToken = !!localStorage.getItem("auth_token");
  
  // Query to get the current user info
  const { 
    data: user, 
    isLoading,
    error,
    refetch
  } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: hasToken, // Only run the query if we have a token
  });

  // Debugging
  useEffect(() => {
    if (hasToken) {
      console.log("Auth token found in localStorage, length:", 
        localStorage.getItem("auth_token")?.length);
    } else {
      console.log("No auth token in localStorage");
    }
    
    console.log("User auth state:", {
      isInitialized,
      isLoading,
      hasToken,
      isAuthenticated: !!user
    });
  }, [hasToken, isLoading, isInitialized, user]);

  // Initialize auth on mount
  useEffect(() => {
    setIsInitialized(true);
    
    // Automaticamente gestito da react-query (enabled: hasToken)
  }, []);

  // Mutation to handle logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        if (!storedToken) return true; // Already logged out
        
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${storedToken}`,
            "Content-Type": "application/json"
          }
        });
        
        // Even if the server response isn't OK, we still want to log out locally
        return true;
      } catch (error) {
        console.error("Error during logout:", error);
        return true; // We still want to clear local auth state
      }
    },
    onSuccess: () => {
      // Remove the token
      localStorage.removeItem("auth_token");
      
      // Reset all auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.setQueryData(["/api/auth/me"], null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to login page
      window.location.href = "/auth/login";
    }
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading: isLoading && hasToken,
    error,
    isAuthenticated: !!user,
    logout,
    hasToken,
    logoutMutation
  };
}