import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Unisce classi CSS con supporto Tailwind
 * Utile per combinare classi condizionali e evitare conflitti
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatta una data in formato localizzato
 */
export function formatDate(date: Date | string, locale = 'it-IT'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatta una data e ora in formato localizzato
 */
export function formatDateTime(date: Date | string, locale = 'it-IT'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatta un valore monetario in euro
 */
export function formatCurrency(value: number, locale = 'it-IT', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatta un numero con le impostazioni locali
 */
export function formatNumber(value: number, locale = 'it-IT'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Tronca il testo se è più lungo di maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Restituisce le iniziali da una stringa (es. "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Ritardo di esecuzione (utile per debounce)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Restituisce un colore casuale ma coerente basato su una stringa
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 40%)`;
}

/**
 * Genera un array di elementi, utile per dummy lists e skeletons
 */
export function generateArray(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/** 
 * Rimuove i caratteri non numerici e inserisce uno spazio ogni 3 cifre
 * es. "1234567890" → "123 456 789 0"
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ");
}

/**
 * Genera un colore esadecimale a partire da un nome.
 * Utilizza un semplice hashing per ottenere sempre lo stesso colore per lo stesso input.
 */
export function generateAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // calcolo hash
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // genera 3 componenti RGB da hash
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}