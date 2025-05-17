import { queryClient } from "./queryClient";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: any;
  headers?: Record<string, string>;
}

/**
 * Wrapper per eseguire richieste API con gestione coerente degli errori
 * @param url - URL dell'API endpoint
 * @param options - Opzioni della richiesta
 * @returns - Promise con i dati della risposta
 */
export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const { method = "GET", data, headers = {} } = options;

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Includi i cookie per l'autenticazione
  };

  // Aggiungi il body per richieste non-GET
  if (method !== "GET" && data !== undefined) {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, requestOptions);

    // Controlla errori HTTP
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // Controlla se la risposta è vuota
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`API request error (${url}):`, error);
    throw error;
  }
}