import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getNotionConfigStatus, isNotionConfigured } from '../notion';
import { setupNotionDatabases, createSampleData } from '../setup-notion';

// Implementiamo direttamente il middleware di autenticazione per evitare dipendenze circolari
function authenticate(req: any, res: any, next: any) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Autenticazione richiesta' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token non valido' });
  }
}

interface Request {
  user?: any;
  params: any;
  query: any;
  body: any;
}

interface Response {
  status(code: number): Response;
  json(data: any): void;
}

const router = Router();

// Route per verificare lo stato dell'integrazione Notion
router.get('/status', authenticate, (req: Request, res: Response) => {
    try {
        const status = getNotionConfigStatus();
        res.json(status);
    } catch (error: any) {
        console.error('Errore nel controllo dello stato Notion:', error);
        res.status(500).json({
            error: 'Errore nel controllo dello stato dell\'integrazione Notion',
            message: error.message
        });
    }
});

// Route per inizializzare i database Notion
router.post('/setup', authenticate, async (req: Request, res: Response) => {
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
    } catch (error: any) {
        console.error('Errore nell\'inizializzazione dei database Notion:', error);
        res.status(500).json({
            error: 'Errore nell\'inizializzazione dei database Notion',
            message: error.message
        });
    }
});

// Route per creare dati di esempio
router.post('/sample-data', authenticate, async (req: Request, res: Response) => {
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
    } catch (error: any) {
        console.error('Errore nella creazione dei dati di esempio:', error);
        res.status(500).json({
            error: 'Errore nella creazione dei dati di esempio',
            message: error.message
        });
    }
});

export default router;