/**
 * Modulo per la ricezione delle email
 * Implementa le funzionalità per connettersi all'account email e scaricare le email
 */

import * as ImapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { db } from '../../db';
import { emails } from '../../../shared/email/schema';
import { EmailAccount, EmailAccountDb, ImapConfig } from './types';
import { sql } from 'drizzle-orm';

/**
 * Ottiene la configurazione IMAP per un account email
 */
export async function getImapConfigForAccount(accountId: number): Promise<ImapConfig | null> {
  try {
    // Recuperiamo i dettagli dell'account dal database
    const accounts = await db.execute<EmailAccountDb>(
      sql`SELECT * FROM email_accounts WHERE id = ${accountId} AND is_active = true`
    );
    
    if (accounts.length === 0) {
      console.error(`[EmailReceiver] Account ID ${accountId} non trovato o non attivo`);
      return null;
    }
    
    const account = accounts[0];
    
    // Costruisci la configurazione IMAP
    return {
      user: account.username || account.email,
      password: account.password || '',
      host: account.imap_host || '',
      port: account.imap_port || 993,
      tls: account.imap_secure !== false,
      authTimeout: 30000,
      tlsOptions: {
        rejectUnauthorized: false
      }
    };
  } catch (error) {
    console.error('[EmailReceiver] Errore nel recupero della configurazione IMAP:', error);
    return null;
  }
}

/**
 * Recupera le email non lette dalla cartella specificata
 */
export async function fetchUnreadEmails(accountId: number, folder: string = 'INBOX'): Promise<any[]> {
  const config = await getImapConfigForAccount(accountId);
  if (!config) {
    return [];
  }
  
  try {
    // Connessione al server IMAP
    const connection = await ImapSimple.connect({ imap: config });
    
    // Apri la cartella
    await connection.openBox(folder);
    
    // Cerca le email non lette
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[EmailReceiver] Trovate ${messages.length} email non lette in ${folder}`);
    
    // Elabora ogni messaggio
    const processedEmails = [];
    for (const message of messages) {
      const all = message.parts.find(part => part.which === '');
      if (all) {
        const email = await simpleParser(all.body);
        
        // Estrai i dati principali
        const emailData = {
          uid: message.attributes.uid,
          messageId: email.messageId,
          from: email.from?.text || '',
          to: email.to?.text || '',
          cc: email.cc?.text || '',
          bcc: email.bcc?.text || '',
          subject: email.subject || '',
          date: email.date,
          text: email.text,
          html: email.html,
          hasAttachments: email.attachments && email.attachments.length > 0
        };
        
        processedEmails.push(emailData);
      }
    }
    
    // Chiudi la connessione
    connection.end();
    
    return processedEmails;
  } catch (error) {
    console.error('[EmailReceiver] Errore durante il recupero delle email:', error);
    return [];
  }
}

/**
 * Recupera tutte le email da una cartella specifica
 */
export async function fetchAllEmails(accountId: number, folder: string = 'INBOX', limit: number = 50): Promise<any[]> {
  const config = await getImapConfigForAccount(accountId);
  if (!config) {
    return [];
  }
  
  try {
    // Connessione al server IMAP
    const connection = await ImapSimple.connect({ imap: config });
    
    // Apri la cartella
    await connection.openBox(folder);
    
    // Cerca tutte le email, limitate alla quantità specificata
    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false
    };
    
    // Ottieni tutte le email, ma limita il risultato
    let messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[EmailReceiver] Trovate ${messages.length} email in ${folder}`);
    
    // Ordina i messaggi per data (più recenti prima)
    messages.sort((a, b) => {
      return b.attributes.date.getTime() - a.attributes.date.getTime();
    });
    
    // Limita i risultati
    messages = messages.slice(0, limit);
    
    // Elabora ogni messaggio
    const processedEmails = [];
    for (const message of messages) {
      const all = message.parts.find(part => part.which === '');
      if (all) {
        const email = await simpleParser(all.body);
        
        // Estrai i dati principali
        const emailData = {
          uid: message.attributes.uid,
          messageId: email.messageId,
          from: email.from?.text || '',
          to: email.to?.text || '',
          cc: email.cc?.text || '',
          bcc: email.bcc?.text || '',
          subject: email.subject || '',
          date: email.date,
          text: email.text,
          html: email.html,
          hasAttachments: email.attachments && email.attachments.length > 0,
          attachments: email.attachments
        };
        
        processedEmails.push(emailData);
      }
    }
    
    // Chiudi la connessione
    connection.end();
    
    return processedEmails;
  } catch (error) {
    console.error('[EmailReceiver] Errore durante il recupero delle email:', error);
    return [];
  }
}

/**
 * Salva un'email nel database
 */
export async function saveEmailToDatabase(accountId: number, emailData: any): Promise<number | null> {
  try {
    // Prepara i destinatari come array JSON
    const toRecipients = emailData.to ? 
      emailData.to.split(',').map(addr => addr.trim()) : 
      [];
    
    const ccRecipients = emailData.cc ? 
      emailData.cc.split(',').map(addr => addr.trim()) : 
      [];
    
    const bccRecipients = emailData.bcc ? 
      emailData.bcc.split(',').map(addr => addr.trim()) : 
      [];
    
    // Inserisci l'email nel database
    const result = await db.insert(emails).values({
      accountId: accountId,
      messageId: emailData.messageId,
      subject: emailData.subject,
      body: emailData.html || emailData.text,
      bodyType: emailData.html ? 'text/html' : 'text/plain',
      from: emailData.from,
      to: toRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      receivedDate: emailData.date,
      isRead: false,
      hasAttachments: emailData.hasAttachments
    }).returning({ id: emails.id });
    
    return result[0]?.id || null;
  } catch (error) {
    console.error('[EmailReceiver] Errore durante il salvataggio dell\'email:', error);
    return null;
  }
}