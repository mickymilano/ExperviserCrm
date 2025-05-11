import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Makes an API request with the standard format
 * @param method The HTTP method to use (GET, POST, PATCH, DELETE, etc.)
 * @param url The URL to make the request to
 * @param data Optional data to send with the request
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method,
      credentials: "include",
      headers: {}
    };

    // Add Content-Type and body for requests with data
    if (data && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.headers = { 
        ...fetchOptions.headers,
        "Content-Type": "application/json" 
      };
      fetchOptions.body = JSON.stringify(data);
    }

    // Check for auth token and add it if not already in headers
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${token}`
      };
      console.log(`API Request: ${method} ${url} with token ${token.substring(0, 10)}...`);
    } else {
      console.log(`API Request: ${method} ${url} without token`);
    }

    const res = await fetch(url, fetchOptions);
    
    // Handle unauthorized errors specially
    if (res.status === 401) {
      console.error(`Unauthorized API error for ${method} ${url}`, res.statusText);
      throw new Error(`Authentication required for ${url}`);
    }
    
    await throwIfResNotOk(res);
    
    // For DELETE requests or endpoints that return no content
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    try {
      const data = await res.json();
      return data as T;
    } catch (e) {
      // Return empty object if no JSON is returned
      console.warn("Failed to parse JSON response", e);
      return {} as T;
    }
  } catch (error) {
    console.error(`API request error for ${method} ${url}:`, error);
    throw error;
  }
}

/**
 * Legacy API request format
 * @deprecated Use apiRequest(url, options) instead
 */
export async function legacyApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
  };

  if (data) {
    fetchOptions.headers = { "Content-Type": "application/json" };
    fetchOptions.body = JSON.stringify(data);
  }

  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Add Authorization header with token if available
      const headers: HeadersInit = {};
      const token = localStorage.getItem("auth_token");
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      console.log("QueryFn for:", queryKey[0], "Token exists:", !!token, "Token length:", token?.length || 0);
      
      // Check if the queryKey is a string (a URL)
      const url = typeof queryKey[0] === 'string' ? queryKey[0] : '/api/missing';
      
      const res = await fetch(url, {
        method: 'GET',
        credentials: "include",
        headers
      });
  
      // When 401 and not a data endpoint that should be null when not authenticated
      if (res.status === 401) {
        console.log(`401 Unauthorized for ${url}`);
        
        // If this is not the 'me' endpoint and behavior is set to throw, redirect to login
        // instead of totally failing
        if (url !== '/api/auth/me' && unauthorizedBehavior === "throw") {
          console.log("Non-me endpoint failed auth, redirecting to login");
          const storedToken = localStorage.getItem("auth_token");
          if (storedToken) {
            console.log("Token exists but invalid, removing it");
            localStorage.removeItem("auth_token");
          }
          if (typeof window !== 'undefined') {
            // Don't redirect if we're already on the login page
            if (!window.location.pathname.includes('/auth/login')) {
              window.location.replace('/auth/login');
            }
          }
          return null;
        }
        
        // For explicit "returnNull" behavior
        if (unauthorizedBehavior === "returnNull") {
          console.log("401 Unauthorized, returning null as configured");
          return null;
        }
      }
  
      await throwIfResNotOk(res);
      
      try {
        return await res.json();
      } catch (e) {
        console.warn("Failed to parse JSON response", e);
        return {} as T;
      }
    } catch (error) {
      console.error("Query error:", error);
      if (unauthorizedBehavior === "returnNull") {
        console.log("Returning null due to error");
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
      retry: 1, // retry once
    },
    mutations: {
      retry: false,
    },
  },
});
