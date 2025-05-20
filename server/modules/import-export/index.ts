/**
 * Modulo principale per l'importazione ed esportazione dei dati
 */

import { enhanceData, EntityType, EnhancementSetting, defaultEnhancementSettings } from './ai-enhancer';
import { getDistanceScore } from './duplicate-detector';
import { normalizePhoneNumber } from './string-utils';
import { parse as csvParse } from 'papaparse';
import ExcelJS from 'exceljs';

/**
 * Tipi di file supportati per l'importazione
 */
export type ImportFileType = 'csv' | 'excel';

/**
 * Interfaccia per il risultato dell'importazione
 */
export interface ImportResult {
  success: boolean;
  message: string;
  totalRecords?: number;
  importedRecords?: number;
  errors?: string[];
  data?: any[];
}

/**
 * Interfaccia per il gruppo di duplicati
 */
export interface DuplicateGroup {
  primaryRecord: any;
  duplicates: any[];
  similarityScore: number;
}

/**
 * Interfaccia per la mappatura dei campi
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required?: boolean;
  transform?: (value: any) => any;
}

/**
 * Impostazioni predefinite per la mappatura dei campi
 */
export const defaultFieldMappings: Record<EntityType, FieldMapping[]> = {
  contacts: [
    { sourceField: 'Nome', targetField: 'firstName', required: true },
    { sourceField: 'Cognome', targetField: 'lastName', required: true },
    { sourceField: 'Email', targetField: 'email', required: true },
    { sourceField: 'Telefono', targetField: 'phone' },
    { sourceField: 'Titolo', targetField: 'jobTitle' },
    { sourceField: 'Note', targetField: 'notes' },
    { sourceField: 'Tag', targetField: 'tags', transform: (value) => value ? value.split(',').map((t: string) => t.trim()) : [] }
  ],
  companies: [
    { sourceField: 'Nome', targetField: 'name', required: true },
    { sourceField: 'Email', targetField: 'email' },
    { sourceField: 'Telefono', targetField: 'phone' },
    { sourceField: 'Sito Web', targetField: 'website' },
    { sourceField: 'Settore', targetField: 'industry' },
    { sourceField: 'Dipendenti', targetField: 'employeeCount', transform: (value) => parseInt(value) || null },
    { sourceField: 'Fatturato', targetField: 'annualRevenue', transform: (value) => value ? parseFloat(value) : null },
    { sourceField: 'Sede', targetField: 'location' },
    { sourceField: 'Anno Fondazione', targetField: 'founded', transform: (value) => parseInt(value) || null },
    { sourceField: 'Note', targetField: 'notes' },
    { sourceField: 'Tag', targetField: 'tags', transform: (value) => value ? value.split(',').map((t: string) => t.trim()) : [] }
  ],
  deals: [
    { sourceField: 'Nome', targetField: 'name', required: true },
    { sourceField: 'Valore', targetField: 'value', transform: (value) => value ? value.toString() : null },
    { sourceField: 'Stato', targetField: 'status' },
    { sourceField: 'ID Contatto', targetField: 'contactId', transform: (value) => parseInt(value) || null },
    { sourceField: 'ID Azienda', targetField: 'companyId', transform: (value) => parseInt(value) || null },
    { sourceField: 'Fase', targetField: 'stageId', transform: (value) => parseInt(value) || 1 },
    { sourceField: 'Data Chiusura', targetField: 'expectedCloseDate' },
    { sourceField: 'Note', targetField: 'notes' },
    { sourceField: 'Tag', targetField: 'tags', transform: (value) => value ? value.split(',').map((t: string) => t.trim()) : [] }
  ]
};

/**
 * Analizza un file CSV e restituisce i dati strutturati
 * 
 * @param fileContent Contenuto del file CSV
 * @param delimiter Delimitatore dei campi (default: ',')
 * @returns Dati analizzati come array di oggetti
 */
export function parseCSV(fileContent: string, delimiter: string = ','): any[] {
  const result = csvParse(fileContent, {
    header: true,
    skipEmptyLines: true,
    delimiter
  });
  
  if (result.errors && result.errors.length > 0) {
    console.error('Errori nell\'analisi del CSV:', result.errors);
  }
  
  return result.data as any[];
}

/**
 * Analizza un file Excel e restituisce i dati strutturati
 * 
 * @param buffer Buffer del file Excel
 * @param sheetIndex Indice del foglio (default: 0)
 * @returns Promise con i dati analizzati come array di oggetti
 */
export async function parseExcel(buffer: Buffer, sheetIndex: number = 0): Promise<any[]> {
  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[sheetIndex];
    
    if (!worksheet) {
      throw new Error(`Foglio di lavoro all'indice ${sheetIndex} non trovato`);
    }
    
    const data: any[] = [];
    const headers: string[] = [];
    
    // Estrai le intestazioni dalla prima riga
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || `Colonna ${colNumber}`;
    });
    
    // Estrai i dati dalle righe successive
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Salta la riga di intestazione
      
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        
        if (header) {
          let value: any = cell.value;
          
          // Gestisci i tipi di dati Excel
          if (cell.type === ExcelJS.ValueType.Date) {
            value = (cell.value as Date).toISOString().split('T')[0]; // Formato YYYY-MM-DD
          } else if (typeof value === 'object' && value !== null) {
            // Se il valore è un oggetto Excel (es. RichText), converti in stringa
            value = value.toString();
          }
          
          rowData[header] = value;
        }
      });
      
      data.push(rowData);
    });
    
    return data;
    
  } catch (error) {
    console.error('Errore nell\'analisi del file Excel:', error);
    throw error;
  }
}

/**
 * Applica la mappatura dei campi ai dati importati
 * 
 * @param data Dati importati
 * @param mappings Definizioni di mappatura
 * @returns Dati mappati secondo lo schema del target
 */
export function applyFieldMapping(data: any[], mappings: FieldMapping[]): any[] {
  return data.map(item => {
    const mappedItem: Record<string, any> = {};
    
    // Applica ogni mappatura di campo
    for (const mapping of mappings) {
      // Ottieni il valore dal campo di origine
      const value = item[mapping.sourceField];
      
      // Applica la trasformazione se definita
      const transformedValue = mapping.transform ? mapping.transform(value) : value;
      
      // Assegna il valore al campo di destinazione
      mappedItem[mapping.targetField] = transformedValue;
    }
    
    return mappedItem;
  });
}

/**
 * Verifica se i dati sono validi in base ai vincoli definiti
 * 
 * @param data Dati da validare
 * @param mappings Definizioni di mappatura
 * @returns Risultato della validazione con errori
 */
export function validateData(data: any[], mappings: FieldMapping[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verifica ciascun record
  data.forEach((item, index) => {
    // Verifica i campi obbligatori
    const requiredMappings = mappings.filter(mapping => mapping.required);
    
    for (const mapping of requiredMappings) {
      // Se il campo obbligatorio è mancante o vuoto, aggiungi un errore
      if (item[mapping.targetField] === undefined || item[mapping.targetField] === null || item[mapping.targetField] === '') {
        errors.push(`Record ${index + 1}: Campo obbligatorio "${mapping.sourceField}" mancante o vuoto`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Rileva i potenziali duplicati nei dati
 * 
 * @param newData Nuovi dati da controllare
 * @param existingData Dati esistenti nel sistema
 * @param entityType Tipo di entità
 * @param similarityThreshold Soglia di similarità (0-1)
 * @returns Gruppi di duplicati rilevati
 */
export function detectDuplicates(
  newData: any[],
  existingData: any[],
  entityType: EntityType,
  similarityThreshold: number = 0.7
): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  
  // Analizza ciascun nuovo record
  for (const newItem of newData) {
    const potentialDuplicates: { item: any; score: number }[] = [];
    
    // Confronta con i dati esistenti
    for (const existingItem of existingData) {
      const similarityScore = getDistanceScore(newItem, existingItem, entityType);
      
      if (similarityScore >= similarityThreshold) {
        potentialDuplicates.push({
          item: existingItem,
          score: similarityScore
        });
      }
    }
    
    // Se sono stati trovati potenziali duplicati, crea un gruppo
    if (potentialDuplicates.length > 0) {
      // Ordina i duplicati per punteggio (decrescente)
      potentialDuplicates.sort((a, b) => b.score - a.score);
      
      duplicateGroups.push({
        primaryRecord: newItem,
        duplicates: potentialDuplicates.map(dup => dup.item),
        similarityScore: potentialDuplicates[0].score
      });
    }
  }
  
  return duplicateGroups;
}

/**
 * Arricchisci i dati con funzionalità AI
 * 
 * @param data Dati da arricchire
 * @param entityType Tipo di entità
 * @param settings Impostazioni di arricchimento
 * @param confidenceThreshold Soglia di confidenza
 * @returns Promise con i dati arricchiti
 */
export async function enrichDataWithAI(
  data: any[],
  entityType: EntityType,
  settings: EnhancementSetting[] = defaultEnhancementSettings[entityType],
  confidenceThreshold: number = 0.7
): Promise<any[]> {
  return await enhanceData(data, entityType, settings, confidenceThreshold);
}

/**
 * Esporta dati in formato CSV
 * 
 * @param data Dati da esportare
 * @param mappings Mappature dei campi
 * @returns Stringa CSV
 */
export function exportToCSV(data: any[], mappings: FieldMapping[]): string {
  // Intestazioni CSV (campi di origine)
  const headers = mappings.map(mapping => mapping.sourceField);
  
  // Righe dati
  const rows = data.map(item => {
    return mappings.map(mapping => {
      // Ottieni il valore dal campo di destinazione
      let value = item[mapping.targetField];
      
      // Gestisci i casi speciali
      if (Array.isArray(value)) {
        // Converti array in stringa separata da virgole
        value = value.join(', ');
      } else if (value === null || value === undefined) {
        value = '';
      }
      
      return String(value).replace(/"/g, '""'); // Escape delle virgolette
    });
  });
  
  // Formatta l'intestazione
  const headerRow = headers.map(header => `"${header}"`).join(',');
  
  // Formatta le righe dati
  const formattedRows = rows.map(row => row.map(cell => `"${cell}"`).join(','));
  
  // Unisci tutto
  return [headerRow, ...formattedRows].join('\n');
}

/**
 * Crea un file Excel dai dati
 * 
 * @param data Dati da esportare
 * @param mappings Mappature dei campi
 * @returns Promise con il buffer del file Excel
 */
export async function exportToExcel(data: any[], mappings: FieldMapping[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dati Esportati');
  
  // Intestazioni
  const headers = mappings.map(mapping => mapping.sourceField);
  worksheet.addRow(headers);
  
  // Stile per l'intestazione
  worksheet.getRow(1).font = { bold: true };
  
  // Dati
  data.forEach(item => {
    const rowValues = mappings.map(mapping => {
      // Ottieni il valore dal campo di destinazione
      let value = item[mapping.targetField];
      
      // Gestisci i casi speciali
      if (Array.isArray(value)) {
        // Converti array in stringa separata da virgole
        value = value.join(', ');
      } else if (value === null || value === undefined) {
        value = '';
      }
      
      return value;
    });
    
    worksheet.addRow(rowValues);
  });
  
  // Ottimizza la larghezza delle colonne
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
  
  // Genera il buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}