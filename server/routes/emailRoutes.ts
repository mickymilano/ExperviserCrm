/**
 * Rotte API per la gestione delle email
 */
import express from 'express';
import { authenticateJWT } from '../routes';
import { 
  getMockEmailsForEntity, 
  getUnreadEmailCount, 
  markEmailAsRead, 
  sendEmailReply, 
  sendNewEmail 
} from '../modules/email/mockEmailService';

const router = express.Router();

// Middleware di autenticazione per tutte le route email
router.use(authenticateJWT);

// Ottiene il conteggio delle email non lette
router.get('/unread-count', (req, res) => {
  try {
    const count = getUnreadEmailCount();
    return res.json({ count });
  } catch (error) {
    console.error('Errore nel recupero del conteggio email non lette:', error);
    return res.status(500).json({ 
      error: 'Errore nel recupero del conteggio email non lette' 
    });
  }
});

// Ottiene le email associate a un'entità specifica
router.get('/entity/:entityType/:entityId', (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Verifica che entityType sia valido
    if (!['contact', 'company', 'deal', 'lead'].includes(entityType)) {
      return res.status(400).json({ 
        error: 'Tipo di entità non valido. Valori accettati: contact, company, deal, lead' 
      });
    }
    
    console.log(`Cercando email per ${entityType} con ID ${entityId}`);
    
    const emails = getMockEmailsForEntity(entityType, entityId);
    return res.json(emails);
  } catch (error) {
    console.error('Errore nel recupero delle email dell\'entità:', error);
    return res.status(500).json({ 
      error: 'Errore nel recupero delle email dell\'entità' 
    });
  }
});

// Segna una email come letta
router.patch('/:emailId/read', (req, res) => {
  try {
    const { emailId } = req.params;
    const result = markEmailAsRead(emailId);
    
    if (result.success) {
      return res.json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Errore nel segnare l\'email come letta:', error);
    return res.status(500).json({ 
      error: 'Errore nel segnare l\'email come letta' 
    });
  }
});

// Invia una risposta a un'email
router.post('/:emailId/reply', (req, res) => {
  try {
    const { emailId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        error: 'Il contenuto della risposta non può essere vuoto' 
      });
    }
    
    const result = sendEmailReply(emailId, content);
    
    if (result.success) {
      return res.json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Errore nell\'invio della risposta:', error);
    return res.status(500).json({ 
      error: 'Errore nell\'invio della risposta' 
    });
  }
});

// Invia una nuova email
router.post('/send', (req, res) => {
  try {
    const { to, subject, body, entityId, entityType } = req.body;
    
    // Validazione dei dati richiesti
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        error: 'Destinatario, oggetto e corpo dell\'email sono obbligatori' 
      });
    }
    
    // Validazione del tipo di entità, se presente
    if (entityType && !['contact', 'company', 'deal', 'lead'].includes(entityType)) {
      return res.status(400).json({ 
        error: 'Tipo di entità non valido. Valori accettati: contact, company, deal, lead' 
      });
    }
    
    const result = sendNewEmail({ to, subject, body, entityId, entityType });
    
    if (result.success) {
      return res.json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    return res.status(500).json({ 
      error: 'Errore nell\'invio dell\'email' 
    });
  }
});

// Gestisce il download degli allegati
router.get('/attachment/:attachmentId', (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // In produzione, questa rotta dovrebbe recuperare l'allegato da un archivio 
    // o da un servizio di storage e inviarlo al client
    
    console.log(`Richiesta di download dell'allegato ${attachmentId}`);
    
    // Per ora, restituiamo un messaggio informativo
    res.set('Content-Type', 'text/plain');
    return res.send(`Questa è una simulazione di download dell'allegato con ID ${attachmentId}`);
    
    // In produzione, il codice dovrebbe essere simile a questo:
    // const attachment = await getAttachmentFromStorage(attachmentId);
    // res.set('Content-Type', attachment.contentType);
    // res.set('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    // return res.send(attachment.content);
  } catch (error) {
    console.error('Errore nel download dell\'allegato:', error);
    return res.status(500).json({ 
      error: 'Errore nel download dell\'allegato' 
    });
  }
});

export default router;