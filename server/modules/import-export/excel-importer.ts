/**
 * Importazione di contatti, aziende e lead da file Excel
 */
import * as ExcelJS from 'exceljs';
import { Contact, InsertContact } from '../../../shared/schema';
import { CompanyWithContacts } from '../../../shared/types';
import { Lead } from '../../../shared/schema';
import { ImportResult, ImportError, PotentialDuplicate } from './csv-importer';

interface ImportOptions {
  // Opzioni generali
  skipHeader?: boolean;
  columnMapping?: Record<string, string>;
  sheetName?: string; // Per scegliere un foglio specifico dal file Excel
  onProgress?: (progress: number) => void;
  
  // Opzioni per il rilevamento duplicati
  checkDuplicates?: boolean;
  duplicateThreshold?: number; // 0-1, dove 1 richiede corrispondenza esatta
  
  // Opzioni per integrazione AI
  enhanceWithAI?: boolean;
  aiConfidenceThreshold?: number;
}

/**
 * Importa entità da file Excel (buffer o file locale)
 * @param excelBuffer Buffer contenente il file Excel
 * @param entityType Tipo di entità da importare
 * @param options Opzioni di importazione
 * @returns Risultato dell'importazione
 */
export async function importFromExcel(
  excelBuffer: Buffer,
  entityType: 'contacts' | 'companies' | 'leads',
  options: ImportOptions = {}
): Promise<ImportResult> {
  // Configurazione di default
  const defaultOptions: ImportOptions = {
    skipHeader: true,
    checkDuplicates: true,
    duplicateThreshold: 0.8,
    enhanceWithAI: false,
    aiConfidenceThreshold: 0.7,
    sheetName: 'Sheet1' // Foglio predefinito
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
    // Carica il file Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer);
    
    // Ottieni il foglio di lavoro (se specificato o il primo foglio)
    let worksheet;
    if (mergedOptions.sheetName) {
      worksheet = workbook.getWorksheet(mergedOptions.sheetName);
      if (!worksheet) {
        throw new Error(`Foglio "${mergedOptions.sheetName}" non trovato nel file Excel`);
      }
    } else {
      worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Nessun foglio trovato nel file Excel');
      }
    }
    
    // Ottieni le intestazioni (prima riga)
    const headers: string[] = [];
    if (worksheet.rowCount > 0) {
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        let header = cell.value?.toString() || `Colonna${colNumber}`;
        
        // Applica mappatura colonne se specificata
        if (mergedOptions.columnMapping && mergedOptions.columnMapping[header]) {
          header = mergedOptions.columnMapping[header];
        }
        
        headers[colNumber - 1] = header;
      });
    } else {
      throw new Error('Il file Excel non contiene righe');
    }
    
    // Determina il numero di righe
    const rowCount = worksheet.rowCount;
    result.totalItems = rowCount - (mergedOptions.skipHeader ? 1 : 0);
    
    // Processa ogni riga
    const startRow = mergedOptions.skipHeader ? 2 : 1;
    for (let rowIndex = startRow; rowIndex <= rowCount; rowIndex++) {
      try {
        const row = worksheet.getRow(rowIndex);
        const rowData: Record<string, any> = {};
        
        // Estrai i dati dalla riga
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        // Trasforma la riga in base al tipo di entità
        let transformedItem;
        
        switch (entityType) {
          case 'contacts':
            transformedItem = transformContactFromExcel(rowData);
            break;
          case 'companies':
            transformedItem = transformCompanyFromExcel(rowData);
            break;
          case 'leads':
            transformedItem = transformLeadFromExcel(rowData);
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
          }
        }
        
        // Aggiungi l'elemento trasformato al risultato
        result.data.push(transformedItem);
        result.successfulItems++;
        
      } catch (err) {
        result.failedItems++;
        result.errors.push({
          row: rowIndex,
          message: err.message || 'Errore sconosciuto',
          data: `Riga ${rowIndex}`
        });
      }
      
      // Aggiorna il progresso
      if (mergedOptions.onProgress) {
        mergedOptions.onProgress((rowIndex - startRow + 1) / (rowCount - startRow + 1) * 100);
      }
    }
    
    return result;
    
  } catch (err) {
    throw new Error(`Errore nell'analisi del file Excel: ${err.message}`);
  }
}

/**
 * Trasforma una riga Excel in un oggetto Contatto
 */
function transformContactFromExcel(row: Record<string, any>): Partial<Contact> {
  // Estrai i campi base (obbligatori e opzionali)
  const contact: Partial<Contact> = {
    firstName: getString(row.firstName || row['first_name'] || row['nome']),
    lastName: getString(row.lastName || row['last_name'] || row['cognome']),
    email: getString(row.email || row['email_address'] || row['indirizzo_email']),
    phone: getString(row.phone || row['phoneNumber'] || row['telefono']),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Aggiungi campi opzionali se presenti
  if (row.jobTitle || row['job_title'] || row['ruolo']) {
    contact.jobTitle = getString(row.jobTitle || row['job_title'] || row['ruolo']);
  }
  
  if (row.company || row['company_name'] || row['azienda']) {
    contact.companyName = getString(row.company || row['company_name'] || row['azienda']);
  }
  
  if (row.mobile || row['cellulare']) {
    contact.mobile = getString(row.mobile || row['cellulare']);
  }
  
  if (row.address || row['indirizzo']) {
    contact.address = getString(row.address || row['indirizzo']);
  }
  
  // Gestione dei tags
  if (row.tags || row['tag']) {
    const tagString = getString(row.tags || row['tag']);
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
 * Trasforma una riga Excel in un oggetto Azienda
 */
function transformCompanyFromExcel(row: Record<string, any>): Partial<CompanyWithContacts> {
  // Estrai i campi base (obbligatori e opzionali)
  const company: Partial<CompanyWithContacts> = {
    name: getString(row.name || row['company_name'] || row['azienda']),
    email: getString(row.email || row['email_address'] || row['company_email'] || row['indirizzo_email']),
    phone: getString(row.phone || row['phoneNumber'] || row['company_phone'] || row['telefono']),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    contacts: []
  };
  
  // Aggiungi campi opzionali se presenti
  if (row.website || row['sito_web']) {
    company.website = getString(row.website || row['sito_web']);
  }
  
  if (row.address || row['indirizzo']) {
    company.address = getString(row.address || row['indirizzo']);
  }
  
  if (row.industry || row['settore']) {
    company.industry = getString(row.industry || row['settore']);
  }
  
  // Gestione dei tags
  if (row.tags || row['tag']) {
    const tagString = getString(row.tags || row['tag']);
    company.tags = tagString.split(',').map(tag => tag.trim());
  }
  
  // Validazione di base
  if (!company.name) {
    throw new Error('L\'azienda deve avere un nome');
  }
  
  return company;
}

/**
 * Trasforma una riga Excel in un oggetto Lead
 */
function transformLeadFromExcel(row: Record<string, any>): Partial<Lead> {
  // Estrai i campi base (obbligatori e opzionali)
  const lead: Partial<Lead> = {
    name: getString(row.name || row['lead_name'] || row['nome']),
    email: getString(row.email || row['email_address'] || row['indirizzo_email']),
    phone: getString(row.phone || row['phoneNumber'] || row['telefono']),
    status: 'new', // Default per i nuovi lead
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Aggiungi campi opzionali se presenti
  if (row.source || row['fonte']) {
    lead.source = getString(row.source || row['fonte']);
  }
  
  if (row.company || row['company_name'] || row['azienda']) {
    lead.companyName = getString(row.company || row['company_name'] || row['azienda']);
  }
  
  // Gestione dei tags
  if (row.tags || row['tag']) {
    const tagString = getString(row.tags || row['tag']);
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

/**
 * Converti un valore di cella Excel in string
 */
function getString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object' && 'text' in value) {
    return value.text || '';
  }
  
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((r: any) => r.text).join('') || '';
  }
  
  return String(value);
}