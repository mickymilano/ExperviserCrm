import { Router } from 'express';
import { EmailService } from '../modules/email/emailService';
import { EmailReceiver } from '../modules/email/emailReceiver';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { emails, emailAttachments } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = Router();

// Configurazione per il caricamento degli allegati
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/email-attachments');
      
      // Crea la directory se non esiste
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  })
});

// Ottiene tutte le email dell'utente
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Recupera le email dal database
    const userEmails = await db.select()
      .from(emails)
      .where(eq(emails.userId, userId))
      .orderBy(emails.receivedAt, 'desc'); // Ordina per data di ricezione decrescente
    
    return res.json(userEmails);
  } catch (error) {
    console.error('Errore nel recupero delle email:', error);
    return res.status(500).json({ error: 'Errore nel recupero delle email' });
  }
});

// Ottiene le email associate a un'entità
router.get('/entity/:entityType/:entityId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { entityType, entityId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    if (!['contact', 'company', 'deal', 'lead'].includes(entityType)) {
      return res.status(400).json({ error: 'Tipo di entità non valido' });
    }
    
    // Recupera le email dal database
    const entityEmails = await db.select()
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        eq(emails.entityType, entityType),
        eq(emails.entityId, entityId)
      ))
      .orderBy(emails.receivedAt, 'desc');
    
    // Per ogni email, recupera gli allegati
    for (const email of entityEmails) {
      email.attachments = await db.select()
        .from(emailAttachments)
        .where(eq(emailAttachments.emailId, email.id));
      
      // Rimuovi i contenuti binari degli allegati per evitare caricamenti pesanti
      if (email.attachments && email.attachments.length > 0) {
        email.attachments = email.attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          contentType: att.contentType,
          size: att.size
        }));
      }
    }
    
    return res.json(entityEmails);
  } catch (error) {
    console.error('Errore nel recupero delle email dell\'entità:', error);
    return res.status(500).json({ error: 'Errore nel recupero delle email dell\'entità' });
  }
});

// Ottiene un'email specifica
router.get('/:emailId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { emailId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Recupera l'email dal database
    const emailResult = await db.select()
      .from(emails)
      .where(and(
        eq(emails.id, emailId),
        eq(emails.userId, userId)
      ));
    
    if (emailResult.length === 0) {
      return res.status(404).json({ error: 'Email non trovata' });
    }
    
    const email = emailResult[0];
    
    // Recupera gli allegati
    email.attachments = await db.select()
      .from(emailAttachments)
      .where(eq(emailAttachments.emailId, emailId));
    
    // Rimuovi i contenuti binari degli allegati per evitare caricamenti pesanti
    if (email.attachments && email.attachments.length > 0) {
      email.attachments = email.attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        contentType: att.contentType,
        size: att.size
      }));
    }
    
    return res.json(email);
  } catch (error) {
    console.error('Errore nel recupero dell\'email:', error);
    return res.status(500).json({ error: 'Errore nel recupero dell\'email' });
  }
});

// Scarica un allegato
router.get('/attachment/:attachmentId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { attachmentId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Recupera l'allegato dal database
    const attachments = await db.select()
      .from(emailAttachments)
      .where(eq(emailAttachments.id, attachmentId));
    
    if (attachments.length === 0) {
      return res.status(404).json({ error: 'Allegato non trovato' });
    }
    
    const attachment = attachments[0];
    
    // Verifica che l'email appartenga all'utente
    const emailResult = await db.select()
      .from(emails)
      .where(and(
        eq(emails.id, attachment.emailId),
        eq(emails.userId, userId)
      ));
    
    if (emailResult.length === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    // Decodifica il contenuto da base64
    const contentBuffer = Buffer.from(attachment.content, 'base64');
    
    // Imposta gli header appropriati
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', contentBuffer.length);
    
    // Invia il file
    res.send(contentBuffer);
  } catch (error) {
    console.error('Errore nel download dell\'allegato:', error);
    return res.status(500).json({ error: 'Errore nel download dell\'allegato' });
  }
});

// Contrassegna un'email come letta
router.patch('/:emailId/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { emailId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Aggiorna lo stato dell'email
    await EmailService.markEmailAsRead(emailId, userId);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Errore nel marcare l\'email come letta:', error);
    return res.status(500).json({ error: 'Errore nel marcare l\'email come letta' });
  }
});

// Ottiene il conteggio delle email non lette
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const count = await EmailService.getUnreadCount(userId);
    
    return res.json({ count });
  } catch (error) {
    console.error('Errore nel recupero del conteggio delle email non lette:', error);
    return res.status(500).json({ error: 'Errore nel recupero del conteggio delle email non lette' });
  }
});

// Invia un'email
router.post('/send', requireAuth, upload.array('attachments'), async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const { to, subject, body, isHtml, entityId, entityType } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Mancano parametri obbligatori' });
    }
    
    // Prepara gli allegati
    const attachments = files ? files.map(file => ({
      filename: file.originalname,
      content: fs.readFileSync(file.path),
      contentType: file.mimetype
    })) : [];
    
    // Elimina i file temporanei
    if (files) {
      for (const file of files) {
        fs.unlinkSync(file.path);
      }
    }
    
    // Invia l'email
    const emailId = await EmailService.sendEmail({
      to,
      subject,
      body,
      isHtml: isHtml === 'true',
      attachments,
      entityId,
      entityType: entityType as any
    }, userId);
    
    return res.json({ success: true, emailId });
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    return res.status(500).json({ error: `Errore nell'invio dell'email: ${(error as Error).message}` });
  }
});

// Risponde a un'email
router.post('/:emailId/reply', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { emailId } = req.params;
    const { content } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Contenuto della risposta mancante' });
    }
    
    // Invia la risposta
    const replyId = await EmailService.replyToEmail(emailId, content, userId);
    
    return res.json({ success: true, emailId: replyId });
  } catch (error) {
    console.error('Errore nell\'invio della risposta:', error);
    return res.status(500).json({ error: `Errore nell'invio della risposta: ${(error as Error).message}` });
  }
});

export default router;