/**
 * Modulo per il rilevamento di duplicati nei dati importati
 * Implementa algoritmi di fuzzy matching e confronto basato su similarità
 */

import { levenshteinDistance } from './string-utils';

/**
 * Calcola un punteggio di similarità tra due stringhe
 * @param str1 Prima stringa da confrontare
 * @param str2 Seconda stringa da confrontare
 * @returns Punteggio tra 0 (nessuna similarità) e 1 (identiche)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1; // Entrambe vuote sono considerate uguali
  if (!str1 || !str2) return 0; // Una vuota e l'altra no sono considerate diverse
  
  // Normalizza le stringhe per il confronto
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1; // Stringhe identiche
  
  // Calcola la distanza di Levenshtein (numero di modifiche necessarie per trasformare una stringa nell'altra)
  const distance = levenshteinDistance(s1, s2);
  
  // Normalizza il punteggio in base alla lunghezza della stringa più lunga
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1; // Entrambe vuote
  
  // Converte la distanza in un punteggio di similarità (1 - distanza/maxLength)
  return 1 - distance / maxLength;
}

/**
 * Calcola un punteggio di similarità tra due email
 * @param email1 Prima email da confrontare
 * @param email2 Seconda email da confrontare
 * @returns Punteggio tra 0 (nessuna similarità) e 1 (identiche)
 */
export function emailSimilarity(email1: string, email2: string): number {
  if (!email1 && !email2) return 1;
  if (!email1 || !email2) return 0;
  
  const e1 = email1.toLowerCase().trim();
  const e2 = email2.toLowerCase().trim();
  
  if (e1 === e2) return 1;
  
  // Estrai le parti dell'email
  const [username1, domain1] = e1.split('@');
  const [username2, domain2] = e2.split('@');
  
  if (!username1 || !domain1 || !username2 || !domain2) {
    // Se una delle email non è ben formata, usa la similarità delle stringhe
    return stringSimilarity(e1, e2);
  }
  
  // Confronta separatamente username e domain
  const usernameSimilarity = stringSimilarity(username1, username2);
  const domainSimilarity = stringSimilarity(domain1, domain2);
  
  // Il dominio ha un peso maggiore nella similarità delle email
  return (usernameSimilarity * 0.4) + (domainSimilarity * 0.6);
}

/**
 * Calcola un punteggio di similarità tra due numeri di telefono
 * @param phone1 Primo numero di telefono
 * @param phone2 Secondo numero di telefono
 * @returns Punteggio tra 0 (nessuna similarità) e 1 (identici)
 */
export function phoneSimilarity(phone1: string, phone2: string): number {
  if (!phone1 && !phone2) return 1;
  if (!phone1 || !phone2) return 0;
  
  // Normalizza i numeri di telefono rimuovendo tutti i caratteri non numerici
  const p1 = phone1.replace(/\D/g, '');
  const p2 = phone2.replace(/\D/g, '');
  
  if (p1 === p2) return 1;
  
  // Se uno dei numeri è contenuto nell'altro (es. con/senza prefisso)
  if (p1.includes(p2) || p2.includes(p1)) {
    const minLength = Math.min(p1.length, p2.length);
    const maxLength = Math.max(p1.length, p2.length);
    return minLength / maxLength;
  }
  
  // Altrimenti usa la distanza di Levenshtein come fallback
  return stringSimilarity(p1, p2);
}

/**
 * Calcola un punteggio di similarità generale tra due oggetti
 * @param obj1 Primo oggetto
 * @param obj2 Secondo oggetto
 * @param entityType Tipo di entità (contacts, companies, deals)
 * @returns Punteggio tra 0 (nessuna similarità) e 1 (identici)
 */
export function getDistanceScore(
  obj1: Record<string, any>, 
  obj2: Record<string, any>,
  entityType: string
): number {
  // Differenti campi hanno diversi pesi in base all'importanza
  let weights: Record<string, number> = {};
  let scores: Record<string, number> = {};
  let totalWeight = 0;
  
  if (entityType === 'contacts') {
    // Configura i pesi per i contatti
    weights = {
      email: 0.5,       // L'email ha il peso maggiore
      phone: 0.3,       // Il telefono è abbastanza importante
      firstName: 0.1,   // Nome e cognome hanno un peso minore
      lastName: 0.1
    };
    
    // Calcola i punteggi per ciascun campo
    if (obj1.email && obj2.email) {
      scores.email = emailSimilarity(obj1.email, obj2.email);
      totalWeight += weights.email;
    }
    
    if (obj1.phone && obj2.phone) {
      scores.phone = phoneSimilarity(obj1.phone, obj2.phone);
      totalWeight += weights.phone;
    }
    
    if (obj1.firstName && obj2.firstName) {
      scores.firstName = stringSimilarity(obj1.firstName, obj2.firstName);
      totalWeight += weights.firstName;
    }
    
    if (obj1.lastName && obj2.lastName) {
      scores.lastName = stringSimilarity(obj1.lastName, obj2.lastName);
      totalWeight += weights.lastName;
    }
  } else if (entityType === 'companies') {
    // Configura i pesi per le aziende
    weights = {
      name: 0.4,       // Il nome dell'azienda ha il peso maggiore
      website: 0.3,     // Il sito web è molto importante
      phone: 0.15,      // Telefono e email hanno un peso minore
      email: 0.15
    };
    
    // Calcola i punteggi per ciascun campo
    if (obj1.name && obj2.name) {
      scores.name = stringSimilarity(obj1.name, obj2.name);
      totalWeight += weights.name;
    }
    
    if (obj1.website && obj2.website) {
      scores.website = stringSimilarity(obj1.website, obj2.website);
      totalWeight += weights.website;
    }
    
    if (obj1.phone && obj2.phone) {
      scores.phone = phoneSimilarity(obj1.phone, obj2.phone);
      totalWeight += weights.phone;
    }
    
    if (obj1.email && obj2.email) {
      scores.email = emailSimilarity(obj1.email, obj2.email);
      totalWeight += weights.email;
    }
  } else if (entityType === 'deals') {
    // Configura i pesi per le opportunità
    weights = {
      name: 0.4,        // Il nome dell'opportunità ha il peso maggiore
      companyId: 0.4,   // L'azienda associata è molto importante
      contactId: 0.2    // Il contatto associato ha un peso minore
    };
    
    // Calcola i punteggi per ciascun campo
    if (obj1.name && obj2.name) {
      scores.name = stringSimilarity(obj1.name, obj2.name);
      totalWeight += weights.name;
    }
    
    if (obj1.companyId && obj2.companyId) {
      scores.companyId = obj1.companyId === obj2.companyId ? 1 : 0;
      totalWeight += weights.companyId;
    }
    
    if (obj1.contactId && obj2.contactId) {
      scores.contactId = obj1.contactId === obj2.contactId ? 1 : 0;
      totalWeight += weights.contactId;
    }
  }
  
  // Calcola il punteggio ponderato complessivo
  if (totalWeight === 0) return 0;
  
  let weightedScore = 0;
  for (const key in scores) {
    weightedScore += scores[key] * weights[key];
  }
  
  return weightedScore / totalWeight;
}