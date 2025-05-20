/**
 * Router semplificato per le API delle email associate alle entità
 */
import express from 'express';
const router = express.Router();

// Ottiene le email associate a un'entità
router.get('/entity/:entityType/:entityId', (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    if (!['contact', 'company', 'deal', 'lead'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    console.log(`Cercando email per ${entityType} con ID ${entityId}`);
    
    // Questa è una implementazione simulata per l'ambiente di sviluppo
    // Nell'ambiente di produzione, recupererebbe le email dal database
    const mockEmails = [
      {
        id: 1,
        from: 'cliente@esempio.com',
        to: ['me@azienda.com'],
        subject: 'Richiesta informazioni',
        body: 'Vorrei sapere di più sui vostri servizi.',
        isRead: false,
        date: new Date().toISOString(),
        receivedAt: new Date().toISOString()
      },
      {
        id: 2,
        from: 'me@azienda.com',
        to: ['cliente@esempio.com'],
        subject: 'Re: Richiesta informazioni',
        body: 'Grazie per il suo interesse. Ecco le informazioni richieste...',
        isRead: true,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 giorno fa
        receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        from: 'fornitore@esempio.com',
        to: ['me@azienda.com'],
        subject: 'Offerta commerciale',
        body: 'Vi inviamo la nostra migliore offerta per i prodotti richiesti.',
        isRead: false,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 giorni fa
        receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return res.json(mockEmails);
  } catch (error) {
    console.error('Errore nel recupero delle email dell\'entità:', error);
    return res.status(500).json({ error: 'Errore nel recupero delle email dell\'entità' });
  }
});

// Altri endpoint per gestire le email
router.get('/unread-count', (req, res) => {
  return res.json({ count: 4 }); // Mock count per sviluppo
});

export default router;