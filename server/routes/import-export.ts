import express from 'express';
import { PostgresStorage } from '../postgresStorage';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';
import { parse as csvParse } from 'papaparse';
import { getDistanceScore } from '../modules/import-export/duplicate-detector';
import { OpenAI } from "openai";

const router = express.Router();
const storage = new PostgresStorage();

// Configurazione OpenAI per l'arricchimento dei dati
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

// Schema di validazione per l'importazione
const importRequestSchema = z.object({
  data: z.array(z.record(z.any()))
});

// Endpoint per l'importazione di dati
router.post('/import/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data } = importRequestSchema.parse(req.body);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        message: 'Nessun dato valido fornito per l\'importazione' 
      });
    }
    
    // Elabora i dati in base al tipo di entità
    let importedCount = 0;
    
    switch (entityType) {
      case 'contacts':
        // Mappa i dati ai campi corrispondenti nel database
        const contactsToInsert = data.map(record => ({
          firstName: record.firstName || '',
          lastName: record.lastName || '',
          email: record.email || '',
          phone: record.phone || null,
          jobTitle: record.jobTitle || null,
          tags: record.tags || [],
          notes: record.notes || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Inserisci i contatti nel database
        for (const contact of contactsToInsert) {
          await storage.createContact(contact);
          importedCount++;
        }
        break;
        
      case 'companies':
        // Mappa i dati ai campi corrispondenti nel database
        const companiesToInsert = data.map(record => ({
          name: record.name || '',
          email: record.email || null,
          phone: record.phone || null,
          website: record.website || null,
          industry: record.industry || null,
          employeeCount: record.employeeCount || null,
          annualRevenue: record.annualRevenue || null,
          location: record.location || null,
          founded: record.founded || null,
          tags: record.tags || [],
          notes: record.notes || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Inserisci le aziende nel database
        for (const company of companiesToInsert) {
          await storage.createCompany(company);
          importedCount++;
        }
        break;
        
      case 'deals':
        // Mappa i dati ai campi corrispondenti nel database
        const dealsToInsert = data.map(record => ({
          name: record.name || '',
          value: record.value ? record.value.toString() : null,
          status: record.status || 'active',
          notes: record.notes || null,
          tags: record.tags || [],
          contactId: record.contactId || null,
          companyId: record.companyId || null,
          stageId: record.stageId || 1,
          expectedCloseDate: record.expectedCloseDate || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Inserisci i deal nel database
        for (const deal of dealsToInsert) {
          await storage.createDeal(deal);
          importedCount++;
        }
        break;
        
      default:
        return res.status(400).json({ 
          message: `Tipo di entità non supportato: ${entityType}` 
        });
    }
    
    return res.status(200).json({ 
      message: `Importazione completata con successo`,
      count: importedCount
    });
    
  } catch (error) {
    console.error('Errore durante l\'importazione dei dati:', error);
    return res.status(500).json({ 
      message: 'Si è verificato un errore durante l\'importazione dei dati',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Endpoint per l'esportazione di dati
router.get('/export/:entityType/:fileType', async (req, res) => {
  try {
    const { entityType, fileType } = req.params;
    
    if (!['csv', 'excel'].includes(fileType)) {
      return res.status(400).json({ 
        message: 'Formato di file non supportato. Utilizzare "csv" o "excel".' 
      });
    }
    
    // Recupera i dati in base al tipo di entità
    let data = [];
    
    switch (entityType) {
      case 'contacts':
        data = await storage.getContacts();
        break;
        
      case 'companies':
        data = await storage.getCompanies();
        break;
        
      case 'deals':
        data = await storage.getDeals();
        break;
        
      default:
        return res.status(400).json({ 
          message: `Tipo di entità non supportato: ${entityType}` 
        });
    }
    
    // Prepara le intestazioni e formatta i dati per l'esportazione
    let headers = [];
    const formattedData = data.map(item => {
      const formattedItem = { ...item };
      
      // Converti gli array in stringhe
      if (formattedItem.tags && Array.isArray(formattedItem.tags)) {
        formattedItem.tags = formattedItem.tags.join(', ');
      }
      
      // Formatta le date
      for (const key in formattedItem) {
        if (formattedItem[key] instanceof Date) {
          formattedItem[key] = formattedItem[key].toISOString().split('T')[0];
        }
      }
      
      return formattedItem;
    });
    
    // Determina le intestazioni utilizzando il primo elemento
    if (formattedData.length > 0) {
      headers = Object.keys(formattedData[0]);
    }
    
    // Esporta nel formato richiesto
    if (fileType === 'excel') {
      // Crea un nuovo workbook Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dati');
      
      // Aggiungi l'intestazione
      worksheet.addRow(headers);
      
      // Aggiungi i dati
      formattedData.forEach(item => {
        const row = [];
        headers.forEach(header => {
          row.push(item[header] === null ? '' : item[header]);
        });
        worksheet.addRow(row);
      });
      
      // Imposta i tipi di risposta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${entityType}_export.xlsx`);
      
      // Invia il file Excel
      await workbook.xlsx.write(res);
      res.end();
      
    } else { // CSV
      // Crea le intestazioni per il CSV
      const csvHeader = headers.map(header => ({
        id: header,
        title: header
      }));
      
      // Crea lo stringifier CSV
      const csvStringifier = createObjectCsvStringifier({
        header: csvHeader
      });
      
      // Genera il contenuto CSV
      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(formattedData);
      
      // Imposta i tipi di risposta
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${entityType}_export.csv`);
      
      // Invia il file CSV
      res.send(csvContent);
    }
    
  } catch (error) {
    console.error('Errore durante l\'esportazione dei dati:', error);
    return res.status(500).json({ 
      message: 'Si è verificato un errore durante l\'esportazione dei dati',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Endpoint per analizzare i duplicati
router.post('/analyze-duplicates/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data } = importRequestSchema.parse(req.body);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        message: 'Nessun dato valido fornito per l\'analisi' 
      });
    }
    
    // Recupera i dati esistenti dal database
    let existingData = [];
    switch (entityType) {
      case 'contacts':
        existingData = await storage.getContacts();
        break;
      case 'companies':
        existingData = await storage.getCompanies();
        break;
      case 'deals':
        existingData = await storage.getDeals();
        break;
      default:
        return res.status(400).json({ 
          message: `Tipo di entità non supportato: ${entityType}` 
        });
    }
    
    // Analizza i duplicati confrontando i nuovi dati con quelli esistenti
    const duplicateGroups = [];
    
    for (const newItem of data) {
      const potentialDuplicates = [];
      
      for (const existingItem of existingData) {
        // Calcola un punteggio di similarità tra i due elementi
        const similarityScore = getDistanceScore(newItem, existingItem, entityType);
        
        // Se il punteggio è superiore alla soglia, considera come un potenziale duplicato
        if (similarityScore > 0.7) {
          potentialDuplicates.push({
            item: existingItem,
            score: similarityScore
          });
        }
      }
      
      // Se sono stati trovati duplicati, crea un gruppo
      if (potentialDuplicates.length > 0) {
        // Ordina i duplicati per punteggio di similarità (decrescente)
        potentialDuplicates.sort((a, b) => b.score - a.score);
        
        duplicateGroups.push({
          primaryRecord: newItem,
          duplicates: potentialDuplicates.map(dup => dup.item),
          similarityScore: potentialDuplicates[0].score
        });
      }
    }
    
    return res.status(200).json({
      duplicateGroups
    });
    
  } catch (error) {
    console.error('Errore durante l\'analisi dei duplicati:', error);
    return res.status(500).json({ 
      message: 'Si è verificato un errore durante l\'analisi dei duplicati',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Endpoint per l'arricchimento dei dati con AI
router.post('/enhance-data/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data, settings, confidenceThreshold } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        message: 'Nessun dato valido fornito per l\'arricchimento' 
      });
    }
    
    if (!openai) {
      return res.status(400).json({ 
        message: 'API Key OpenAI non configurata' 
      });
    }
    
    // Arricchisci i dati in base al tipo di entità e alle impostazioni
    const enhancedData = [];
    
    for (const record of data) {
      const enhanced = { ...record };
      
      // Applicare i miglioramenti in base alle impostazioni attive
      for (const setting of settings) {
        if (!setting.active) continue;
        
        switch (setting.id) {
          case 'normalize-phones':
            if (enhanced.phone && typeof enhanced.phone === 'string') {
              try {
                // Normalizza il numero di telefono in formato internazionale
                let phoneNumber = enhanced.phone.replace(/\s+/g, '');
                if (!phoneNumber.startsWith('+')) {
                  if (phoneNumber.startsWith('00')) {
                    phoneNumber = '+' + phoneNumber.substring(2);
                  } else if (phoneNumber.startsWith('0')) {
                    phoneNumber = '+39' + phoneNumber.substring(1);
                  } else {
                    phoneNumber = '+39' + phoneNumber;
                  }
                }
                enhanced.phone = phoneNumber;
                
                // Aggiungi informazioni sulla confidenza
                enhanced._ai_confidence = {
                  ...(enhanced._ai_confidence || {}),
                  phone: 0.95
                };
              } catch (error) {
                console.error('Errore durante la normalizzazione del telefono:', error);
              }
            }
            break;
            
          case 'suggest-tags':
            try {
              // Utilizza OpenAI per suggerire tag in base ai dati disponibili
              const recordDescription = Object.entries(enhanced)
                .filter(([key, value]) => 
                  value && 
                  typeof value === 'string' && 
                  !['id', 'createdAt', 'updatedAt'].includes(key)
                )
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
              
              const prompt = `
                Basandoti sui dati seguenti di un ${entityType === 'contacts' ? 'contatto' : entityType === 'companies' ? 'azienda' : 'opportunità di vendita'}, 
                suggerisci 2-3 tag pertinenti in italiano che potrebbero essere utili per la categorizzazione. 
                Fornisci solo un array JSON di stringhe, senza spiegazioni.
                
                Dati:
                ${recordDescription}
              `;
              
              const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
              });
              
              try {
                const result = JSON.parse(response.choices[0].message.content);
                if (result.tags && Array.isArray(result.tags)) {
                  enhanced.tags = result.tags;
                  
                  // Aggiungi informazioni sulla confidenza
                  enhanced._ai_confidence = {
                    ...(enhanced._ai_confidence || {}),
                    tags: 0.85
                  };
                }
              } catch (error) {
                console.error('Errore durante il parsing della risposta OpenAI:', error);
              }
            } catch (error) {
              console.error('Errore durante la generazione dei tag:', error);
            }
            break;
            
          case 'detect-industry':
            if (entityType === 'companies' && enhanced.name && (!enhanced.industry || enhanced.industry === '')) {
              try {
                const prompt = `
                  Basandoti sul nome dell'azienda e su qualsiasi altra informazione disponibile, 
                  determina il settore industriale più probabile. Fornisci solo il nome del settore in italiano come stringa JSON, 
                  senza spiegazioni.
                  
                  Nome azienda: ${enhanced.name}
                  ${enhanced.description ? 'Descrizione: ' + enhanced.description : ''}
                  ${enhanced.website ? 'Sito web: ' + enhanced.website : ''}
                `;
                
                const response = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0.7,
                  response_format: { type: "json_object" }
                });
                
                try {
                  const result = JSON.parse(response.choices[0].message.content);
                  if (result.industry && typeof result.industry === 'string') {
                    enhanced.industry = result.industry;
                    
                    // Aggiungi informazioni sulla confidenza
                    enhanced._ai_confidence = {
                      ...(enhanced._ai_confidence || {}),
                      industry: 0.8
                    };
                  }
                } catch (error) {
                  console.error('Errore durante il parsing della risposta OpenAI:', error);
                }
              } catch (error) {
                console.error('Errore durante il rilevamento del settore:', error);
              }
            }
            break;
        }
      }
      
      // Aggiungi campo di arricchimento AI
      enhanced._enriched_by_ai = true;
      
      enhancedData.push(enhanced);
    }
    
    return res.status(200).json({
      enhancedData
    });
    
  } catch (error) {
    console.error('Errore durante l\'arricchimento dei dati:', error);
    return res.status(500).json({ 
      message: 'Si è verificato un errore durante l\'arricchimento dei dati',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

export default router;