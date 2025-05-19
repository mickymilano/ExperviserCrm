import * as ImapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { db } from '../../db';
import { emails, emailAccounts } from '../../../shared/email/schema';
import { extractSignatureData } from './signatureParser';
import { processDomainForCompany } from './companyMatcher';
import { processContactFromEmail } from './contactProcessor';
import { eq } from 'drizzle-orm';

// Configurazione per la connessione IMAP
export interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  authTimeout: number;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
}

interface EmailAccount {
  id: number;
  email: string;
  username: string;
  password: string;
  server: string;
  port: number;
  tls: boolean;
}

// Registro delle connessioni attive
const activeConnections: Map<number, ImapSimple.ImapSimpleObject> = new Map();

/**
 * Avvia una connessione IMAP attiva in modalità IDLE per ricevere email in tempo reale
 */
export async function startEmailListener(accountConfig: EmailAccount) {
  // Chiudi eventuali connessioni esistenti per questo account
  if (activeConnections.has(accountConfig.id)) {
    try {
      const existingConnection = activeConnections.get(accountConfig.id);
      if (existingConnection) {
        existingConnection.end();
      }
    } catch (err) {
      console.error(`Errore chiudendo connessione esistente per account ${accountConfig.id}:`, err);
    }
    activeConnections.delete(accountConfig.id);
  }

  const config = {
    imap: {
      user: accountConfig.username,
      password: accountConfig.password,
      host: accountConfig.server,
      port: accountConfig.port,
      tls: accountConfig.tls,
      authTimeout: 3000,
      tlsOptions: {
        rejectUnauthorized: false
      }
    }
  };

  try {
    console.log(`[EmailListener] Avvio connessione IMAP per account ${accountConfig.id} (${accountConfig.email})`);
    
    const connection = await ImapSimple.connect(config);
    activeConnections.set(accountConfig.id, connection);
    
    await connection.openBox('INBOX');
    console.log(`[EmailListener] Connessione stabilita per account ${accountConfig.id}`);

    // Alla prima connessione, processiamo tutte le email non lette
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[EmailListener] Trovate ${messages.length} email non lette per account ${accountConfig.id}`);
    
    // Processa le email non lette
    for (const message of messages) {
      await processEmail(message, accountConfig.id, connection);
    }

    // Configura l'event listener per nuove email (modalità IDLE)
    connection.on('mail', async () => {
      try {
        console.log(`[EmailListener] Ricevuta nuova email per account ${accountConfig.id}`);
        
        const newMessages = await connection.search(['UNSEEN'], fetchOptions);
        for (const message of newMessages) {
          await processEmail(message, accountConfig.id, connection);
        }
      } catch (error) {
        console.error(`[EmailListener] Errore nel processare nuove email per account ${accountConfig.id}:`, error);
      }
    });

    // Gestisci gli errori di connessione
    connection.on('error', async (err) => {
      console.error(`[EmailListener] Errore connessione IMAP per account ${accountConfig.id}:`, err);
      
      // Rimuovi la connessione dal registro
      activeConnections.delete(accountConfig.id);
      
      // Attendi 30 secondi e prova a riconnetterti
      console.log(`[EmailListener] Tentativo di riconnessione tra 30 secondi per account ${accountConfig.id}`);
      setTimeout(() => {
        startEmailListener(accountConfig).catch(err => {
          console.error(`[EmailListener] Fallita riconnessione per account ${accountConfig.id}:`, err);
        });
      }, 30000);
    });

    // Gestisci la disconnessione
    connection.on('end', () => {
      console.log(`[EmailListener] Connessione IMAP terminata per account ${accountConfig.id}`);
      activeConnections.delete(accountConfig.id);
    });

    console.log(`[EmailListener] Listener IMAP attivo per account ${accountConfig.id}`);
    return true;
  } catch (error) {
    console.error(`[EmailListener] Errore inizializzazione listener per account ${accountConfig.id}:`, error);
    activeConnections.delete(accountConfig.id);
    return false;
  }
}

/**
 * Elaborazione di una singola email
 */
async function processEmail(message: ImapSimple.Message, accountId: number, connection: ImapSimple.ImapSimpleObject) {
  try {
    // Ottieni l'intero messaggio
    const all = message.parts.find(part => part.which === '');
    if (!all) {
      console.error('[EmailListener] Impossibile trovare il corpo del messaggio');
      return;
    }
    
    // Analisi dell'email
    const parsed = await simpleParser(all.body);
    
    // Estrai gli header principali
    const from = parsed.from?.value[0];
    const messageId = parsed.messageId;
    
    if (!from || !from.address || !messageId) {
      console.error('[EmailListener] Email mancante di informazioni essenziali');
      return;
    }
    
    // Verifica se l'email è già stata processata (duplicato)
    const existingEmail = await db.select().from(emails)
      .where(eq(emails.messageId, messageId))
      .limit(1);
    
    if (existingEmail.length > 0) {
      console.log(`[EmailListener] Email con Message-ID ${messageId} già presente nel database`);
      return;
    }
    
    // Estrai i dati dalla firma
    const signatureData = extractSignatureData(parsed.text || '', parsed.html || '');
    
    // Prepara i dati per l'inserimento dell'email
    const emailData = {
      accountId: accountId,
      messageId,
      conversationId: parsed.messageId || '',  // Usa messageId come base per conversationId
      from: JSON.stringify(from),
      to: JSON.stringify(parsed.to?.value || []),
      cc: JSON.stringify(parsed.cc?.value || []),
      bcc: JSON.stringify(parsed.bcc?.value || []),
      subject: parsed.subject || '(No Subject)',
      textBody: parsed.text || '',
      htmlBody: parsed.html || '',
      receivedDate: parsed.date || new Date(),
      isRead: false,
      hasAttachments: parsed.attachments.length > 0,
      attachments: JSON.stringify(parsed.attachments.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size
      }))),
      extractedData: JSON.stringify(signatureData),
      rawHeaders: JSON.stringify(parsed.headers),
      direction: 'inbound',
      status: 'received'
    };
    
    // Inserisci l'email nel database
    const [savedEmail] = await db.insert(emails).values(emailData).returning();
    
    // Elabora il dominio per identificare l'azienda
    if (from.address) {
      const emailDomain = from.address.split('@')[1];
      if (emailDomain) {
        const companyId = await processDomainForCompany(emailDomain, from.address);
        
        // Se è stata identificata un'azienda, aggiorna l'email
        if (companyId) {
          await db.update(emails)
            .set({ companyId })
            .where(eq(emails.id, savedEmail.id));
        }
      }
    }
    
    // Elabora il mittente per identificare/creare un contatto
    const contactId = await processContactFromEmail(from, signatureData);
    if (contactId) {
      await db.update(emails)
        .set({ contactId })
        .where(eq(emails.id, savedEmail.id));
    }
    
    console.log(`[EmailListener] Email salvata con ID ${savedEmail.id} per account ${accountId}`);
    
    // Marca l'email come letta sul server
    await connection.addFlags(message.attributes.uid, ['\\Seen']);
    
    return savedEmail.id;
  } catch (error) {
    console.error('[EmailListener] Errore nell\'elaborazione dell\'email:', error);
    return null;
  }
}

/**
 * Recupera tutti gli account email dal database
 */
export async function getEmailAccounts(): Promise<EmailAccount[]> {
  try {
    const accounts = await db.select().from(emailAccounts);
    
    // Trasforma i record del DB in configurazioni IMAP
    return accounts.map(account => ({
      id: account.id,
      email: account.email,
      username: account.imapUsername || account.email,
      password: account.imapPassword || '',
      server: account.imapHost || '',
      port: account.imapPort || 993,
      tls: account.imapSecure !== false
    }));
  } catch (error) {
    console.error('[EmailListener] Errore nel recupero degli account email:', error);
    return [];
  }
}

/**
 * Chiudi tutte le connessioni IMAP attive
 */
export function closeAllConnections() {
  for (const [accountId, connection] of activeConnections.entries()) {
    try {
      console.log(`[EmailListener] Chiusura connessione per account ${accountId}`);
      connection.end();
    } catch (err) {
      console.error(`[EmailListener] Errore chiudendo connessione per account ${accountId}:`, err);
    }
  }
  activeConnections.clear();
}

/**
 * Funzione di utilità per testare una connessione IMAP
 */
export async function testImapConnection(config: {
  username: string;
  password: string;
  server: string;
  port: number;
  tls: boolean;
}): Promise<boolean> {
  try {
    const connection = await ImapSimple.connect({
      imap: {
        user: config.username,
        password: config.password,
        host: config.server,
        port: config.port,
        tls: config.tls,
        authTimeout: 3000,
        tlsOptions: {
          rejectUnauthorized: false
        }
      }
    });
    
    const boxes = await connection.getBoxes();
    connection.end();
    return true;
  } catch (error) {
    console.error('[EmailListener] Test di connessione IMAP fallito:', error);
    return false;
  }
}