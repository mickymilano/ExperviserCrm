/**
 * Modulo per l'esportazione di contatti, aziende e lead in formato Excel
 */
import * as ExcelJS from 'exceljs';
import { Contact, Company, Lead } from '../../../shared/schema';

interface ExportOptions {
  sheetName?: string; // Nome del foglio di lavoro
  columns?: string[]; // Colonne specifiche da esportare
  dateFormat?: string; // Formato delle date
  fileName?: string; // Nome del file di output
  styleHeader?: boolean; // Applica stili all'intestazione
  autoFilter?: boolean; // Applica filtri automatici
  onProgress?: (progress: number) => void; // Callback per il progresso
}

/**
 * Esporta i dati in formato Excel
 * @param data Array di oggetti da esportare
 * @param entityType Tipo di entità (contacts, companies, leads)
 * @param options Opzioni di esportazione
 * @returns Buffer contenente il file Excel
 */
export async function exportToExcel(
  data: any[],
  entityType: 'contacts' | 'companies' | 'leads',
  options: ExportOptions = {}
): Promise<Buffer> {
  // Opzioni di default
  const defaultOptions: ExportOptions = {
    sheetName: entityType.charAt(0).toUpperCase() + entityType.slice(1),
    dateFormat: 'YYYY-MM-DD',
    styleHeader: true,
    autoFilter: true
  };

  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Crea un nuovo workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Experviser CRM';
  workbook.lastModifiedBy = 'Experviser CRM';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Aggiungi un foglio di lavoro
  const worksheet = workbook.addWorksheet(mergedOptions.sheetName);
  
  // Seleziona solo le colonne specificate se necessario
  let processedData = [...data];
  if (mergedOptions.columns && mergedOptions.columns.length > 0) {
    processedData = data.map(item => {
      const filteredItem: Record<string, any> = {};
      mergedOptions.columns.forEach(column => {
        if (column in item) {
          filteredItem[column] = item[column];
        }
      });
      return filteredItem;
    });
  }
  
  // Formatta i dati per l'esportazione in base al tipo di entità
  const { formattedData, columns } = formatDataForExcel(processedData, entityType, mergedOptions);
  
  // Imposta le colonne del foglio
  worksheet.columns = columns.map(header => ({
    header,
    key: header,
    width: Math.max(15, header.length + 2) // Larghezza automatica basata sulla lunghezza dell'intestazione
  }));
  
  // Aggiungi i dati al foglio
  formattedData.forEach((row, index) => {
    const excelRow = worksheet.addRow(row);
    
    // Aggiorna il progresso
    if (mergedOptions.onProgress) {
      mergedOptions.onProgress((index + 1) / formattedData.length * 100);
    }
  });
  
  // Applica formattazione e stili
  if (mergedOptions.styleHeader) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  
  // Applica filtri automatici
  if (mergedOptions.autoFilter && worksheet.rowCount > 1) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };
  }
  
  // Congela la prima riga
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
  ];
  
  // Ritorna il buffer
  return await workbook.xlsx.writeBuffer();
}

/**
 * Formatta i dati per l'esportazione Excel
 */
function formatDataForExcel(
  data: any[],
  entityType: 'contacts' | 'companies' | 'leads',
  options: ExportOptions
): { formattedData: any[]; columns: string[] } {
  // Determina il formato in base al tipo di entità
  switch (entityType) {
    case 'contacts':
      return formatContactsForExcel(data, options);
    case 'companies':
      return formatCompaniesForExcel(data, options);
    case 'leads':
      return formatLeadsForExcel(data, options);
    default:
      return { formattedData: data, columns: Object.keys(data[0] || {}) };
  }
}

/**
 * Formatta i contatti per l'esportazione Excel
 */
function formatContactsForExcel(
  contacts: Partial<Contact>[],
  options: ExportOptions
): { formattedData: any[]; columns: string[] } {
  // Colonne standard per i contatti
  const defaultColumns = [
    'ID', 'Nome', 'Cognome', 'Email', 'Telefono', 'Cellulare', 'Stato',
    'Azienda', 'Indirizzo', 'Ruolo', 'Note', 'Tag', 'Data creazione', 'Ultima modifica'
  ];
  
  // Formatta i dati
  const formattedData = contacts.map(contact => {
    // Prepara i dati formattati
    const formattedContact: Record<string, any> = {
      'ID': contact.id || '',
      'Nome': contact.firstName || '',
      'Cognome': contact.lastName || '',
      'Email': contact.email || '',
      'Telefono': contact.phone || '',
      'Cellulare': contact.mobile || '',
      'Stato': contact.status || '',
      'Azienda': contact.companyName || '',
      'Indirizzo': contact.address || '',
      'Ruolo': contact.jobTitle || '',
      'Note': contact.notes || '',
      'Tag': contact.tags && Array.isArray(contact.tags) ? contact.tags.join(', ') : ''
    };
    
    // Formatta le date
    formattedContact['Data creazione'] = contact.createdAt ? formatDate(contact.createdAt, options.dateFormat) : '';
    formattedContact['Ultima modifica'] = contact.updatedAt ? formatDate(contact.updatedAt, options.dateFormat) : '';
    
    return formattedContact;
  });
  
  return { formattedData, columns: defaultColumns };
}

/**
 * Formatta le aziende per l'esportazione Excel
 */
function formatCompaniesForExcel(
  companies: Partial<Company>[],
  options: ExportOptions
): { formattedData: any[]; columns: string[] } {
  // Colonne standard per le aziende
  const defaultColumns = [
    'ID', 'Nome', 'Email', 'Telefono', 'Sito Web', 'Indirizzo', 'Settore',
    'Stato', 'Note', 'Tag', 'Data creazione', 'Ultima modifica'
  ];
  
  // Formatta i dati
  const formattedData = companies.map(company => {
    // Prepara i dati formattati
    const formattedCompany: Record<string, any> = {
      'ID': company.id || '',
      'Nome': company.name || '',
      'Email': company.email || '',
      'Telefono': company.phone || '',
      'Sito Web': company.website || '',
      'Indirizzo': company.address || '',
      'Settore': company.industry || '',
      'Stato': company.status || '',
      'Note': company.notes || '',
      'Tag': company.tags && Array.isArray(company.tags) ? company.tags.join(', ') : ''
    };
    
    // Formatta le date
    formattedCompany['Data creazione'] = company.createdAt ? formatDate(company.createdAt, options.dateFormat) : '';
    formattedCompany['Ultima modifica'] = company.updatedAt ? formatDate(company.updatedAt, options.dateFormat) : '';
    
    return formattedCompany;
  });
  
  return { formattedData, columns: defaultColumns };
}

/**
 * Formatta i lead per l'esportazione Excel
 */
function formatLeadsForExcel(
  leads: Partial<Lead>[],
  options: ExportOptions
): { formattedData: any[]; columns: string[] } {
  // Colonne standard per i lead
  const defaultColumns = [
    'ID', 'Nome', 'Email', 'Telefono', 'Stato', 'Fonte', 'Azienda', 'Valore',
    'Note', 'Tag', 'Data creazione', 'Ultima modifica', 'Ultimo contatto', 'Prossimo follow-up'
  ];
  
  // Formatta i dati
  const formattedData = leads.map(lead => {
    // Prepara i dati formattati
    const formattedLead: Record<string, any> = {
      'ID': lead.id || '',
      'Nome': lead.name || '',
      'Email': lead.email || '',
      'Telefono': lead.phone || '',
      'Stato': lead.status || '',
      'Fonte': lead.source || '',
      'Azienda': lead.companyName || '',
      'Valore': lead.value || '',
      'Note': lead.notes || '',
      'Tag': lead.tags && Array.isArray(lead.tags) ? lead.tags.join(', ') : ''
    };
    
    // Formatta le date
    formattedLead['Data creazione'] = lead.createdAt ? formatDate(lead.createdAt, options.dateFormat) : '';
    formattedLead['Ultima modifica'] = lead.updatedAt ? formatDate(lead.updatedAt, options.dateFormat) : '';
    formattedLead['Ultimo contatto'] = lead.lastContactedAt ? formatDate(lead.lastContactedAt, options.dateFormat) : '';
    formattedLead['Prossimo follow-up'] = lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt, options.dateFormat) : '';
    
    return formattedLead;
  });
  
  return { formattedData, columns: defaultColumns };
}

/**
 * Formatta una data in base al formato specificato
 */
function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se la data è valida
  if (isNaN(d.getTime())) return '';
  
  // Formatta la data in base al formato specificato
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // Sostituisci i placeholder nel formato
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}