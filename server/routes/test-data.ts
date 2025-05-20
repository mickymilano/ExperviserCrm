/**
 * API per la gestione dei dati di test
 * 
 * Fornisce endpoint per:
 * - Rimuovere tutti i dati di test esistenti
 * - Generare nuovi dati di test
 * - Eseguire un reset completo (rimozione + generazione)
 */

import express from 'express';
import { removeAllTestData, generateTestData, resetAndGenerateTestData } from '../test-data-manager';

const router = express.Router();

// Endpoint per rimuovere tutti i dati di test
router.post('/reset', async (req, res) => {
  try {
    const success = await removeAllTestData();
    
    if (success) {
      res.json({ success: true, message: 'Tutti i dati di test sono stati rimossi con successo' });
    } else {
      res.status(500).json({ success: false, message: 'Si è verificato un errore durante la rimozione dei dati di test' });
    }
  } catch (error) {
    console.error('Errore durante la rimozione dei dati di test:', error);
    res.status(500).json({ success: false, message: 'Si è verificato un errore durante la rimozione dei dati di test' });
  }
});

// Endpoint per generare nuovi dati di test
router.post('/generate', async (req, res) => {
  try {
    const success = await generateTestData();
    
    if (success) {
      res.json({ success: true, message: 'I dati di test sono stati generati con successo' });
    } else {
      res.status(500).json({ success: false, message: 'Si è verificato un errore durante la generazione dei dati di test' });
    }
  } catch (error) {
    console.error('Errore durante la generazione dei dati di test:', error);
    res.status(500).json({ success: false, message: 'Si è verificato un errore durante la generazione dei dati di test' });
  }
});

// Endpoint per rimuovere e rigenerare i dati di test
router.post('/reset-and-generate', async (req, res) => {
  try {
    const success = await resetAndGenerateTestData();
    
    if (success) {
      res.json({ success: true, message: 'I dati di test sono stati rimossi e rigenerati con successo' });
    } else {
      res.status(500).json({ success: false, message: 'Si è verificato un errore durante il reset e la rigenerazione dei dati di test' });
    }
  } catch (error) {
    console.error('Errore durante il reset e la rigenerazione dei dati di test:', error);
    res.status(500).json({ success: false, message: 'Si è verificato un errore durante il reset e la rigenerazione dei dati di test' });
  }
});

export default router;