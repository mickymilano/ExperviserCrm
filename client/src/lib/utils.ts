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
 * Alias for formatDate to maintain compatibility with existing code
 */
export function formatDateToLocal(date: Date | string, locale = 'it-IT'): string {
  return formatDate(date, locale);
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

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Rimuovi tutti i caratteri non numerici
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatta in base alla lunghezza
  if (cleaned.length === 10) { // US format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) { // US with country code
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  } else if (cleaned.length > 10) { // International format
    return `+${cleaned.slice(0, cleaned.length-10)} ${cleaned.slice(cleaned.length-10, cleaned.length-7)} ${cleaned.slice(cleaned.length-7, cleaned.length-4)} ${cleaned.slice(cleaned.length-4)}`;
  }
  
  // Fallback per formati sconosciuti o incompleti
  return phone;
}

export function generateAvatarColor(text: string): string {
  if (!text) return 'hsl(0, 0%, 75%)';
  
  // Generazione deterministica del colore basata sulla stringa
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Usa il valore hash per creare un colore HSL con saturazione e luminosità fisse
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Estrae le iniziali da un nome completo
 * Es: "Mario Rossi" -> "MR" o da nome e cognome separati
 */
export function getInitials(firstName: string, lastName?: string): string {
  if (!firstName && !lastName) return '';
  
  if (lastName) {
    // Se abbiamo nome e cognome separati
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  } else {
    // Modalità compatibile all'indietro per un singolo nome completo
    return firstName
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2); // Prendi massimo 2 lettere
  }
}