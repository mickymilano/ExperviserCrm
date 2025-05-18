import * as ImapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { db } from '../../db';
import { emails } from '../../../shared/email/schema';
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

/**
 * Classe per la gestione della ricezione email
 */
export class EmailReceiver {
  private config: ImapConfig;
  private accountId: number;

  constructor(config: ImapConfig, accountId: number) {
    this.config = config;
    this.accountId = accountId;
  }

  /**
   * Connessione al server IMAP
   */
  private async connectToImap() {
    try {
      const connection = await ImapSimple.connect({
        imap: this.config
      });
      return connection;
    } catch (error) {
      console.error('Errore di connessione IMAP:', error);
      throw new Error(`Impossibile connettersi al server IMAP: ${error}`);
    }
  }

  /**
   * Recupero delle email non lette
   */
  public async fetchUnreadEmails() {
    let connection;
    try {
      connection = await this.connectToImap();
      
      // Apri la cartella INBOX
      await connection.openBox('INBOX');
      
      // Cerca le email non lette
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false
      };
      
      const messages = await connection.search(searchCriteria, fetchOptions);
      console.log(`Trovate ${messages.length} email non lette`);
      
      for (const message of messages) {
        await this.processEmail(message);
      }
      
      return messages.length;
    } catch (error) {
      console.error('Errore durante il recupero delle email:', error);
      throw error;
    } finally {
      if (connection) {
        connection.end();
      }
    }
  }

  /**
   * Elaborazione di una singola email
   */
  private async processEmail(message: ImapSimple.Message) {
    try {
      // Ottieni l'intero messaggio
      const all = message.parts.find(part => part.which === '');
      if (!all) {
        console.error('Impossibile trovare il corpo del messaggio');
        return;
      }
      
      // Analisi dell'email
      const parsed = await simpleParser(all.body);
      
      // Estrai gli header principali
      const from = parsed.from?.value[0];
      const messageId = parsed.messageId;
      
      if (!from || !from.address || !messageId) {
        console.error('Email mancante di informazioni essenziali');
        return;
      }
      
      // Verifica se l'email è già stata processata (duplicato)
      const existingEmail = await db.select().from(emails)
        .where(eq(emails.messageId, messageId))
        .limit(1);
      
      if (existingEmail.length > 0) {
        console.log(`Email con Message-ID ${messageId} già presente nel database`);
        return;
      }
      
      // Estrai i dati dalla firma
      const signatureData = extractSignatureData(parsed.text || '', parsed.html || '');
      
      // Prepara i dati per l'inserimento dell'email
      const emailData = {
        accountId: this.accountId,
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
      
      // Elabora il mittente per identificare/creare un contatto
      const contactId = await processContactFromEmail(from, signatureData);
      if (contactId) {
        await db.update(emails)
          .set({ contactId })
          .where(eq(emails.id, savedEmail.id));
      }
      
      console.log(`Email salvata con ID ${savedEmail.id}`);
      
      // Marca l'email come letta sul server
      await connection.addFlags(message.attributes.uid, ['\\Seen']);
      
      return savedEmail.id;
    } catch (error) {
      console.error('Errore nell\'elaborazione dell\'email:', error);
      return null;
    }
  }
}

// Implementazione della connessione
let connection: any = null;

export async function setupImapConnection(config: ImapConfig, accountId: number) {
  const receiver = new EmailReceiver(config, accountId);
  return receiver;
}

// Funzione di utilità per la connessione di test
export async function testImapConnection(config: ImapConfig): Promise<boolean> {
  try {
    const connection = await ImapSimple.connect({
      imap: config
    });
    
    const boxes = await connection.getBoxes();
    connection.end();
    return true;
  } catch (error) {
    console.error('Test di connessione IMAP fallito:', error);
    return false;
  }
}