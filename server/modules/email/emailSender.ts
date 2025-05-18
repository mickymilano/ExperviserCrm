import * as nodemailer from 'nodemailer';
import { db } from '../../db';
import { emails, emailAccounts } from '../../../shared/email/schema';
import { eq } from 'drizzle-orm';

// Interfaccia per la configurazione SMTP
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

// Interfaccia per il messaggio email
export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Classe per la gestione dell'invio email
 */
export class EmailSender {
  private transporter: nodemailer.Transporter;
  private accountId: number;
  private fromAddress: string;

  constructor(config: SmtpConfig, accountId: number, fromAddress: string) {
    this.transporter = nodemailer.createTransport(config);
    this.accountId = accountId;
    this.fromAddress = fromAddress;
  }

  /**
   * Invia un'email
   */
  public async sendEmail(message: EmailMessage, options: { 
    dealId?: number;
    contactId?: number; 
    companyId?: number;
  } = {}): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      // Aggiunge l'indirizzo mittente se non specificato
      const emailMsg = {
        from: this.fromAddress,
        ...message
      };
      
      // Invia l'email tramite nodemailer
      const info = await this.transporter.sendMail(emailMsg);
      
      // Normalizza i destinatari per il salvataggio nel database
      const to = Array.isArray(message.to) ? message.to : [message.to];
      const cc = message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : [];
      const bcc = message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : [];
      
      // Converte i destinatari in formato JSON per il database
      const toJson = to.map(address => {
        const matches = address.match(/^(?:"?([^"]*)"?\s*)?<?([^>]*)>?$/);
        if (matches) {
          return { name: matches[1] || '', address: matches[2] };
        }
        return { name: '', address };
      });
      
      // Prepara i dati per il salvataggio dell'email
      const emailData = {
        accountId: this.accountId,
        messageId: info.messageId,
        conversationId: '', // Da gestire per le risposte/inoltri
        from: JSON.stringify({ name: '', address: this.fromAddress }),
        to: JSON.stringify(toJson),
        cc: JSON.stringify(cc.map(a => ({ name: '', address: a }))),
        bcc: JSON.stringify(bcc.map(a => ({ name: '', address: a }))),
        subject: message.subject,
        textBody: message.text || '',
        htmlBody: message.html || '',
        sentDate: new Date(),
        hasAttachments: !!message.attachments?.length,
        attachments: message.attachments ? JSON.stringify(message.attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType || 'application/octet-stream'
        }))) : '[]',
        direction: 'outbound',
        status: 'sent',
        dealId: options.dealId || null,
        contactId: options.contactId || null,
        companyId: options.companyId || null
      };
      
      // Salva l'email nel database
      const [savedEmail] = await db.insert(emails).values(emailData).returning();
      
      console.log(`Email inviata e salvata con ID ${savedEmail.id}`);
      
      return {
        success: true,
        id: savedEmail.id
      };
    } catch (error) {
      console.error('Errore durante l\'invio dell\'email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }
  
  /**
   * Verifica la configurazione SMTP 
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Errore di verifica SMTP:', error);
      return false;
    }
  }
}

/**
 * Crea un'istanza EmailSender da un account configurato nel database
 */
export async function createSenderFromAccount(accountId: number): Promise<EmailSender | null> {
  try {
    // Recupera i dati dell'account dal database
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId))
      .limit(1);
    
    if (!account) {
      console.error(`Account email con ID ${accountId} non trovato`);
      return null;
    }
    
    if (!account.isActive) {
      console.error(`Account email con ID ${accountId} non è attivo`);
      return null;
    }
    
    // Configura il trasporto SMTP
    const config: SmtpConfig = {
      host: account.smtpHost || '',
      port: account.smtpPort || 587,
      secure: account.smtpSecure || false,
      auth: {
        user: account.username || '',
        pass: account.password || ''
      }
    };
    
    return new EmailSender(config, accountId, account.email);
  } catch (error) {
    console.error('Errore durante la creazione dell\'EmailSender:', error);
    return null;
  }
}

/**
 * Funzione di utilità per test SMTP
 */
export async function testSmtpConnection(config: SmtpConfig): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport(config);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Test di connessione SMTP fallito:', error);
    return false;
  }
}