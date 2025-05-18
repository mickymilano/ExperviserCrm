import { db } from "../../db";
import { companies } from "../../../shared/schema";
import { emails } from "../../../shared/email/schema";
import { eq, like, sql } from "drizzle-orm";

interface DomainCompanyMatch {
  companyId: number;
  confidence: number; // 0-100% di confidenza
  existingCompany: boolean;
}

/**
 * Elabora il dominio email per trovare un'azienda corrispondente o creare una nuova
 * @param domain Dominio email (es. "example.com")
 * @param fullEmail Email completa per riferimento
 * @returns ID dell'azienda associata o null
 */
export async function processDomainForCompany(domain: string, fullEmail: string): Promise<number | null> {
  try {
    // 1. Cerca una corrispondenza esatta nel database
    const existingCompanies = await findCompaniesByDomain(domain);
    
    if (existingCompanies.length > 0) {
      // Usa la prima azienda trovata (in futuro si potrebbe implementare un sistema di selezione più sofisticato)
      return existingCompanies[0].id;
    }
    
    // 2. Nessuna azienda trovata, estrai il nome dal dominio
    const companyName = extractCompanyNameFromDomain(domain);
    
    // 3. Cerca aziende con nomi simili per potenziale match
    const similarCompanies = await findCompaniesByName(companyName);
    
    if (similarCompanies.length > 0) {
      // Usa la prima azienda con nome simile
      return similarCompanies[0].id;
    }
    
    // 4. Nessuna azienda trovata, crea una nuova azienda da verificare in futuro
    // Nota: in un sistema reale, potrebbe essere meglio creare una "company suggestion" invece
    // di creare automaticamente un'azienda senza intervento umano
    
    // Per ora, ritorna null (nessuna azienda associata)
    return null;
  } catch (error) {
    console.error('Errore durante l\'elaborazione del dominio:', error);
    return null;
  }
}

/**
 * Trova aziende esistenti in base al dominio email
 */
async function findCompaniesByDomain(domain: string): Promise<{ id: number, name: string }[]> {
  // Cerca prima nel campo website
  const companiesByWebsite = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(sql`${companies.website} LIKE ${'%' + domain + '%'}`);
    
  // Cerca anche nel campo email (potrebbe contenere @domain.com)
  const companiesByEmail = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(sql`${companies.email} LIKE ${'%@' + domain}`);
    
  // Unisci i risultati, eliminando eventuali duplicati
  const allCompanies = [...companiesByWebsite];
  for (const company of companiesByEmail) {
    if (!allCompanies.some(c => c.id === company.id)) {
      allCompanies.push(company);
    }
  }
  
  return allCompanies;
}

/**
 * Trova aziende con nomi simili al nome estratto dal dominio
 */
async function findCompaniesByName(companyName: string): Promise<{ id: number, name: string }[]> {
  // Se il nome è troppo corto, salta la ricerca per evitare falsi positivi
  if (companyName.length < 4) return [];
  
  return await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(sql`LOWER(${companies.name}) LIKE LOWER(${'%' + companyName + '%'})`)
    .limit(5);
}

/**
 * Estrae un potenziale nome azienda da un dominio email
 */
function extractCompanyNameFromDomain(domain: string): string {
  // Rimuovi l'estensione del dominio (.com, .it, ecc.)
  const baseDomain = domain.split('.')[0];
  
  // Converti parole separate da trattini o punti in spazi
  const nameWithSpaces = baseDomain.replace(/[-_.]/g, ' ');
  
  // Normalizza la capitalizzazione (prima lettera maiuscola)
  return nameWithSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}