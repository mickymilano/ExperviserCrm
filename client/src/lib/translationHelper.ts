/**
 * Helper di traduzione con fallback per garantire che ci sia sempre un testo in italiano
 * anche se la chiave di traduzione non viene trovata
 * 
 * @param t - Funzione di traduzione da i18next
 * @param key - Chiave di traduzione
 * @param fallback - Testo in italiano da usare come fallback
 * @returns - Il testo tradotto o il fallback
 */
export const T = (t: any, key: string, fallback: string): string => {
  const translation = t(key, { defaultValue: fallback });
  return translation === key ? fallback : translation;
};