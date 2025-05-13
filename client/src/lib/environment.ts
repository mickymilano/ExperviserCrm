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

// Interfaccia per la configurazione API
interface ApiConfig {
  googleMapsApiKey: string | null;
  timestamp?: number;
  error?: string;
}

// Cached configuration ma con invalidazione per impedire caching eccessivo
let cachedConfig: ApiConfig | null = null;
let cacheTimestamp = 0;

// Function to get Google Maps API key
export async function getGoogleMapsApiKey(): Promise<string | null> {
  const now = Date.now();
  const cacheLifetime = 30 * 1000; // 30 secondi

  // Invalida cache se più vecchia di 30 secondi o se non valida
  if (cachedConfig && now - cacheTimestamp < cacheLifetime) {
    console.log('Using cached Google Maps API key');
    return cachedConfig.googleMapsApiKey;
  }
  
  console.log('Fetching fresh Google Maps API key');
  
  try {
    const config = await fetchApiConfig();
    cachedConfig = config;
    cacheTimestamp = now;
    
    // Log solo per debug
    if (config.error) {
      console.error('Error from API config endpoint:', config.error);
      return null;
    }
    
    if (!config.googleMapsApiKey) {
      console.warn('No Google Maps API key received from server');
      return null;
    }
    
    console.log('API key fetched and cached (format check):', 
      config.googleMapsApiKey.substring(0, 6) + '...');
    
    return config.googleMapsApiKey;
  } catch (error) {
    console.error('Failed to fetch API config:', error);
    return null;
  }
}