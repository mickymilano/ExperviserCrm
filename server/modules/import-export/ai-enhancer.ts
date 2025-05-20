/**
 * Modulo per l'arricchimento dei dati usando OpenAI
 */

import { OpenAI } from "openai";
import { normalizePhoneNumber } from "./string-utils";

// Configurazione OpenAI
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  console.error('Errore nella configurazione di OpenAI:', error);
}

/**
 * Tipi di entità supportati per l'arricchimento
 */
export type EntityType = 'contacts' | 'companies' | 'deals';

/**
 * Impostazione per le funzionalità di arricchimento
 */
export interface EnhancementSetting {
  id: string;
  name: string;
  description: string;
  active: boolean;
  confidenceThreshold?: number;
}

/**
 * Impostazioni predefinite per ciascun tipo di entità
 */
export const defaultEnhancementSettings: Record<EntityType, EnhancementSetting[]> = {
  contacts: [
    {
      id: 'normalize-phones',
      name: 'Normalizza numeri di telefono',
      description: 'Converte i numeri di telefono in formato internazionale standard',
      active: true,
      confidenceThreshold: 0.9
    },
    {
      id: 'suggest-tags',
      name: 'Suggerisci tag',
      description: 'Analizza i dati del contatto per suggerire tag pertinenti',
      active: true,
      confidenceThreshold: 0.7
    },
    {
      id: 'extract-job-title',
      name: 'Estrai titolo lavorativo',
      description: 'Estrae o migliora il titolo lavorativo dalle informazioni disponibili',
      active: false,
      confidenceThreshold: 0.7
    }
  ],
  companies: [
    {
      id: 'normalize-phones',
      name: 'Normalizza numeri di telefono',
      description: 'Converte i numeri di telefono in formato internazionale standard',
      active: true,
      confidenceThreshold: 0.9
    },
    {
      id: 'suggest-tags',
      name: 'Suggerisci tag',
      description: 'Analizza i dati dell\'azienda per suggerire tag pertinenti',
      active: true,
      confidenceThreshold: 0.7
    },
    {
      id: 'detect-industry',
      name: 'Rileva settore industriale',
      description: 'Analizza il nome e le informazioni dell\'azienda per determinare il settore industriale',
      active: true,
      confidenceThreshold: 0.7
    }
  ],
  deals: [
    {
      id: 'suggest-tags',
      name: 'Suggerisci tag',
      description: 'Analizza i dati dell\'opportunità per suggerire tag pertinenti',
      active: true,
      confidenceThreshold: 0.7
    },
    {
      id: 'forecast-close-date',
      name: 'Prevedi data di chiusura',
      description: 'Suggerisce una data di chiusura prevista in base ai dati disponibili',
      active: false,
      confidenceThreshold: 0.6
    }
  ]
};

/**
 * Arricchisce i dati utilizzando varie tecniche di AI e analisi
 * 
 * @param data Dati da arricchire
 * @param entityType Tipo di entità (contacts, companies, deals)
 * @param settings Impostazioni di arricchimento attive
 * @param confidenceThreshold Soglia di confidenza per gli arricchimenti (0-1)
 * @returns Dati arricchiti con informazioni aggiuntive
 */
export async function enhanceData(
  data: Record<string, any>[],
  entityType: EntityType,
  settings: EnhancementSetting[] = defaultEnhancementSettings[entityType],
  confidenceThreshold: number = 0.7
): Promise<Record<string, any>[]> {
  if (!data || data.length === 0) {
    return [];
  }
  
  const enhancedData = [...data];
  const activeSettings = settings.filter(setting => setting.active);
  
  if (activeSettings.length === 0) {
    return enhancedData;
  }
  
  // Applica gli arricchimenti a ciascun record
  for (let i = 0; i < enhancedData.length; i++) {
    // Crea una copia per mantenere i dati originali
    const original = enhancedData[i];
    const record = { ...original };
    
    // Inizializza i metadati di confidenza
    record._ai_confidence = {};
    
    // Applica ciascuna impostazione attiva
    for (const setting of activeSettings) {
      try {
        switch (setting.id) {
          case 'normalize-phones':
            if (record.phone && typeof record.phone === 'string') {
              record.phone = normalizePhoneNumber(record.phone);
              record._ai_confidence.phone = 0.95;
            }
            if (record.mobilePhone && typeof record.mobilePhone === 'string') {
              record.mobilePhone = normalizePhoneNumber(record.mobilePhone);
              record._ai_confidence.mobilePhone = 0.95;
            }
            if (record.fixedPhone && typeof record.fixedPhone === 'string') {
              record.fixedPhone = normalizePhoneNumber(record.fixedPhone);
              record._ai_confidence.fixedPhone = 0.95;
            }
            break;
            
          case 'suggest-tags':
            if (openai) {
              try {
                // Prepara una descrizione del record con i campi rilevanti
                const recordDescription = prepareRecordDescription(record, entityType);
                
                // Usa OpenAI per suggerire tag
                const suggestedTags = await suggestTagsWithAI(recordDescription, entityType);
                
                if (suggestedTags && suggestedTags.length > 0) {
                  // Combina i tag esistenti con quelli suggeriti
                  const existingTags = Array.isArray(record.tags) ? record.tags : 
                                      (record.tags ? [record.tags] : []);
                  
                  // Verifica che non ci siano duplicati (ignora case)
                  const normalizedExistingTags = existingTags.map(t => t.toLowerCase());
                  const uniqueNewTags = suggestedTags.filter(tag => 
                    !normalizedExistingTags.includes(tag.toLowerCase())
                  );
                  
                  // Aggiorna i tag del record
                  record.tags = [...existingTags, ...uniqueNewTags];
                  record._ai_confidence.tags = 0.85;
                }
              } catch (err) {
                console.error(`Errore nel suggerimento dei tag per il record ${i}:`, err);
              }
            }
            break;
            
          case 'detect-industry':
            if (entityType === 'companies' && record.name && (!record.industry || record.industry === '') && openai) {
              try {
                const industry = await detectIndustryWithAI(record);
                if (industry) {
                  record.industry = industry;
                  record._ai_confidence.industry = 0.8;
                }
              } catch (err) {
                console.error(`Errore nel rilevamento del settore per l'azienda ${record.name}:`, err);
              }
            }
            break;
            
          case 'extract-job-title':
            if (entityType === 'contacts' && (!record.jobTitle || record.jobTitle === '') && openai) {
              try {
                const jobTitle = await extractJobTitleWithAI(record);
                if (jobTitle) {
                  record.jobTitle = jobTitle;
                  record._ai_confidence.jobTitle = 0.75;
                }
              } catch (err) {
                console.error(`Errore nell'estrazione del titolo lavorativo per il contatto ${record.firstName} ${record.lastName}:`, err);
              }
            }
            break;
            
          case 'forecast-close-date':
            if (entityType === 'deals' && !record.expectedCloseDate && openai) {
              try {
                const closeDate = await forecastCloseDateWithAI(record);
                if (closeDate) {
                  record.expectedCloseDate = closeDate;
                  record._ai_confidence.expectedCloseDate = 0.65;
                }
              } catch (err) {
                console.error(`Errore nella previsione della data di chiusura per l'opportunità ${record.name}:`, err);
              }
            }
            break;
        }
      } catch (error) {
        console.error(`Errore nell'applicazione dell'arricchimento ${setting.id}:`, error);
      }
    }
    
    // Filtra gli arricchimenti in base alla soglia di confidenza
    for (const [key, confidence] of Object.entries(record._ai_confidence)) {
      if (confidence < confidenceThreshold) {
        // Ripristina il valore originale
        record[key] = original[key];
        // Rimuovi l'informazione di confidenza
        delete record._ai_confidence[key];
      }
    }
    
    // Aggiungi il flag di arricchimento con AI
    record._enriched_by_ai = true;
    
    // Aggiorna il record nei dati
    enhancedData[i] = record;
  }
  
  return enhancedData;
}

/**
 * Prepara una descrizione testuale di un record per l'elaborazione con AI
 */
function prepareRecordDescription(record: Record<string, any>, entityType: EntityType): string {
  let description = '';
  
  // Seleziona i campi più rilevanti in base al tipo di entità
  if (entityType === 'contacts') {
    description = `
      Nome: ${record.firstName || ''} ${record.lastName || ''}
      Email: ${record.email || ''}
      Telefono: ${record.phone || ''}
      Titolo lavorativo: ${record.jobTitle || ''}
      Note: ${record.notes || ''}
    `;
  } else if (entityType === 'companies') {
    description = `
      Nome azienda: ${record.name || ''}
      Settore: ${record.industry || ''}
      Sito web: ${record.website || ''}
      Email: ${record.email || ''}
      Telefono: ${record.phone || ''}
      Numero dipendenti: ${record.employeeCount || ''}
      Fatturato annuo: ${record.annualRevenue || ''}
      Localizzazione: ${record.location || ''}
      Anno fondazione: ${record.founded || ''}
      Note: ${record.notes || ''}
    `;
  } else if (entityType === 'deals') {
    description = `
      Nome opportunità: ${record.name || ''}
      Valore: ${record.value || ''}
      Stato: ${record.status || ''}
      Note: ${record.notes || ''}
    `;
  }
  
  return description.trim();
}

/**
 * Utilizza OpenAI per suggerire tag per un record
 */
async function suggestTagsWithAI(recordDescription: string, entityType: EntityType): Promise<string[]> {
  if (!openai) return [];
  
  try {
    const entityTypeInItalian = 
      entityType === 'contacts' ? 'contatto' : 
      entityType === 'companies' ? 'azienda' : 'opportunità di vendita';
    
    const prompt = `
      Basandoti sui dati seguenti di un ${entityTypeInItalian}, 
      suggerisci 2-3 tag pertinenti in italiano che potrebbero essere utili per la categorizzazione. 
      Fornisci solo un array JSON di stringhe, senza spiegazioni.
      
      Dati:
      ${recordDescription}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // il nuovo modello OpenAI è "gpt-4o" rilasciato il 13 maggio 2024. non cambiarlo a meno che non sia esplicitamente richiesto dall'utente
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      if (result.tags && Array.isArray(result.tags)) {
        return result.tags;
      }
    } catch (error) {
      console.error('Errore nel parsing della risposta OpenAI:', error);
    }
  } catch (error) {
    console.error('Errore nella chiamata a OpenAI per i tag:', error);
  }
  
  return [];
}

/**
 * Utilizza OpenAI per rilevare il settore industriale di un'azienda
 */
async function detectIndustryWithAI(companyRecord: Record<string, any>): Promise<string | null> {
  if (!openai) return null;
  
  try {
    const prompt = `
      Basandoti sul nome dell'azienda e su qualsiasi altra informazione disponibile, 
      determina il settore industriale più probabile. Fornisci solo il nome del settore in italiano come stringa JSON, 
      senza spiegazioni.
      
      Nome azienda: ${companyRecord.name}
      ${companyRecord.description ? 'Descrizione: ' + companyRecord.description : ''}
      ${companyRecord.website ? 'Sito web: ' + companyRecord.website : ''}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // il nuovo modello OpenAI è "gpt-4o" rilasciato il 13 maggio 2024. non cambiarlo a meno che non sia esplicitamente richiesto dall'utente
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      if (result.industry && typeof result.industry === 'string') {
        return result.industry;
      }
    } catch (error) {
      console.error('Errore nel parsing della risposta OpenAI per il settore:', error);
    }
  } catch (error) {
    console.error('Errore nella chiamata a OpenAI per il settore:', error);
  }
  
  return null;
}

/**
 * Utilizza OpenAI per estrarre o migliorare il titolo lavorativo di un contatto
 */
async function extractJobTitleWithAI(contactRecord: Record<string, any>): Promise<string | null> {
  if (!openai) return null;
  
  try {
    const prompt = `
      Basandoti sulle informazioni disponibili su questo contatto, 
      estrai o suggerisci un titolo lavorativo appropriato. Fornisci solo il titolo lavorativo come stringa JSON,
      senza spiegazioni. Il titolo deve essere in italiano.
      
      Nome: ${contactRecord.firstName || ''} ${contactRecord.lastName || ''}
      Email: ${contactRecord.email || ''}
      Note: ${contactRecord.notes || ''}
      ${contactRecord.company ? 'Azienda: ' + contactRecord.company : ''}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // il nuovo modello OpenAI è "gpt-4o" rilasciato il 13 maggio 2024. non cambiarlo a meno che non sia esplicitamente richiesto dall'utente
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      if (result.jobTitle && typeof result.jobTitle === 'string') {
        return result.jobTitle;
      }
    } catch (error) {
      console.error('Errore nel parsing della risposta OpenAI per il titolo lavorativo:', error);
    }
  } catch (error) {
    console.error('Errore nella chiamata a OpenAI per il titolo lavorativo:', error);
  }
  
  return null;
}

/**
 * Utilizza OpenAI per prevedere una data di chiusura per un'opportunità
 */
async function forecastCloseDateWithAI(dealRecord: Record<string, any>): Promise<string | null> {
  if (!openai) return null;
  
  try {
    const prompt = `
      Basandoti sui dettagli di questa opportunità di vendita, 
      prevedi una data di chiusura realistica. Fornisci solo la data nel formato YYYY-MM-DD come stringa JSON,
      senza spiegazioni.
      
      Nome opportunità: ${dealRecord.name || ''}
      Valore: ${dealRecord.value || ''}
      Stato: ${dealRecord.status || ''}
      Oggi è il: ${new Date().toISOString().split('T')[0]}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // il nuovo modello OpenAI è "gpt-4o" rilasciato il 13 maggio 2024. non cambiarlo a meno che non sia esplicitamente richiesto dall'utente
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      if (result.date && typeof result.date === 'string') {
        // Verifica che sia una data valida
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(result.date)) {
          return result.date;
        }
      }
    } catch (error) {
      console.error('Errore nel parsing della risposta OpenAI per la data di chiusura:', error);
    }
  } catch (error) {
    console.error('Errore nella chiamata a OpenAI per la data di chiusura:', error);
  }
  
  return null;
}