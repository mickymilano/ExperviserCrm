import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT as authenticate } from '../middleware/auth';
import { analyzeImportData, detectDuplicates, enhanceWithAI } from '../modules/import-export';

const router = express.Router();

// Configurazione di Multer per il caricamento dei file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtro per accettare solo file CSV e Excel
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato file non supportato. Utilizza CSV o Excel.'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Endpoint per caricare un file e analizzarlo
router.post('/api/import/analyze', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const filePath = req.file.path;
    const entityType = req.body.entityType || 'contacts';
    
    const result = await analyzeImportData(filePath, entityType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Errore durante l\'analisi del file:', error);
    res.status(500).json({ 
      error: 'Errore durante l\'analisi del file', 
      message: error.message 
    });
  }
});

// Endpoint per rilevare i duplicati
router.post('/api/import/detect-duplicates', authenticate, async (req, res) => {
  try {
    const { items, entityType, threshold } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Dati di importazione non validi' });
    }
    
    const duplicates = await detectDuplicates(items, entityType, threshold || 0.7);
    
    res.json({
      success: true,
      duplicates
    });
  } catch (error) {
    console.error('Errore durante il rilevamento dei duplicati:', error);
    res.status(500).json({ 
      error: 'Errore durante il rilevamento dei duplicati', 
      message: error.message 
    });
  }
});

// Endpoint per migliorare i dati con AI
router.post('/api/import/enhance-with-ai', authenticate, async (req, res) => {
  try {
    const { items, enhancementType } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Dati non validi per l\'arricchimento AI' });
    }
    
    const enhancedData = await enhanceWithAI(items, enhancementType);
    
    res.json({
      success: true,
      enhancedData
    });
  } catch (error) {
    console.error('Errore durante l\'arricchimento AI:', error);
    res.status(500).json({ 
      error: 'Errore durante l\'arricchimento AI', 
      message: error.message 
    });
  }
});

// Esportazione dati
router.get('/api/export/:entityType', authenticate, async (req, res) => {
  try {
    const { entityType } = req.params;
    const format = req.query.format || 'csv';
    
    // Implementare la logica di esportazione per i diversi tipi di entità
    // ...
    
    res.json({
      success: true,
      message: `Esportazione dei dati ${entityType} in formato ${format} non ancora implementata`
    });
  } catch (error) {
    console.error(`Errore durante l'esportazione dei dati ${req.params.entityType}:`, error);
    res.status(500).json({ 
      error: `Errore durante l'esportazione dei dati ${req.params.entityType}`, 
      message: error.message 
    });
  }
});

export default router;