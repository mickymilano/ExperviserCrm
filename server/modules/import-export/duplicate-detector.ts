/**
 * Sistema di rilevamento duplicati per contatti, aziende e lead
 * Supporta diverse strategie di matching e soglie di somiglianza
 */

import { Contact, Company, Lead } from '../../../shared/schema';
import { db } from '../../db';
import { contacts, companies, leads } from '../../../shared/schema';
import { eq, or, ilike, and } from 'drizzle-orm';

// Tipi per i risultati di rilevamento duplicati
export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicates: PotentialDuplicate[];
  bestMatch?: PotentialDuplicate;
}

export interface PotentialDuplicate {
  entity: any; // L'entità esistente (contatto, azienda, lead)
  score: number; // Punteggio di somiglianza (0-1)
  matchedFields: string[]; // Campi che hanno generato il match
}

interface DuplicateDetectionOptions {
  threshold?: number; // Soglia di similarità (0-1), default 0.8
  strategy?: 'exact' | 'fuzzy' | 'ai'; // Strategia di matching
  fields?: string[]; // Campi specifici da controllare
  maxResults?: number; // Numero massimo di duplicati da restituire
}

/**
 * Rileva potenziali duplicati per un nuovo contatto
 * @param entity La nuova entità da controllare
 * @param entityType Il tipo di entità (contacts, companies, leads)
 * @param options Opzioni di rilevamento duplicati
 * @returns Risultato del rilevamento duplicati
 */
export async function detectDuplicates(
  entity: any,
  entityType: 'contacts' | 'companies' | 'leads',
  options: DuplicateDetectionOptions = {}
): Promise<DuplicateDetectionResult> {
  // Opzioni di default
  const defaultOptions: DuplicateDetectionOptions = {
    threshold: 0.8,
    strategy: 'fuzzy',
    maxResults: 5
  };
  
  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Inizializza il risultato
  const result: DuplicateDetectionResult = {
    hasDuplicates: false,
    duplicates: []
  };
  
  try {
    // Rileva i duplicati in base al tipo di entità
    switch (entityType) {
      case 'contacts':
        await detectContactDuplicates(entity, result, mergedOptions);
        break;
      case 'companies':
        await detectCompanyDuplicates(entity, result, mergedOptions);
        break;
      case 'leads':
        await detectLeadDuplicates(entity, result, mergedOptions);
        break;
    }
    
    // Se ci sono duplicati, imposta il flag e il miglior match
    if (result.duplicates.length > 0) {
      result.hasDuplicates = true;
      result.bestMatch = result.duplicates[0]; // Il primo ha sempre il punteggio più alto
    }
    
    return result;
  } catch (error) {
    console.error('Errore nel rilevamento duplicati:', error);
    throw new Error(`Errore nel rilevamento duplicati: ${error.message}`);
  }
}

/**
 * Rileva duplicati per un contatto
 */
async function detectContactDuplicates(
  contact: Partial<Contact>,
  result: DuplicateDetectionResult,
  options: DuplicateDetectionOptions
): Promise<void> {
  // Array di condizioni OR per i vari campi di ricerca
  const conditions = [];
  const matchedFields: Record<number, string[]> = {}; // Mappa ID contatto -> campi corrispondenti
  
  // Controlla email (match esatto)
  if (contact.email && contact.email.trim() !== '') {
    conditions.push(eq(contacts.email, contact.email.trim()));
  }
  
  // Controlla telefono (match esatto)
  if (contact.phone && contact.phone.trim() !== '') {
    conditions.push(eq(contacts.phone, contact.phone.trim()));
  }
  
  // Controlla cellulare se presente (match esatto)
  if (contact.mobile && contact.mobile.trim() !== '') {
    conditions.push(eq(contacts.mobile, contact.mobile.trim()));
  }
  
  // Controlla combinazione nome/cognome (match parziale o esatto in base alla strategia)
  if ((contact.firstName && contact.firstName.trim() !== '') || 
      (contact.lastName && contact.lastName.trim() !== '')) {
    
    if (options.strategy === 'exact') {
      if (contact.firstName && contact.lastName) {
        conditions.push(
          and(
            eq(contacts.firstName, contact.firstName.trim()),
            eq(contacts.lastName, contact.lastName.trim())
          )
        );
      } else if (contact.firstName) {
        conditions.push(eq(contacts.firstName, contact.firstName.trim()));
      } else if (contact.lastName) {
        conditions.push(eq(contacts.lastName, contact.lastName.trim()));
      }
    } else {
      // Strategia fuzzy
      if (contact.firstName && contact.lastName) {
        conditions.push(
          and(
            ilike(contacts.firstName, `%${contact.firstName.trim()}%`),
            ilike(contacts.lastName, `%${contact.lastName.trim()}%`)
          )
        );
      } else if (contact.firstName) {
        conditions.push(ilike(contacts.firstName, `%${contact.firstName.trim()}%`));
      } else if (contact.lastName) {
        conditions.push(ilike(contacts.lastName, `%${contact.lastName.trim()}%`));
      }
    }
  }
  
  // Esegui la query se ci sono condizioni
  if (conditions.length > 0) {
    const potentialDuplicates = await db.select().from(contacts).where(or(...conditions));
    
    // Calcola il punteggio di somiglianza per ogni potenziale duplicato
    const scoredDuplicates: PotentialDuplicate[] = [];
    
    for (const dup of potentialDuplicates) {
      const matchedFields: string[] = [];
      let score = 0;
      let totalFields = 0;
      
      // Controlla i campi principali
      if (contact.email && dup.email && 
          contact.email.toLowerCase() === dup.email.toLowerCase()) {
        score += 0.4; // Email ha un peso maggiore
        matchedFields.push('email');
      }
      totalFields += 1;
      
      if (contact.phone && dup.phone && 
          normalizePhone(contact.phone) === normalizePhone(dup.phone)) {
        score += 0.25;
        matchedFields.push('phone');
      }
      totalFields += 1;
      
      if (contact.mobile && dup.mobile && 
          normalizePhone(contact.mobile) === normalizePhone(dup.mobile)) {
        score += 0.25;
        matchedFields.push('mobile');
      }
      totalFields += 1;
      
      if (contact.firstName && dup.firstName && 
          stringSimilarity(contact.firstName, dup.firstName) > 0.8) {
        score += 0.15;
        matchedFields.push('firstName');
      }
      totalFields += 1;
      
      if (contact.lastName && dup.lastName && 
          stringSimilarity(contact.lastName, dup.lastName) > 0.8) {
        score += 0.15;
        matchedFields.push('lastName');
      }
      totalFields += 1;
      
      if (contact.companyName && dup.companyName && 
          stringSimilarity(contact.companyName, dup.companyName) > 0.7) {
        score += 0.1;
        matchedFields.push('companyName');
      }
      totalFields += 1;
      
      // Normalizza il punteggio (0-1)
      const normalizedScore = score / Math.min(1.3, totalFields); // Cap a 1
      
      // Aggiungi solo se supera la soglia
      if (normalizedScore >= options.threshold) {
        scoredDuplicates.push({
          entity: dup,
          score: normalizedScore,
          matchedFields
        });
      }
    }
    
    // Ordina per punteggio (decrescente) e limita i risultati
    scoredDuplicates.sort((a, b) => b.score - a.score);
    result.duplicates = scoredDuplicates.slice(0, options.maxResults || 5);
  }
}

/**
 * Rileva duplicati per un'azienda
 */
async function detectCompanyDuplicates(
  company: Partial<Company>,
  result: DuplicateDetectionResult,
  options: DuplicateDetectionOptions
): Promise<void> {
  // Array di condizioni OR per i vari campi di ricerca
  const conditions = [];
  
  // Controlla nome (match esatto o fuzzy in base alla strategia)
  if (company.name && company.name.trim() !== '') {
    if (options.strategy === 'exact') {
      conditions.push(eq(companies.name, company.name.trim()));
    } else {
      conditions.push(ilike(companies.name, `%${company.name.trim()}%`));
    }
  }
  
  // Controlla email (match esatto)
  if (company.email && company.email.trim() !== '') {
    conditions.push(eq(companies.email, company.email.trim()));
  }
  
  // Controlla telefono (match esatto)
  if (company.phone && company.phone.trim() !== '') {
    conditions.push(eq(companies.phone, company.phone.trim()));
  }
  
  // Controlla website (match esatto o normalizzato)
  if (company.website && company.website.trim() !== '') {
    const normalizedWebsite = normalizeWebsite(company.website.trim());
    conditions.push(ilike(companies.website, `%${normalizedWebsite}%`));
  }
  
  // Esegui la query se ci sono condizioni
  if (conditions.length > 0) {
    const potentialDuplicates = await db.select().from(companies).where(or(...conditions));
    
    // Calcola il punteggio di somiglianza per ogni potenziale duplicato
    const scoredDuplicates: PotentialDuplicate[] = [];
    
    for (const dup of potentialDuplicates) {
      const matchedFields: string[] = [];
      let score = 0;
      let totalFields = 0;
      
      // Controlla i campi principali
      if (company.name && dup.name && 
          stringSimilarity(company.name, dup.name) > 0.8) {
        score += 0.4; // Nome ha un peso maggiore
        matchedFields.push('name');
      }
      totalFields += 1;
      
      if (company.email && dup.email && 
          company.email.toLowerCase() === dup.email.toLowerCase()) {
        score += 0.25;
        matchedFields.push('email');
      }
      totalFields += 1;
      
      if (company.phone && dup.phone && 
          normalizePhone(company.phone) === normalizePhone(dup.phone)) {
        score += 0.2;
        matchedFields.push('phone');
      }
      totalFields += 1;
      
      if (company.website && dup.website) {
        const normalizedWeb1 = normalizeWebsite(company.website);
        const normalizedWeb2 = normalizeWebsite(dup.website);
        if (normalizedWeb1 === normalizedWeb2) {
          score += 0.25;
          matchedFields.push('website');
        }
      }
      totalFields += 1;
      
      if (company.address && dup.address && 
          stringSimilarity(company.address, dup.address) > 0.8) {
        score += 0.15;
        matchedFields.push('address');
      }
      totalFields += 1;
      
      // Normalizza il punteggio (0-1)
      const normalizedScore = score / Math.min(1.25, totalFields); // Cap a 1
      
      // Aggiungi solo se supera la soglia
      if (normalizedScore >= options.threshold) {
        scoredDuplicates.push({
          entity: dup,
          score: normalizedScore,
          matchedFields
        });
      }
    }
    
    // Ordina per punteggio (decrescente) e limita i risultati
    scoredDuplicates.sort((a, b) => b.score - a.score);
    result.duplicates = scoredDuplicates.slice(0, options.maxResults || 5);
  }
}

/**
 * Rileva duplicati per un lead
 */
async function detectLeadDuplicates(
  lead: Partial<Lead>,
  result: DuplicateDetectionResult,
  options: DuplicateDetectionOptions
): Promise<void> {
  // Array di condizioni OR per i vari campi di ricerca
  const conditions = [];
  
  // Controlla nome (match esatto o fuzzy in base alla strategia)
  if (lead.name && lead.name.trim() !== '') {
    if (options.strategy === 'exact') {
      conditions.push(eq(leads.name, lead.name.trim()));
    } else {
      conditions.push(ilike(leads.name, `%${lead.name.trim()}%`));
    }
  }
  
  // Controlla email (match esatto)
  if (lead.email && lead.email.trim() !== '') {
    conditions.push(eq(leads.email, lead.email.trim()));
  }
  
  // Controlla telefono (match esatto)
  if (lead.phone && lead.phone.trim() !== '') {
    conditions.push(eq(leads.phone, lead.phone.trim()));
  }
  
  // Esegui la query se ci sono condizioni
  if (conditions.length > 0) {
    const potentialDuplicates = await db.select().from(leads).where(or(...conditions));
    
    // Calcola il punteggio di somiglianza per ogni potenziale duplicato
    const scoredDuplicates: PotentialDuplicate[] = [];
    
    for (const dup of potentialDuplicates) {
      const matchedFields: string[] = [];
      let score = 0;
      let totalFields = 0;
      
      // Controlla i campi principali
      if (lead.name && dup.name && 
          stringSimilarity(lead.name, dup.name) > 0.8) {
        score += 0.3; 
        matchedFields.push('name');
      }
      totalFields += 1;
      
      if (lead.email && dup.email && 
          lead.email.toLowerCase() === dup.email.toLowerCase()) {
        score += 0.35; // Email ha un peso maggiore per i lead
        matchedFields.push('email');
      }
      totalFields += 1;
      
      if (lead.phone && dup.phone && 
          normalizePhone(lead.phone) === normalizePhone(dup.phone)) {
        score += 0.25;
        matchedFields.push('phone');
      }
      totalFields += 1;
      
      if (lead.companyName && dup.companyName && 
          stringSimilarity(lead.companyName, dup.companyName) > 0.7) {
        score += 0.2;
        matchedFields.push('companyName');
      }
      totalFields += 1;
      
      // Normalizza il punteggio (0-1)
      const normalizedScore = score / Math.min(1.1, totalFields); // Cap a 1
      
      // Aggiungi solo se supera la soglia
      if (normalizedScore >= options.threshold) {
        scoredDuplicates.push({
          entity: dup,
          score: normalizedScore,
          matchedFields
        });
      }
    }
    
    // Ordina per punteggio (decrescente) e limita i risultati
    scoredDuplicates.sort((a, b) => b.score - a.score);
    result.duplicates = scoredDuplicates.slice(0, options.maxResults || 5);
  }
}

// Funzioni di utilità

/**
 * Calcola la similarità tra due stringhe (Levenshtein distance-based)
 * @returns Valore tra 0 e 1, dove 1 = stringhe identiche
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;
  
  // Normalizza le stringhe
  const a = str1.toLowerCase().trim();
  const b = str2.toLowerCase().trim();
  
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  // Implementazione semplificata della distanza di Levenshtein
  const matrix = [];
  
  // Inizializza la prima riga
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  // Inizializza la prima colonna
  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  
  // Riempi la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sostituzione
          Math.min(
            matrix[i][j - 1] + 1, // inserimento
            matrix[i - 1][j] + 1 // cancellazione
          )
        );
      }
    }
  }
  
  // Calcola la similarità
  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  
  // Normalizza la distanza in un punteggio di similarità (0-1)
  return 1 - distance / maxLength;
}

/**
 * Normalizza un numero di telefono per il confronto
 * Rimuove spazi, trattini, parentesi e altri caratteri non numerici
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Rimuovi tutti i caratteri non numerici
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Normalizza un URL per il confronto
 * Rimuove http/https, www, e trailing slashes
 */
function normalizeWebsite(url: string): string {
  if (!url) return '';
  
  // Rimuovi protocollo (http://, https://)
  let normalized = url.toLowerCase().replace(/^https?:\/\//, '');
  
  // Rimuovi www.
  normalized = normalized.replace(/^www\./i, '');
  
  // Rimuovi trailing slash
  normalized = normalized.replace(/\/+$/, '');
  
  return normalized;
}