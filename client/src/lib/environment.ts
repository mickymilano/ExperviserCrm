// Client-side environment variables accessor
// This helps to access environment variables safely

// Function to fetch API configuration from the server
export async function fetchApiConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch API configuration');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching API configuration:', error);
    return { googleMapsApiKey: null };
  }
}

// Cached configuration
let cachedConfig: { googleMapsApiKey: string | null } | null = null;

// Function to get Google Maps API key
export async function getGoogleMapsApiKey(): Promise<string | null> {
  if (cachedConfig) {
    return cachedConfig.googleMapsApiKey;
  }
  
  cachedConfig = await fetchApiConfig();
  return cachedConfig.googleMapsApiKey;
}