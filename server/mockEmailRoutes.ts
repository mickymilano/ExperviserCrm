/**
 * Implementazione delle route di test per le email
 */
import express from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { authenticateJWT } from './middleware/auth';

const router = express.Router();

/**
 * Endpoint di test e2e per il modulo email
 * Questa API inserisce direttamente nel database alcune email di test
 */
router.get('/email/messages/e2e-test', authenticateJWT, async (req, res) => {
  try {
    console.log('[API] Inserimento dati di test per email...');
    
    // Prima otteniamo l'account email dell'utente
    const userId = req.user?.id;
    const accounts = await db.execute(
      sql`SELECT * FROM email_accounts WHERE user_id = ${userId} ORDER BY is_primary DESC LIMIT 1`
    );
    
    let accountId = null;
    
    if (accounts.length === 0) {
      // Se non esiste un account, ne creiamo uno di test
      console.log('[API] Nessun account email trovato, creazione account di test...');
      const result = await db.execute<{id: number}>(
        sql`INSERT INTO email_accounts (
          email, display_name, imap_host, imap_port, imap_secure, 
          smtp_host, smtp_port, smtp_secure, username, password, 
          user_id, is_primary, is_active, status, last_sync_time
        ) VALUES (
          'test@example.com', 'Test Account', 'imap.example.com', 993, true, 
          'smtp.example.com', 587, true, 'test@example.com', 'password123', 
          ${userId}, true, true, 'active', NOW()
        ) RETURNING id`
      );
      
      if (result.length > 0) {
        accountId = result[0].id;
        console.log(`[API] Account di test creato con ID ${accountId}`);
      } else {
        return res.status(500).json({ error: 'Impossibile creare account di test' });
      }
    } else {
      accountId = accounts[0].id;
      console.log(`[API] Usando account esistente con ID ${accountId}`);
    }
    
    // Ora creiamo le email di test
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    
    // Prima email di test
    const email1Result = await db.execute<{id: number}>(
      sql`INSERT INTO emails (
        account_id, message_id, subject, "from", "to", 
        body, date, is_read, has_attachments, folder
      ) VALUES (
        ${accountId}, 'test-id-1', '[TEST] Email di test 1', 'test@example.com', '["user@yourcompany.com"]', 
        '<p>Questa è un''email di test per verificare la funzionalità del modulo email.</p>', 
        ${now}, false, false, 'inbox'
      ) RETURNING id`
    );
    
    // Seconda email di test (con allegato)
    const email2Result = await db.execute<{id: number}>(
      sql`INSERT INTO emails (
        account_id, message_id, subject, "from", "to", 
        body, date, is_read, has_attachments, folder
      ) VALUES (
        ${accountId}, 'test-id-2', '[TEST] Email di test 2 con allegato', 'client@example.com', '["user@yourcompany.com"]', 
        '<p>Questa è un''altra email di test con allegato simulato.</p>', 
        ${hourAgo}, true, true, 'inbox'
      ) RETURNING id`
    );
    
    // Aggiungiamo un allegato alla seconda email
    if (email2Result.length > 0) {
      await db.execute(
        sql`INSERT INTO email_attachments (
          email_id, filename, content_type, size, content_id
        ) VALUES (
          ${email2Result[0].id}, 'test.pdf', 'application/pdf', 12345, 'attachment-id-1'
        )`
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Email di test create con successo',
      emailIds: [
        email1Result.length > 0 ? email1Result[0].id : null,
        email2Result.length > 0 ? email2Result[0].id : null
      ]
    });
  } catch (error) {
    console.error('[API] Errore nel test e2e:', error);
    res.status(500).json({ error: 'Errore nella creazione delle email di test' });
  }
});

export default router;