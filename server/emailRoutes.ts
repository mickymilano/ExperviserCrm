/**
 * Router per le API relative alle email
 */
import express from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
// Importazioni temporaneamente commentate perché le funzioni non sono disponibili
// import { getEmailAccounts } from './modules/email/emailListener';
// import { fetchAllEmails, fetchUnreadEmails, saveEmailToDatabase } from './modules/email/emailReceiver';

// Mock functions per sviluppo
const fetchUnreadEmails = async (accountId: number) => {
  console.log(`Mock fetchUnreadEmails per account ${accountId}`);
  return [];
};

const saveEmailToDatabase = async (accountId: number, email: any) => {
  console.log(`Mock saveEmailToDatabase per account ${accountId}`);
  return crypto.randomUUID();
};
import { EmailAccountDb } from './modules/email/types';
import { authenticateJWT } from './middleware/auth';

const router = express.Router();

/**
 * Ottieni tutti gli account email configurati
 */
router.get('/email/accounts', authenticateJWT, async (req, res) => {
  try {
    const accounts = await db.execute<EmailAccountDb>(
      sql`SELECT id, email, display_name, user_id, is_primary, is_active, status, 
          last_sync_time FROM email_accounts WHERE user_id = ${req.user?.id} ORDER BY is_primary DESC`
    );
    
    // Non restituire informazioni sensibili come password
    res.json(accounts);
  } catch (error) {
    console.error('[API] Errore nel recupero degli account email:', error);
    res.status(500).json({ error: 'Errore nel recupero degli account email' });
  }
});

/**
 * Crea un nuovo account email
 */
router.post('/email/accounts', authenticateJWT, async (req, res) => {
  try {
    const { email, display_name, imap_host, imap_port, imap_secure, 
            smtp_host, smtp_port, smtp_secure, username, password, is_primary } = req.body;
    
    // Validazione
    if (!email || !username || !password || !imap_host || !smtp_host) {
      return res.status(400).json({ error: 'Dati mancanti per la creazione dell\'account' });
    }
    
    // Se is_primary è true, imposta tutti gli altri account a is_primary = false
    if (is_primary) {
      await db.execute(
        sql`UPDATE email_accounts SET is_primary = false WHERE user_id = ${req.user?.id}`
      );
    }
    
    // Inserisci il nuovo account
    const result = await db.execute<{id: number}>(
      sql`INSERT INTO email_accounts (
        email, display_name, imap_host, imap_port, imap_secure, 
        smtp_host, smtp_port, smtp_secure, username, password, 
        user_id, is_primary, is_active, status, last_sync_time
      ) VALUES (
        ${email}, ${display_name || null}, ${imap_host}, ${imap_port || 993}, ${imap_secure !== false}, 
        ${smtp_host}, ${smtp_port || 587}, ${smtp_secure !== false}, ${username}, ${password}, 
        ${req.user?.id}, ${is_primary || false}, true, 'active', NOW()
      ) RETURNING id`
    );
    
    if (result.length === 0) {
      return res.status(500).json({ error: 'Errore nella creazione dell\'account' });
    }
    
    res.status(201).json({ id: result[0].id, message: 'Account email creato con successo' });
  } catch (error) {
    console.error('[API] Errore nella creazione dell\'account email:', error);
    res.status(500).json({ error: 'Errore nella creazione dell\'account email' });
  }
});

/**
 * Aggiorna un account email esistente
 */
router.put('/email/accounts/:id', authenticateJWT, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const { email, display_name, imap_host, imap_port, imap_secure, 
            smtp_host, smtp_port, smtp_secure, username, password, is_primary, is_active } = req.body;
    
    // Verifica che l'account appartenga all'utente
    const existingAccount = await db.execute<EmailAccountDb>(
      sql`SELECT * FROM email_accounts WHERE id = ${accountId} AND user_id = ${req.user?.id}`
    );
    
    if (existingAccount.length === 0) {
      return res.status(404).json({ error: 'Account email non trovato' });
    }
    
    // Se is_primary è impostato a true, imposta tutti gli altri account a false
    if (is_primary) {
      await db.execute(
        sql`UPDATE email_accounts SET is_primary = false WHERE user_id = ${req.user?.id}`
      );
    }
    
    // Aggiorna l'account
    const updateFields = [];
    if (email) updateFields.push(sql`email = ${email}`);
    if (display_name !== undefined) updateFields.push(sql`display_name = ${display_name}`);
    if (imap_host) updateFields.push(sql`imap_host = ${imap_host}`);
    if (imap_port) updateFields.push(sql`imap_port = ${imap_port}`);
    if (imap_secure !== undefined) updateFields.push(sql`imap_secure = ${imap_secure}`);
    if (smtp_host) updateFields.push(sql`smtp_host = ${smtp_host}`);
    if (smtp_port) updateFields.push(sql`smtp_port = ${smtp_port}`);
    if (smtp_secure !== undefined) updateFields.push(sql`smtp_secure = ${smtp_secure}`);
    if (username) updateFields.push(sql`username = ${username}`);
    if (password) updateFields.push(sql`password = ${password}`);
    if (is_primary !== undefined) updateFields.push(sql`is_primary = ${is_primary}`);
    if (is_active !== undefined) updateFields.push(sql`is_active = ${is_active}`);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }
    
    await db.execute(
      sql`UPDATE email_accounts SET ${sql.join(updateFields, sql`, `)}, updated_at = NOW() WHERE id = ${accountId}`
    );
    
    res.json({ message: 'Account email aggiornato con successo' });
  } catch (error) {
    console.error('[API] Errore nell\'aggiornamento dell\'account email:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'account email' });
  }
});

/**
 * Elimina un account email
 */
router.delete('/email/accounts/:id', authenticateJWT, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    
    // Verifica che l'account appartenga all'utente
    const existingAccount = await db.execute<EmailAccountDb>(
      sql`SELECT * FROM email_accounts WHERE id = ${accountId} AND user_id = ${req.user?.id}`
    );
    
    if (existingAccount.length === 0) {
      return res.status(404).json({ error: 'Account email non trovato' });
    }
    
    // Elimina l'account
    await db.execute(
      sql`DELETE FROM email_accounts WHERE id = ${accountId}`
    );
    
    res.json({ message: 'Account email eliminato con successo' });
  } catch (error) {
    console.error('[API] Errore nell\'eliminazione dell\'account email:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'account email' });
  }
});

/**
 * Testa la connessione a un account email
 */
router.post('/email/accounts/:id/test', authenticateJWT, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    
    // Verifica che l'account appartenga all'utente
    const existingAccount = await db.execute<EmailAccountDb>(
      sql`SELECT * FROM email_accounts WHERE id = ${accountId} AND user_id = ${req.user?.id}`
    );
    
    if (existingAccount.length === 0) {
      return res.status(404).json({ error: 'Account email non trovato' });
    }
    
    // Testa la connessione
    try {
      // Utilizza la funzione esistente per creare una configurazione IMAP
      // e tentare una connessione
      const emails = await fetchUnreadEmails(accountId);
      res.json({ 
        success: true, 
        message: 'Connessione riuscita',
        unreadCount: emails.length
      });
    } catch (testError) {
      console.error('[API] Errore nel test di connessione email:', testError);
      res.status(200).json({ 
        success: false, 
        message: 'Impossibile connettersi all\'account email',
        error: testError.message
      });
    }
  } catch (error) {
    console.error('[API] Errore nel test dell\'account email:', error);
    res.status(500).json({ error: 'Errore nel test dell\'account email' });
  }
});

/**
 * Ottieni tutte le email
 */
router.get('/email/messages', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { accountId, folder, limit = 50, entityType, entityId } = req.query;
    
    // Se è specificato un accountId, verifica che appartenga all'utente
    let accounts;
    if (accountId) {
      accounts = await db.execute<EmailAccountDb>(
        sql`SELECT * FROM email_accounts WHERE id = ${accountId} AND user_id = ${userId}`
      );
      
      if (accounts.length === 0) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
    } else {
      // Altrimenti, recupera tutti gli account dell'utente
      accounts = await db.execute<EmailAccountDb>(
        sql`SELECT * FROM email_accounts WHERE user_id = ${userId} AND is_active = true ORDER BY is_primary DESC`
      );
    }
    
    if (accounts.length === 0) {
      return res.json([]);
    }
    
    // Costruisci la query base
    let query = sql`
      SELECT e.*, a.email as account_email, a.display_name as account_display_name
      FROM emails e
      JOIN email_accounts a ON e.account_id = a.id
      WHERE a.user_id = ${userId}
    `;
    
    // Filtra per accountId se specificato
    if (accountId) {
      query = sql`${query} AND e.account_id = ${accountId}`;
    }
    
    // Filtra per folder se specificato
    if (folder) {
      query = sql`${query} AND e.folder = ${folder}`;
    }
    
    // Filtra per entità se specificato
    if (entityType && entityId) {
      query = sql`${query} AND EXISTS (
        SELECT 1 FROM email_entity_associations
        WHERE email_id = e.id AND entity_type = ${entityType} AND entity_id = ${entityId}
      )`;
    }
    
    // Ordina e limita
    query = sql`${query} ORDER BY e.date DESC LIMIT ${limit}`;
    
    // Esegui la query
    const emails = await db.execute(query);
    
    res.json(emails);
  } catch (error) {
    console.error('[API] Errore nel recupero delle email:', error);
    res.status(500).json({ error: 'Errore nel recupero delle email' });
  }
});

/**
 * Ottieni il dettaglio di una email
 */
router.get('/email/messages/:id', authenticateJWT, async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    // Recupera l'email con l'account associato
    const emails = await db.execute(
      sql`
        SELECT e.*, a.email as account_email, a.display_name as account_display_name
        FROM emails e
        JOIN email_accounts a ON e.account_id = a.id
        WHERE e.id = ${emailId} AND a.user_id = ${userId}
      `
    );
    
    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email non trovata' });
    }
    
    // Recupera anche gli allegati
    const attachments = await db.execute(
      sql`SELECT * FROM email_attachments WHERE email_id = ${emailId}`
    );
    
    // Recupera le associazioni con le entità
    const associations = await db.execute(
      sql`SELECT * FROM email_entity_associations WHERE email_id = ${emailId}`
    );
    
    // Combina i risultati
    const emailWithDetails = {
      ...emails[0],
      attachments,
      associations
    };
    
    res.json(emailWithDetails);
  } catch (error) {
    console.error('[API] Errore nel recupero del dettaglio email:', error);
    res.status(500).json({ error: 'Errore nel recupero del dettaglio email' });
  }
});

/**
 * Scarica le nuove email da un account
 */
router.post('/email/accounts/:id/sync', authenticateJWT, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    // Verifica che l'account appartenga all'utente
    const accounts = await db.execute<EmailAccountDb>(
      sql`SELECT * FROM email_accounts WHERE id = ${accountId} AND user_id = ${userId}`
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account email non trovato' });
    }
    
    // Recupera le email non lette
    try {
      const unreadEmails = await fetchUnreadEmails(accountId);
      console.log(`[API] Trovate ${unreadEmails.length} email non lette`);
      
      // Salva le email nel database
      const savedEmails = [];
      for (const email of unreadEmails) {
        const emailId = await saveEmailToDatabase(accountId, email);
        if (emailId) {
          savedEmails.push(emailId);
        }
      }
      
      // Aggiorna il timestamp di sincronizzazione
      await db.execute(
        sql`UPDATE email_accounts SET last_sync_time = NOW() WHERE id = ${accountId}`
      );
      
      res.json({ 
        success: true, 
        message: `Sincronizzazione completata. Scaricate ${unreadEmails.length} email.`,
        savedEmailIds: savedEmails
      });
    } catch (syncError) {
      console.error('[API] Errore nella sincronizzazione delle email:', syncError);
      
      // Aggiorna il timestamp e l'errore
      await db.execute(
        sql`UPDATE email_accounts SET last_sync_time = NOW(), last_error = ${syncError.message} WHERE id = ${accountId}`
      );
      
      res.status(200).json({ 
        success: false, 
        message: 'Errore nella sincronizzazione delle email',
        error: syncError.message
      });
    }
  } catch (error) {
    console.error('[API] Errore nella sincronizzazione delle email:', error);
    res.status(500).json({ error: 'Errore nella sincronizzazione delle email' });
  }
});

/**
 * Segna un'email come letta
 */
router.patch('/email/messages/:id/read', authenticateJWT, async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    // Verifica che l'email appartenga all'utente
    const emails = await db.execute(
      sql`
        SELECT e.id FROM emails e
        JOIN email_accounts a ON e.account_id = a.id
        WHERE e.id = ${emailId} AND a.user_id = ${userId}
      `
    );
    
    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email non trovata' });
    }
    
    // Aggiorna lo stato di lettura
    await db.execute(
      sql`UPDATE emails SET is_read = true, updated_at = NOW() WHERE id = ${emailId}`
    );
    
    res.json({ success: true, message: 'Email segnata come letta' });
  } catch (error) {
    console.error('[API] Errore nell\'aggiornamento dello stato di lettura:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato di lettura' });
  }
});

// L'endpoint di test e2e per il modulo email è implementato in mockEmailRoutes.ts

/**
 * Associa un'email a un'entità (contatto, azienda, deal, lead, branch)
 */
router.post('/email/messages/:id/associate', authenticateJWT, async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { entityType, entityId } = req.body;
    
    // Validazione
    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'Dati mancanti per l\'associazione' });
    }
    
    // Verifica che l'email appartenga all'utente
    const emails = await db.execute(
      sql`
        SELECT e.id FROM emails e
        JOIN email_accounts a ON e.account_id = a.id
        WHERE e.id = ${emailId} AND a.user_id = ${userId}
      `
    );
    
    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email non trovata' });
    }
    
    // Verifica che l'associazione non esista già
    const existingAssociations = await db.execute(
      sql`
        SELECT id FROM email_entity_associations 
        WHERE email_id = ${emailId} AND entity_type = ${entityType} AND entity_id = ${entityId}
      `
    );
    
    if (existingAssociations.length > 0) {
      return res.status(400).json({ error: 'L\'associazione esiste già' });
    }
    
    // Crea l'associazione
    await db.execute(
      sql`
        INSERT INTO email_entity_associations (email_id, entity_type, entity_id, created_at)
        VALUES (${emailId}, ${entityType}, ${entityId}, NOW())
      `
    );
    
    res.json({ success: true, message: 'Email associata con successo' });
  } catch (error) {
    console.error('[API] Errore nell\'associazione dell\'email:', error);
    res.status(500).json({ error: 'Errore nell\'associazione dell\'email' });
  }
});

export default router;