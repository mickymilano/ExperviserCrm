/**
 * Modulo per l'esportazione di contatti, aziende e lead in formato CSV
 */
import Papa from 'papaparse';
import { Contact, Company, Lead } from '../../../shared/schema';

interface ExportOptions {
  delimiter?: string; // Delimitatore (default: virgola)
  includeHeader?: boolean; // Include la riga di intestazione
  dateFormat?: string; // Formato delle date
  columns?: string[]; // Colonne specifiche da esportare
  fileName?: string; // Nome del file di output
  onProgress?: (progress: number) => void; // Callback per il progresso
}

/**
 * Esporta i dati in formato CSV
 * @param data Array di oggetti da esportare
 * @param entityType Tipo di entità (contacts, companies, leads)
 * @param options Opzioni di esportazione
 * @returns Stringa CSV
 */
export function exportToCsv(
  data: any[],
  entityType: 'contacts' | 'companies' | 'leads',
  options: ExportOptions = {}
): string {
  // Opzioni di default
  const defaultOptions: ExportOptions = {
    delimiter: ',',
    includeHeader: true,
    dateFormat: 'YYYY-MM-DD'
  };

  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
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
  
  // Prepara i dati per l'esportazione in base al tipo di entità
  const formattedData = formatDataForExport(processedData, entityType, mergedOptions);
  
  // Configura le opzioni per PapaParse
  const papaOptions = {
    delimiter: mergedOptions.delimiter,
    header: mergedOptions.includeHeader
  };
  
  // Genera il CSV
  return Papa.unparse(formattedData, papaOptions);
}

/**
 * Formatta i dati per l'esportazione CSV
 */
function formatDataForExport(
  data: any[],
  entityType: 'contacts' | 'companies' | 'leads',
  options: ExportOptions
): any[] {
  // Formatta i dati in base al tipo di entità
  switch (entityType) {
    case 'contacts':
      return formatContactsForExport(data, options);
    case 'companies':
      return formatCompaniesForExport(data, options);
    case 'leads':
      return formatLeadsForExport(data, options);
    default:
      return data;
  }
}

/**
 * Formatta i contatti per l'esportazione CSV
 */
function formatContactsForExport(contacts: Partial<Contact>[], options: ExportOptions): any[] {
  return contacts.map(contact => {
    // Copia i campi base
    const formattedContact: Record<string, any> = {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      status: contact.status || '',
      companyName: contact.companyName || '',
      address: contact.address || '',
      jobTitle: contact.jobTitle || '',
      notes: contact.notes || ''
    };
    
    // Gestione dei campi data
    if (contact.createdAt) {
      formattedContact.createdAt = formatDate(contact.createdAt, options.dateFormat);
    }
    
    if (contact.updatedAt) {
      formattedContact.updatedAt = formatDate(contact.updatedAt, options.dateFormat);
    }
    
    // Gestione dei tags
    if (contact.tags && Array.isArray(contact.tags)) {
      formattedContact.tags = contact.tags.join(', ');
    }
    
    return formattedContact;
  });
}

/**
 * Formatta le aziende per l'esportazione CSV
 */
function formatCompaniesForExport(companies: Partial<Company>[], options: ExportOptions): any[] {
  return companies.map(company => {
    // Copia i campi base
    const formattedCompany: Record<string, any> = {
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      address: company.address || '',
      industry: company.industry || '',
      status: company.status || '',
      notes: company.notes || ''
    };
    
    // Gestione dei campi data
    if (company.createdAt) {
      formattedCompany.createdAt = formatDate(company.createdAt, options.dateFormat);
    }
    
    if (company.updatedAt) {
      formattedCompany.updatedAt = formatDate(company.updatedAt, options.dateFormat);
    }
    
    // Gestione dei tags
    if (company.tags && Array.isArray(company.tags)) {
      formattedCompany.tags = company.tags.join(', ');
    }
    
    return formattedCompany;
  });
}

/**
 * Formatta i lead per l'esportazione CSV
 */
function formatLeadsForExport(leads: Partial<Lead>[], options: ExportOptions): any[] {
  return leads.map(lead => {
    // Copia i campi base
    const formattedLead: Record<string, any> = {
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status || '',
      source: lead.source || '',
      companyName: lead.companyName || '',
      value: lead.value || '',
      notes: lead.notes || ''
    };
    
    // Gestione dei campi data
    if (lead.createdAt) {
      formattedLead.createdAt = formatDate(lead.createdAt, options.dateFormat);
    }
    
    if (lead.updatedAt) {
      formattedLead.updatedAt = formatDate(lead.updatedAt, options.dateFormat);
    }
    
    if (lead.lastContactedAt) {
      formattedLead.lastContactedAt = formatDate(lead.lastContactedAt, options.dateFormat);
    }
    
    if (lead.nextFollowUpAt) {
      formattedLead.nextFollowUpAt = formatDate(lead.nextFollowUpAt, options.dateFormat);
    }
    
    // Gestione dei tags
    if (lead.tags && Array.isArray(lead.tags)) {
      formattedLead.tags = lead.tags.join(', ');
    }
    
    return formattedLead;
  });
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