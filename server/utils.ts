/**
 * Utility per la generazione di ID univoci
 * Utile per generare ID temporanei per entità prima che vengano salvate nel database
 * @returns Un ID univoco basato su timestamp e numeri casuali
 */
export function makeGenericId(): number {
  // Genera un ID intero positivo basato sul timestamp corrente più un numero casuale
  return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
}

/**
 * Converte un array di stringhe in una stringa formattata per SQL
 * @param arr Array di stringhe da formattare
 * @returns Stringa formattata per SQL
 */
export function formatArrayForSQL(arr: string[]): string {
  if (!arr || arr.length === 0) return '{}';
  // Escape delle virgolette e formattazione per array PostgreSQL
  const escaped = arr.map(item => `"${item.replace(/"/g, '""')}"`);
  return `{${escaped.join(',')}}`;
}

/**
 * Normalizza un indirizzo email 
 * @param email Indirizzo email da normalizzare
 * @returns Indirizzo email normalizzato
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Valida un indirizzo email
 * @param email Indirizzo email da validare
 * @returns true se l'email è valida, false altrimenti
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Regex base per validazione email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Genera una risposta paginata standard
 * @param items Elementi da includere nella risposta
 * @param total Numero totale di elementi
 * @param page Numero di pagina corrente
 * @param limit Limite di elementi per pagina
 * @returns Oggetto con dati paginati
 */
export function paginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
  return {
    data: items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Pulisce un oggetto rimuovendo proprietà con valore undefined o null
 * @param obj Oggetto da pulire
 * @returns Nuovo oggetto senza proprietà undefined o null
 */
export function cleanObject<T>(obj: T): Partial<T> {
  return Object.entries(obj as any)
    .filter(([_, value]) => value !== null && value !== undefined)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

/**
 * Formatta una data in stringa leggibile in italiano
 * @param date Data da formattare
 * @returns Stringa con data formattata
 */
export function formatDateItalian(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatta un numero di telefono in formato italiano
 * @param phone Numero di telefono da formattare
 * @returns Stringa con numero formattato
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '';
  // Rimuove tutti i caratteri non numerici
  const cleaned = phone.replace(/\D/g, '');
  
  // Se è un numero italiano standard
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 10)}`;
  }
  
  // Se è un numero con prefisso internazionale
  if (cleaned.length > 10) {
    return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
  }
  
  // Fallback: restituisce il numero pulito senza formattazione
  return cleaned;
}