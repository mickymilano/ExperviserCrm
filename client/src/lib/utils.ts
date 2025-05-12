import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Unisce classi con clsx e le ottimizza con tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatta un numero come valuta
 */
export function formatCurrency(value: number, locale = 'it-IT', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Formatta una data in base alla lingua locale
 */
export function formatDate(date: Date | string | null, locale = 'it-IT'): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formatta un numero con separatori di migliaia
 */
export function formatNumber(value: number, locale = 'it-IT'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Genera un colore casuale
 */
export function getRandomColor(): string {
  const colors = [
    '#3498db', // blu
    '#2ecc71', // verde
    '#e74c3c', // rosso
    '#f39c12', // arancione
    '#9b59b6', // viola
    '#1abc9c', // verde acqua
    '#34495e', // blu scuro
    '#e67e22', // arancione scuro
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Genera le iniziali da nome e cognome
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Verifica se un valore è vuoto
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Tronca un testo lungo a una lunghezza massima
 */
export function truncateText(text: string, maxLength = 100): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Genera un ID unico
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Estrae il primo e l'ultimo nome da un nome completo
 */
export function splitFullName(fullName?: string): [string, string] {
  if (!fullName) return ['', ''];
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return [parts[0], ''];
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return [firstName, lastName];
}

/**
 * Calcola l'età da una data di nascita
 */
export function calculateAge(birthdate: Date | string | null): number {
  if (!birthdate) return 0;
  const birth = birthdate instanceof Date ? birthdate : new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Capitalizza la prima lettera di una stringa
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Ritarda l'esecuzione di una funzione (debounce)
 */
export function debounce<T extends (...args: any[]) => any>(callback: T, delay = 300): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

/**
 * Simile a debounce, ma esegue la funzione una sola volta entro un periodo di tempo (throttle)
 */
export function throttle<T extends (...args: any[]) => any>(callback: T, limit = 300): (...args: Parameters<T>) => void {
  let waiting = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(...args: Parameters<T>) {
    if (!waiting) {
      callback(...args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
        if (lastArgs) {
          callback(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}