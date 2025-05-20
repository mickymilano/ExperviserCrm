import express from 'express';
import multer from 'multer';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import * as ExcelJS from 'exceljs';

// Configurazione di multer per l'upload dei file
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite file: 5MB
  },
  fileFilter: function (req, file, cb) {
    // Accetta solo CSV e Excel
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExts = ['.csv', '.xls', '.xlsx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Formato file non supportato. Utilizzare CSV o Excel.'));
    }
  }
});

// Crea il router
const router = express.Router();

// Endpoint per importare dati da CSV o Excel
router.post('/import/:entityType/:fileType', upload.single('file'), async (req, res) => {
  try {
    const { entityType, fileType } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const filePath = req.file.path;
    let parsedData = [];

    // Parsing del file in base al tipo
    if (fileType === 'csv') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const result = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      parsedData = result.data;
    } else if (fileType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      
      const headers = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.text);
      });
      
      parsedData = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Salta la riga di intestazione
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.text;
          });
          parsedData.push(rowData);
        }
      });
    }

    // Importazione dei dati nel database in base al tipo di entità
    let importedCount = 0;
    if (entityType === 'contacts') {
      const db = storage;
      for (const item of parsedData) {
        await db.createContact({
          firstName: item.firstName || item.first_name || '',
          lastName: item.lastName || item.last_name || '',
          email: item.email || null,
          phone: item.phone || null,
          address: item.address || null,
          notes: item.notes || null,
          company: item.company || null,
          role: item.role || item.job_title || null,
          source: item.source || 'import',
          status: item.status || 'active',
        });
        importedCount++;
      }
    } else if (entityType === 'companies') {
      const db = storage;
      for (const item of parsedData) {
        await db.createCompany({
          name: item.name || '',
          email: item.email || null,
          phone: item.phone || null,
          address: item.address || null,
          website: item.website || null,
          industry: item.industry || null,
          size: item.size || null,
          description: item.description || null,
          status: item.status || 'active',
        });
        importedCount++;
      }
    } else if (entityType === 'leads') {
      const db = storage;
      for (const item of parsedData) {
        await db.createLead({
          title: item.title || item.name || '',
          description: item.description || null,
          status: item.status || 'new',
          source: item.source || 'import',
          value: item.value || null,
        });
        importedCount++;
      }
    } else {
      return res.status(400).json({ error: 'Tipo di entità non supportato' });
    }

    // Pulizia del file temporaneo
    fs.unlinkSync(filePath);

    return res.status(200).json({ 
      success: true, 
      message: `Importati ${importedCount} elementi con successo`,
      count: importedCount
    });
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
    return res.status(500).json({ 
      error: 'Errore durante l\'importazione', 
      message: error.message 
    });
  }
});

// Endpoint per esportare dati in CSV o Excel
router.get('/export/:entityType/:fileType', async (req, res) => {
  try {
    const { entityType, fileType } = req.params;
    
    // Recupera i dati in base al tipo di entità
    let data = [];
    if (entityType === 'contacts') {
      data = await storage.getAllContacts();
    } else if (entityType === 'companies') {
      data = await storage.getAllCompanies();
    } else if (entityType === 'leads') {
      data = await storage.getAllLeads();
    } else {
      return res.status(400).json({ error: 'Tipo di entità non supportato' });
    }

    // Esportazione in base al formato richiesto
    if (fileType === 'csv') {
      const csv = Papa.unparse(data);
      
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}-export.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      
      return res.send(csv);
    } else if (fileType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Export');
      
      // Aggiungi le intestazioni
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
        
        // Aggiungi i dati
        data.forEach(item => {
          const values = headers.map(header => item[header] || '');
          worksheet.addRow(values);
        });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}-export.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      const buffer = await workbook.xlsx.writeBuffer();
      return res.send(buffer);
    } else {
      return res.status(400).json({ error: 'Formato non supportato. Utilizzare csv o excel' });
    }
  } catch (error) {
    console.error('Errore durante l\'esportazione:', error);
    return res.status(500).json({ 
      error: 'Errore durante l\'esportazione', 
      message: error.message 
    });
  }
});

// Endpoint per l'analisi dei duplicati
router.post('/duplicates/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    
    // Recupera tutti i dati dell'entità
    let allItems = [];
    if (entityType === 'contacts') {
      allItems = await storage.getAllContacts();
    } else if (entityType === 'companies') {
      allItems = await storage.getAllCompanies();
    } else if (entityType === 'leads') {
      allItems = await storage.getAllLeads();
    } else {
      return res.status(400).json({ error: 'Tipo di entità non supportato' });
    }
    
    // Funzione di confronto per trovare duplicati
    // In un'implementazione reale, si userebbero algoritmi più sofisticati
    const findDuplicates = (items) => {
      const duplicates = [];
      
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          let similarity = 0;
          
          if (entityType === 'contacts') {
            // Verifica duplicati contatti
            if (items[i].email && items[i].email === items[j].email) similarity += 0.5;
            if (items[i].phone && items[i].phone === items[j].phone) similarity += 0.3;
            if (items[i].firstName === items[j].firstName && items[i].lastName === items[j].lastName) similarity += 0.2;
          } else if (entityType === 'companies') {
            // Verifica duplicati aziende
            if (items[i].name && items[i].name === items[j].name) similarity += 0.5;
            if (items[i].email && items[i].email === items[j].email) similarity += 0.3;
            if (items[i].phone && items[i].phone === items[j].phone) similarity += 0.2;
          } else if (entityType === 'leads') {
            // Verifica duplicati opportunità
            if (items[i].title && items[i].title === items[j].title) similarity += 0.6;
            if (items[i].description && items[i].description === items[j].description) similarity += 0.4;
          }
          
          // Se la similarità è abbastanza alta, considera come duplicato
          if (similarity >= 0.5) {
            // Aggiungi solo se non è già nella lista
            if (!duplicates.some(dup => dup.id === items[i].id)) {
              duplicates.push(items[i]);
            }
          }
        }
      }
      
      return duplicates;
    };
    
    const duplicates = findDuplicates(allItems);
    
    return res.status(200).json({ 
      success: true,
      duplicates,
      count: duplicates.length
    });
  } catch (error) {
    console.error('Errore durante l\'analisi dei duplicati:', error);
    return res.status(500).json({ 
      error: 'Errore durante l\'analisi dei duplicati', 
      message: error.message 
    });
  }
});

// Endpoint per l'arricchimento dei dati con AI
router.post('/enhance/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { entity, options } = req.body;
    
    // Controlla se è disponibile l'API key di OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        error: 'Chiave API OpenAI mancante',
        message: 'Configurare l\'API key di OpenAI nelle variabili d\'ambiente' 
      });
    }

    // In un'implementazione reale, qui verrebbe utilizzata l'API di OpenAI
    // per analizzare e arricchire i dati. Per questa demo, simuliamo l'arricchimento
    // Qui dovrebbe essere integrato il codice del blueprint OpenAI
    
    // Simulazione dell'arricchimento
    const enhance = async (item, enhancementType) => {
      // Modifica simulata in base al tipo di arricchimento
      const enhanced = { ...item };
      
      if (enhancementType === 'categorization' || enhancementType === 'all') {
        if (entityType === 'contacts') {
          enhanced.category = 'Cliente potenziale';
        } else if (entityType === 'companies') {
          enhanced.category = 'Partner';
        } else if (entityType === 'leads') {
          enhanced.category = 'Alta priorità';
        }
      }
      
      if (enhancementType === 'tagging' || enhancementType === 'all') {
        enhanced.tags = enhanced.tags || [];
        if (entityType === 'contacts') {
          enhanced.tags.push('nuovo contatto', 'follow-up');
        } else if (entityType === 'companies') {
          enhanced.tags.push('nuovo cliente', 'tech');
        } else if (entityType === 'leads') {
          enhanced.tags.push('Q2', 'opportunità');
        }
      }
      
      return enhanced;
    };
    
    // Arricchisci tutti gli elementi o uno specifico
    let enhancedCount = 0;
    const enhancementType = options?.enhancementType || 'all';
    
    // Se è specificata un'entità specifica, arricchisci solo quella
    if (entity && entity.id) {
      let originalItem;
      
      if (entityType === 'contacts') {
        originalItem = await storage.getContactById(entity.id);
        if (originalItem) {
          const enhancedItem = await enhance(originalItem, enhancementType);
          await storage.updateContact(entity.id, enhancedItem);
          enhancedCount = 1;
        }
      } else if (entityType === 'companies') {
        originalItem = await storage.getCompanyById(entity.id);
        if (originalItem) {
          const enhancedItem = await enhance(originalItem, enhancementType);
          await storage.updateCompany(entity.id, enhancedItem);
          enhancedCount = 1;
        }
      } else if (entityType === 'leads') {
        originalItem = await storage.getLeadById(entity.id);
        if (originalItem) {
          const enhancedItem = await enhance(originalItem, enhancementType);
          await storage.updateLead(entity.id, enhancedItem);
          enhancedCount = 1;
        }
      }
    } else {
      // Arricchisci tutti gli elementi
      let allItems = [];
      
      if (entityType === 'contacts') {
        allItems = await storage.getAllContacts();
        for (const item of allItems) {
          const enhancedItem = await enhance(item, enhancementType);
          await storage.updateContact(item.id, enhancedItem);
          enhancedCount++;
        }
      } else if (entityType === 'companies') {
        allItems = await storage.getAllCompanies();
        for (const item of allItems) {
          const enhancedItem = await enhance(item, enhancementType);
          await storage.updateCompany(item.id, enhancedItem);
          enhancedCount++;
        }
      } else if (entityType === 'leads') {
        allItems = await storage.getAllLeads();
        for (const item of allItems) {
          const enhancedItem = await enhance(item, enhancementType);
          await storage.updateLead(item.id, enhancedItem);
          enhancedCount++;
        }
      }
    }
    
    return res.status(200).json({ 
      success: true,
      message: `Arricchiti ${enhancedCount} elementi con successo`,
      count: enhancedCount
    });
  } catch (error) {
    console.error('Errore durante l\'arricchimento dei dati:', error);
    return res.status(500).json({ 
      error: 'Errore durante l\'arricchimento dei dati', 
      message: error.message 
    });
  }
});

export default router;