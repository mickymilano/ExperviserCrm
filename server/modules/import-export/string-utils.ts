/**
 * Utilità per la manipolazione e il confronto di stringhe
 */

/**
 * Calcola la distanza di Levenshtein tra due stringhe.
 * La distanza di Levenshtein è il numero minimo di modifiche (inserimenti, eliminazioni o sostituzioni)
 * necessarie per trasformare una stringa nell'altra.
 * 
 * @param s1 Prima stringa
 * @param s2 Seconda stringa
 * @returns Il numero di operazioni necessarie per trasformare s1 in s2
 */
export function levenshteinDistance(s1: string, s2: string): number {
  // Matrice per memorizzare i risultati intermedi
  const matrix: number[][] = [];
  
  // Inizializza la prima riga e colonna della matrice
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Riempi la matrice
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      // Se i caratteri sono uguali, non è necessaria alcuna operazione
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        // Altrimenti, prendi il minimo tra inserimento, eliminazione e sostituzione
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sostituzione
          matrix[i][j - 1] + 1,     // inserimento
          matrix[i - 1][j] + 1      // eliminazione
        );
      }
    }
  }
  
  // Il valore nell'angolo in basso a destra è la distanza di Levenshtein
  return matrix[s1.length][s2.length];
}

/**
 * Normalizza un numero di telefono in formato internazionale.
 * 
 * @param phone Numero di telefono da normalizzare
 * @returns Numero di telefono normalizzato (es. +39XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Rimuovi tutti i caratteri non numerici
  let normalizedPhone = phone.replace(/\D/g, '');
  
  // Se il numero non inizia con un prefisso internazionale, aggiungi quello italiano
  if (!normalizedPhone.startsWith('00') && !normalizedPhone.startsWith('+')) {
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '39' + normalizedPhone.substring(1);
    } else {
      normalizedPhone = '39' + normalizedPhone;
    }
  }
  
  // Sostituisci 00 con + per il prefisso internazionale
  if (normalizedPhone.startsWith('00')) {
    normalizedPhone = normalizedPhone.replace(/^00/, '+');
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+' + normalizedPhone;
  }
  
  return normalizedPhone;
}

/**
 * Estrae il dominio da un indirizzo email.
 * 
 * @param email Indirizzo email
 * @returns Dominio dell'email o stringa vuota se l'email non è valida
 */
export function extractEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return '';
  
  const parts = email.split('@');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Controlla se due domini di email sono simili o correlati.
 * Utile per identificare potenziali duplicati quando le persone usano diversi
 * servizi email della stessa azienda (e.g., gmail.com e googlemail.com).
 * 
 * @param domain1 Primo dominio
 * @param domain2 Secondo dominio
 * @returns true se i domini sono correlati, false altrimenti
 */
export function areRelatedDomains(domain1: string, domain2: string): boolean {
  if (!domain1 || !domain2) return false;
  
  // Domini identici
  if (domain1 === domain2) return true;
  
  // Coppie di domini noti che sono correlati
  const relatedPairs = [
    ['gmail.com', 'googlemail.com'],
    ['outlook.com', 'hotmail.com'],
    ['outlook.com', 'live.com'],
    ['outlook.com', 'msn.com'],
    ['yahoo.com', 'ymail.com'],
    ['icloud.com', 'me.com'],
    ['icloud.com', 'mac.com']
  ];
  
  // Controlla se i domini sono nella lista delle coppie correlate
  return relatedPairs.some(pair => 
    (pair[0] === domain1 && pair[1] === domain2) || 
    (pair[0] === domain2 && pair[1] === domain1)
  );
}