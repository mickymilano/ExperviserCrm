import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getNotionConfigStatus, isNotionConfigured } from '../notion';
import { setupNotionDatabases, createSampleData } from '../setup-notion';

const router = Router();

// Route per verificare lo stato dell'integrazione Notion
router.get('/status', requireAuth, (req, res) => {
    try {
        const status = getNotionConfigStatus();
        res.json(status);
    } catch (error) {
        console.error('Errore nel controllo dello stato Notion:', error);
        res.status(500).json({
            error: 'Errore nel controllo dello stato dell\'integrazione Notion',
            message: error.message
        });
    }
});

// Route per inizializzare i database Notion
router.post('/setup', requireAuth, async (req, res) => {
    try {
        if (!isNotionConfigured()) {
            return res.status(400).json({
                error: 'Configurazione incompleta',
                message: 'Le variabili d\'ambiente NOTION_INTEGRATION_SECRET e NOTION_PAGE_URL devono essere configurate.'
            });
        }

        await setupNotionDatabases();
        res.json({
            success: true,
            message: 'Database Notion inizializzati con successo'
        });
    } catch (error) {
        console.error('Errore nell\'inizializzazione dei database Notion:', error);
        res.status(500).json({
            error: 'Errore nell\'inizializzazione dei database Notion',
            message: error.message
        });
    }
});

// Route per creare dati di esempio
router.post('/sample-data', requireAuth, async (req, res) => {
    try {
        if (!isNotionConfigured()) {
            return res.status(400).json({
                error: 'Configurazione incompleta',
                message: 'Le variabili d\'ambiente NOTION_INTEGRATION_SECRET e NOTION_PAGE_URL devono essere configurate.'
            });
        }

        await createSampleData();
        res.json({
            success: true,
            message: 'Dati di esempio creati con successo in Notion'
        });
    } catch (error) {
        console.error('Errore nella creazione dei dati di esempio:', error);
        res.status(500).json({
            error: 'Errore nella creazione dei dati di esempio',
            message: error.message
        });
    }
});

export default router;