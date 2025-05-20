import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { storage } from '../../storage';
import { detectDuplicates } from './duplicate-detector';
import { enhanceWithAI } from './ai-enhancer';

/**
 * Analizza un file importato (CSV o Excel) per estrarre i dati
 * @param filePath Percorso del file caricato
 * @param entityType Tipo di entità (contacts, companies, leads)
 * @returns Dati estratti e informazioni sul file
 */
export async function analyzeImportData(filePath: string, entityType: string) {
  try {
    // Determina il tipo di file dall'estensione
    const fileExtension = path.extname(filePath).toLowerCase();
    
    let data: any[] = [];
    let headers: any[];
    
    // Elabora in base al tipo di file
    if (fileExtension === '.csv') {
      // Leggi il file CSV
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Analizza il file CSV
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });
      
      data = parseResult.data;
      headers = parseResult.meta.fields || [];
      
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      // Leggi il file Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      // Prendi il primo foglio di lavoro
      const worksheet = workbook.worksheets[0];
      
      // Estrai le intestazioni dalla prima riga
      headers = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value);
      });
      
      // Estrai i dati dalle righe successive
      data = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Salta l'intestazione
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          data.push(rowData);
        }
      });
    } else {
      throw new Error('Formato file non supportato');
    }
    
    // Mappa i campi del CSV/Excel ai campi del database
    const mappedData = mapFieldsToEntity(data, entityType);
    
    return {
      originalData: data,
      mappedData,
      totalRows: data.length,
      headers,
      entityType,
      filePath
    };
  } catch (error) {
    console.error('Errore durante l\'analisi del file importato:', error);
    throw error;
  }
}

/**
 * Mappa i campi del file importato ai campi del database
 * @param data Dati grezzi dal file
 * @param entityType Tipo di entità
 * @returns Dati mappati ai campi del database
 */
function mapFieldsToEntity(data: any[], entityType: string) {
  return data.map(item => {
    const mappedItem: any = {};
    
    // Mappa i campi in base al tipo di entità
    if (entityType === 'contacts') {
      // Mappa i dati del contatto
      mappedItem.firstName = item.Nome || item.FirstName || item.first_name || '';
      mappedItem.lastName = item.Cognome || item.LastName || item.last_name || '';
      mappedItem.email = item.Email || item.EmailAddress || item.email_address || '';
      mappedItem.phone = item.Telefono || item.Phone || item.phone_number || '';
      mappedItem.mobilePhone = item.Cellulare || item.Mobile || item.mobile_phone || '';
      mappedItem.jobTitle = item.Ruolo || item.JobTitle || item.job_title || '';
      mappedItem.notes = item.Note || item.Notes || item.notes || '';
      mappedItem.address = item.Indirizzo || item.Address || item.address || '';
      
      // Aggiungi altri campi standard
      if (item.Azienda || item.Company) {
        mappedItem.company = item.Azienda || item.Company || item.company_name || '';
      }
      
      // Gestisci i tag se presenti
      if (item.Tag || item.Tags) {
        mappedItem.tags = (item.Tag || item.Tags || '').split(',').map((tag: string) => tag.trim());
      }
      
    } else if (entityType === 'companies') {
      // Mappa i dati dell'azienda
      mappedItem.name = item.Nome || item.Name || item.company_name || '';
      mappedItem.email = item.Email || item.EmailAddress || item.email_address || '';
      mappedItem.phone = item.Telefono || item.Phone || item.phone_number || '';
      mappedItem.website = item.SitoWeb || item.Website || item.website || '';
      mappedItem.address = item.Indirizzo || item.Address || item.address || '';
      mappedItem.vatNumber = item.PartitaIVA || item.VAT || item.vat_number || '';
      mappedItem.notes = item.Note || item.Notes || item.notes || '';
      
      // Gestisci i tag se presenti
      if (item.Tag || item.Tags) {
        mappedItem.tags = (item.Tag || item.Tags || '').split(',').map((tag: string) => tag.trim());
      }
      
    } else if (entityType === 'leads') {
      // Mappa i dati del lead
      mappedItem.title = item.Titolo || item.Title || item.title || '';
      mappedItem.firstName = item.Nome || item.FirstName || item.first_name || '';
      mappedItem.lastName = item.Cognome || item.LastName || item.last_name || '';
      mappedItem.email = item.Email || item.EmailAddress || item.email_address || '';
      mappedItem.phone = item.Telefono || item.Phone || item.phone_number || '';
      mappedItem.company = item.Azienda || item.Company || item.company_name || '';
      mappedItem.jobTitle = item.Ruolo || item.JobTitle || item.job_title || '';
      mappedItem.source = item.Fonte || item.Source || item.source || '';
      mappedItem.notes = item.Note || item.Notes || item.notes || '';
      
      // Gestisci i tag se presenti
      if (item.Tag || item.Tags) {
        mappedItem.tags = (item.Tag || item.Tags || '').split(',').map((tag: string) => tag.trim());
      }
    }
    
    return mappedItem;
  });
}

/**
 * Trova record simili nel database per individuare potenziali duplicati
 * @param items Lista di elementi da controllare
 * @param entityType Tipo di entità
 * @param field Campo su cui basare la ricerca
 * @returns Array di possibili duplicati
 */
async function findSimilarRecords(items: any[], entityType: string, field: string) {
  try {
    const results = [];
    
    for (const item of items) {
      if (item[field]) {
        let existingRecords;
        
        switch (entityType) {
          case 'contacts':
            existingRecords = await storage.getContact({ email: item.email }); 
            break;
          case 'companies':
            existingRecords = await storage.getCompany({ name: item.name });
            break;
          case 'leads':
            // Non abbiamo un metodo getLeads specifico, quindi potremmo usare una query più generica
            // oppure adattare il metodo di storage
            existingRecords = await storage.getLeads();
            existingRecords = existingRecords.filter(lead => 
              lead.email === item.email || 
              (lead.firstName === item.firstName && lead.lastName === item.lastName)
            );
            break;
          default:
            existingRecords = [];
        }
        
        if (existingRecords && existingRecords.length > 0) {
          results.push({
            item,
            matches: existingRecords
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Errore durante la ricerca di record simili:', error);
    throw error;
  }
}

// Esporta le funzioni per l'utilizzo nel router
export { detectDuplicates, enhanceWithAI };