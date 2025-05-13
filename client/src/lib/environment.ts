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

// Cached configuration ma con invalidazione per impedire caching eccessivo
let cachedConfig: { googleMapsApiKey: string | null } | null = null;
let cacheTimestamp = 0;

// Function to get Google Maps API key
export async function getGoogleMapsApiKey(): Promise<string | null> {
  const now = Date.now();
  const cacheLifetime = 60 * 1000; // 1 minuto

  // Invalida cache se più vecchia di 1 minuto o se non valida
  if (cachedConfig && now - cacheTimestamp < cacheLifetime) {
    console.log('Using cached Google Maps API key');
    return cachedConfig.googleMapsApiKey;
  }
  
  console.log('Fetching fresh Google Maps API key');
  cachedConfig = await fetchApiConfig();
  cacheTimestamp = now;
  
  // Log solo per debug, non mostra la chiave completa
  if (cachedConfig.googleMapsApiKey) {
    console.log('API key fetched and cached (format check):', 
      cachedConfig.googleMapsApiKey.substring(0, 6) + '...');
  } else {
    console.log('No Google Maps API key received from server');
  }
  
  return cachedConfig.googleMapsApiKey;
}