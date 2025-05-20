/**
 * API per importare ed esportare contatti, aziende e lead
 */
import express from 'express';
import multer from 'multer';
import { 
  importFromCsv,
  importFromExcel,
  exportToCsv,
  exportToExcel,
  detectDuplicates,
  aiEnhancer
} from '../modules/import-export';
import { db } from '../db';
import { contacts, companies, leads } from '../../shared/schema';

const router = express.Router();

// Configurazione multer per l'upload di file
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limite
});

// Endpoint per importare contatti/aziende/lead da CSV
router.post('/import/csv/:entityType', upload.single('file'), async (req, res) => {
  try {
    const { entityType } = req.params;
    
    // Verifica che il tipo di entità sia valido
    if (!['contacts', 'companies', 'leads'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // Verifica che il file sia presente
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }
    
    // Opzioni di importazione dal corpo della richiesta
    const options = req.body.options ? JSON.parse(req.body.options) : {};
    
    // Importa dal CSV
    const csvContent = req.file.buffer.toString('utf8');
    const result = await importFromCsv(csvContent, entityType as any, options);
    
    res.json(result);
  } catch (error) {
    console.error('Errore nell\'importazione da CSV:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'importazione da CSV' });
  }
});

// Endpoint per importare contatti/aziende/lead da Excel
router.post('/import/excel/:entityType', upload.single('file'), async (req, res) => {
  try {
    const { entityType } = req.params;
    
    // Verifica che il tipo di entità sia valido
    if (!['contacts', 'companies', 'leads'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // Verifica che il file sia presente
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }
    
    // Opzioni di importazione dal corpo della richiesta
    const options = req.body.options ? JSON.parse(req.body.options) : {};
    
    // Importa da Excel
    const result = await importFromExcel(req.file.buffer, entityType as any, options);
    
    res.json(result);
  } catch (error) {
    console.error('Errore nell\'importazione da Excel:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'importazione da Excel' });
  }
});

// Endpoint per esportare contatti/aziende/lead in CSV
router.post('/export/csv/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    
    // Verifica che il tipo di entità sia valido
    if (!['contacts', 'companies', 'leads'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // IDs da esportare (opzionale, se non specificati esporta tutti)
    const { ids = [], options = {} } = req.body;
    
    // Ottieni i dati da esportare
    let data = [];
    
    switch (entityType) {
      case 'contacts':
        if (ids.length > 0) {
          data = await db.select().from(contacts).where(db => db.inArray(contacts.id, ids));
        } else {
          data = await db.select().from(contacts);
        }
        break;
      case 'companies':
        if (ids.length > 0) {
          data = await db.select().from(companies).where(db => db.inArray(companies.id, ids));
        } else {
          data = await db.select().from(companies);
        }
        break;
      case 'leads':
        if (ids.length > 0) {
          data = await db.select().from(leads).where(db => db.inArray(leads.id, ids));
        } else {
          data = await db.select().from(leads);
        }
        break;
    }
    
    // Genera il CSV
    const csvContent = exportToCsv(data, entityType as any, options);
    
    // Imposta le intestazioni per il download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${entityType}_export.csv`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Errore nell\'esportazione in CSV:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'esportazione in CSV' });
  }
});

// Endpoint per esportare contatti/aziende/lead in Excel
router.post('/export/excel/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    
    // Verifica che il tipo di entità sia valido
    if (!['contacts', 'companies', 'leads'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // IDs da esportare (opzionale, se non specificati esporta tutti)
    const { ids = [], options = {} } = req.body;
    
    // Ottieni i dati da esportare
    let data = [];
    
    switch (entityType) {
      case 'contacts':
        if (ids.length > 0) {
          data = await db.select().from(contacts).where(db => db.inArray(contacts.id, ids));
        } else {
          data = await db.select().from(contacts);
        }
        break;
      case 'companies':
        if (ids.length > 0) {
          data = await db.select().from(companies).where(db => db.inArray(companies.id, ids));
        } else {
          data = await db.select().from(companies);
        }
        break;
      case 'leads':
        if (ids.length > 0) {
          data = await db.select().from(leads).where(db => db.inArray(leads.id, ids));
        } else {
          data = await db.select().from(leads);
        }
        break;
    }
    
    // Genera il file Excel
    const excelBuffer = await exportToExcel(data, entityType as any, options);
    
    // Imposta le intestazioni per il download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${entityType}_export.xlsx`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Errore nell\'esportazione in Excel:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'esportazione in Excel' });
  }
});

// Endpoint per verificare duplicati
router.post('/check-duplicates/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { entity, options = {} } = req.body;
    
    // Verifica che il tipo di entità sia valido
    if (!['contacts', 'companies', 'leads'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // Verifica che l'entità sia presente
    if (!entity) {
      return res.status(400).json({ error: 'Entità non specificata' });
    }
    
    // Verifica duplicati
    const result = await detectDuplicates(entity, entityType as any, options);
    
    res.json(result);
  } catch (error) {
    console.error('Errore nella verifica dei duplicati:', error);
    res.status(500).json({ error: error.message || 'Errore nella verifica dei duplicati' });
  }
});

// Endpoint per migliorare i dati con AI
router.post('/enhance/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { entity, options = {} } = req.body;
    
    // Verifica che il tipo di entità sia valido
    if (!['contacts', 'companies', 'leads'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // Verifica che l'entità sia presente
    if (!entity) {
      return res.status(400).json({ error: 'Entità non specificata' });
    }
    
    // Verifica che l'API key di OpenAI sia disponibile
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'API key di OpenAI non disponibile' });
    }
    
    // Migliora con AI
    const result = await aiEnhancer(entity, entityType as any, options);
    
    res.json(result);
  } catch (error) {
    console.error('Errore nel miglioramento con AI:', error);
    res.status(500).json({ error: error.message || 'Errore nel miglioramento con AI' });
  }
});

export default router;