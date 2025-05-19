import { TFunction } from 'i18next';

/**
 * Funzione di traduzione con fallback automatico
 * Accetta la chiave di traduzione e un valore di fallback
 * Utilizza il valore di fallback se la traduzione non è disponibile
 */
export function T(
  t: TFunction, 
  key: string, 
  defaultValue: string,
  options?: Record<string, any>
): string {
  // Controlla se la chiave esiste nelle traduzioni
  const hasTranslation = t.exists(key, options);
  
  // Se la chiave esiste, usa la traduzione, altrimenti usa il valore di default
  if (hasTranslation) {
    return t(key, options);
  }
  
  return defaultValue;
}