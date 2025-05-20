/**
 * Importazione di contatti, aziende e lead da file CSV
 */
import Papa from 'papaparse';
import { Contact, InsertContact } from '../../../shared/schema';
import { CompanyWithContacts } from '../../../shared/types';
import { Lead } from '../../../shared/schema';

// Tipi per i risultati di importazione
export interface ImportResult {
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  errors: ImportError[];
  data: any[];
  potentialDuplicates: PotentialDuplicate[];
}

export interface ImportError {
  row: number;
  message: string;
  data: any;
}

export interface PotentialDuplicate {
  newItem: any;
  existingItems: any[];
  matchScore: number;
  fields: string[];
}

interface ImportOptions {
  // Opzioni generali
  skipHeader?: boolean;
  columnMapping?: Record<string, string>;
  onProgress?: (progress: number) => void;
  
  // Opzioni per il rilevamento duplicati
  checkDuplicates?: boolean;
  duplicateThreshold?: number; // 0-1, dove 1 richiede corrispondenza esatta
  
  // Opzioni per integrazione AI
  enhanceWithAI?: boolean;
  aiConfidenceThreshold?: number;
}

/**
 * Importa contatti da CSV 
 * @param csvContent Il contenuto del file CSV
 * @param options Opzioni di importazione
 * @returns Risultato dell'importazione
 */
export async function importFromCsv(csvContent: string, 
                                    entityType: 'contacts' | 'companies' | 'leads', 
                                    options: ImportOptions = {}): Promise<ImportResult> {
  // Configurazione di default
  const defaultOptions: ImportOptions = {
    skipHeader: true,
    checkDuplicates: true,
    duplicateThreshold: 0.8,
    enhanceWithAI: false,
    aiConfidenceThreshold: 0.7
  };
  
  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Risultato iniziale
  const result: ImportResult = {
    totalItems: 0,
    successfulItems: 0,
    failedItems: 0,
    errors: [],
    data: [],
    potentialDuplicates: []
  };
  
  try {
    // Parse del CSV con PapaParse
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => {
        // Trasforma gli header se necessario usando il mapping delle colonne
        if (mergedOptions.columnMapping && mergedOptions.columnMapping[header]) {
          return mergedOptions.columnMapping[header];
        }
        return header;
      }
    });
    
    // Aggiorna il conteggio totale
    result.totalItems = parseResult.data.length;
    
    // Processa ogni riga in base al tipo di entità
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      
      try {
        // Trasforma la riga in base al tipo di entità
        let transformedItem;
        
        switch (entityType) {
          case 'contacts':
            transformedItem = transformContactFromCsv(row);
            break;
          case 'companies':
            transformedItem = transformCompanyFromCsv(row);
            break;
          case 'leads':
            transformedItem = transformLeadFromCsv(row);
            break;
        }
        
        // Se richiesto, migliora i dati con AI
        if (mergedOptions.enhanceWithAI) {
          transformedItem = await enhanceWithAI(transformedItem, entityType, mergedOptions.aiConfidenceThreshold);
        }
        
        // Se richiesto, controlla i duplicati
        if (mergedOptions.checkDuplicates) {
          const duplicates = await checkForDuplicates(transformedItem, entityType, mergedOptions.duplicateThreshold);
          
          if (duplicates.length > 0) {
            result.potentialDuplicates.push({
              newItem: transformedItem,
              existingItems: duplicates,
              matchScore: duplicates[0].score, // Il primo è sempre il match più alto
              fields: duplicates[0].matchedFields
            });
            
            // Possiamo comunque aggiungere l'elemento ai dati, ma segnalato come potenziale duplicato
          }
        }
        
        // Aggiungi l'elemento trasformato al risultato
        result.data.push(transformedItem);
        result.successfulItems++;
        
      } catch (err) {
        result.failedItems++;
        result.errors.push({
          row: i,
          message: err.message || 'Errore sconosciuto',
          data: row
        });
      }
      
      // Aggiorna il progresso
      if (mergedOptions.onProgress) {
        mergedOptions.onProgress((i + 1) / parseResult.data.length * 100);
      }
    }
    
    return result;
    
  } catch (err) {
    throw new Error(`Errore nell'analisi del CSV: ${err.message}`);
  }
}

/**
 * Trasforma una riga CSV in un oggetto Contatto
 */
function transformContactFromCsv(row: any): Partial<Contact> {
  // Estrai i campi base (obbligatori e opzionali)
  const contact: Partial<Contact> = {
    firstName: row.firstName || row['first_name'] || row['nome'] || '',
    lastName: row.lastName || row['last_name'] || row['cognome'] || '',
    email: row.email || row['email_address'] || row['indirizzo_email'] || '',
    phone: row.phone || row['phoneNumber'] || row['telefono'] || '',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Aggiungi campi opzionali se presenti
  if (row.jobTitle || row['job_title'] || row['ruolo']) {
    contact.jobTitle = row.jobTitle || row['job_title'] || row['ruolo'];
  }
  
  if (row.company || row['company_name'] || row['azienda']) {
    contact.companyName = row.company || row['company_name'] || row['azienda'];
  }
  
  if (row.mobile || row['cellulare']) {
    contact.mobile = row.mobile || row['cellulare'];
  }
  
  if (row.address || row['indirizzo']) {
    contact.address = row.address || row['indirizzo'];
  }
  
  // Gestione dei tags
  if (row.tags || row['tag']) {
    const tagString = row.tags || row['tag'];
    contact.tags = tagString.split(',').map(tag => tag.trim());
  }
  
  // Validazione di base
  if (!contact.email && !contact.phone) {
    throw new Error('Il contatto deve avere almeno un\'email o un numero di telefono');
  }
  
  if (!contact.firstName && !contact.lastName) {
    throw new Error('Il contatto deve avere almeno nome o cognome');
  }
  
  return contact;
}

/**
 * Trasforma una riga CSV in un oggetto Azienda
 */
function transformCompanyFromCsv(row: any): Partial<CompanyWithContacts> {
  // Estrai i campi base (obbligatori e opzionali)
  const company: Partial<CompanyWithContacts> = {
    name: row.name || row['company_name'] || row['azienda'] || '',
    email: row.email || row['email_address'] || row['company_email'] || row['indirizzo_email'] || '',
    phone: row.phone || row['phoneNumber'] || row['company_phone'] || row['telefono'] || '',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    contacts: []
  };
  
  // Aggiungi campi opzionali se presenti
  if (row.website || row['sito_web']) {
    company.website = row.website || row['sito_web'];
  }
  
  if (row.address || row['indirizzo']) {
    company.address = row.address || row['indirizzo'];
  }
  
  if (row.industry || row['settore']) {
    company.industry = row.industry || row['settore'];
  }
  
  // Gestione dei tags
  if (row.tags || row['tag']) {
    const tagString = row.tags || row['tag'];
    company.tags = tagString.split(',').map(tag => tag.trim());
  }
  
  // Validazione di base
  if (!company.name) {
    throw new Error('L\'azienda deve avere un nome');
  }
  
  return company;
}

/**
 * Trasforma una riga CSV in un oggetto Lead
 */
function transformLeadFromCsv(row: any): Partial<Lead> {
  // Estrai i campi base (obbligatori e opzionali)
  const lead: Partial<Lead> = {
    name: row.name || row['lead_name'] || row['nome'] || '',
    email: row.email || row['email_address'] || row['indirizzo_email'] || '',
    phone: row.phone || row['phoneNumber'] || row['telefono'] || '',
    status: 'new', // Default per i nuovi lead
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Aggiungi campi opzionali se presenti
  if (row.source || row['fonte']) {
    lead.source = row.source || row['fonte'];
  }
  
  if (row.company || row['company_name'] || row['azienda']) {
    lead.companyName = row.company || row['company_name'] || row['azienda'];
  }
  
  // Gestione dei tags
  if (row.tags || row['tag']) {
    const tagString = row.tags || row['tag'];
    lead.tags = tagString.split(',').map(tag => tag.trim());
  }
  
  // Validazione di base
  if (!lead.name) {
    throw new Error('Il lead deve avere un nome');
  }
  
  if (!lead.email && !lead.phone) {
    throw new Error('Il lead deve avere almeno un\'email o un numero di telefono');
  }
  
  return lead;
}

/**
 * Funzione segnaposto per l'integrazione con AI
 * Andrà completata in seguito con l'API di OpenAI
 */
async function enhanceWithAI(item: any, entityType: string, confidenceThreshold: number): Promise<any> {
  // Questa è una funzione segnaposto che dovrà essere implementata con OpenAI
  // Per ora restituisce l'elemento invariato
  return item;
}

/**
 * Funzione segnaposto per il controllo dei duplicati
 * Andrà completata in seguito con l'implementazione effettiva
 */
async function checkForDuplicates(item: any, entityType: string, threshold: number): Promise<any[]> {
  // Questa è una funzione segnaposto che dovrà essere implementata con la logica di rilevamento duplicati
  // Per ora restituisce un array vuoto (nessun duplicato)
  return [];
}