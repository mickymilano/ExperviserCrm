import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { db } from '../../db';
import { emails, emailAccounts } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '../../utils';

/**
 * Gestisce la ricezione delle email tramite IMAP
 */
export class EmailReceiver {
  private imap: Imap;
  private accountId: number;
  private userId: number;
  private listening: boolean = false;

  constructor(imapConfig: Imap.Config, accountId: number, userId: number) {
    this.imap = new Imap(imapConfig);
    this.accountId = accountId;
    this.userId = userId;
  }

  /**
   * Avvia il monitoraggio delle email
   */
  public startListening(): void {
    if (this.listening) return;
    
    this.listening = true;
    
    // Connessione al server IMAP
    this.imap.connect();
    
    // Evento di connessione
    this.imap.once('ready', () => {
      this.openInbox((err: Error | null, box: Imap.Box) => {
        if (err) {
          console.error('Errore nell\'apertura della inbox:', err);
          return;
        }
        
        // Avvia il monitoraggio di nuove email
        this.imap.on('mail', (numNewMsgs: number) => {
          console.log(`Ricevute ${numNewMsgs} nuove email`);
          this.fetchNewEmails();
        });
      });
    });
    
    // Gestione degli errori
    this.imap.on('error', (err: Error) => {
      console.error('Errore IMAP:', err);
    });
    
    // Gestione della disconnessione
    this.imap.on('end', () => {
      console.log('Connessione IMAP terminata');
      this.listening = false;
    });
  }

  /**
   * Interrompe il monitoraggio delle email
   */
  public stopListening(): void {
    if (!this.listening) return;
    
    this.imap.end();
    this.listening = false;
  }

  /**
   * Apre la inbox dell'utente
   */
  private openInbox(cb: (err: Error | null, box: Imap.Box) => void): void {
    this.imap.openBox('INBOX', false, cb);
  }

  /**
   * Recupera le nuove email
   */
  private fetchNewEmails(): void {
    this.openInbox((err: Error | null, box: Imap.Box) => {
      if (err) {
        console.error('Errore nell\'apertura della inbox per il recupero delle nuove email:', err);
        return;
      }
      
      // Recupera tutte le email non lette
      const f = this.imap.seq.fetch('1:*', {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
        struct: true
      });
      
      f.on('message', (msg: any, seqno: number) => {
        const messageData: any = {
          seqno,
          headers: null,
          body: '',
          attributes: null
        };
        
        msg.on('body', (stream: any, info: any) => {
          let buffer = '';
          
          stream.on('data', (chunk: Buffer) => {
            buffer += chunk.toString('utf8');
          });
          
          stream.on('end', () => {
            if (info.which.includes('HEADER')) {
              messageData.headers = Imap.parseHeader(buffer);
            } else {
              messageData.body = buffer;
            }
          });
        });
        
        msg.once('attributes', (attrs: any) => {
          messageData.attributes = attrs;
        });
        
        msg.once('end', () => {
          // Processa i dati dell'email
          this.processEmail(messageData);
        });
      });
      
      f.once('error', (err: Error) => {
        console.error('Errore nel recupero delle email:', err);
      });
      
      f.once('end', () => {
        console.log('Recupero delle email completato');
      });
    });
  }

  /**
   * Processa un'email recuperata
   */
  private async processEmail(messageData: any): Promise<void> {
    try {
      // Verifica se l'email è già stata processata
      const messageId = messageData.headers['message-id']?.[0];
      if (messageId) {
        const existingEmails = await db.select({ id: emails.id })
          .from(emails)
          .where(eq(emails.messageId, messageId));
          
        if (existingEmails.length > 0) {
          // L'email è già presente nel database, salta
          return;
        }
      }
      
      // Parsing dell'email con mailparser
      const parsedEmail = await simpleParser(
        `${Object.entries(messageData.headers).map(([key, value]) => `${key}: ${value}`).join('\n')}\n\n${messageData.body}`
      );
      
      // Estrai i dati necessari
      const fromEmail = parsedEmail.from?.value?.[0]?.address || '';
      const fromName = parsedEmail.from?.value?.[0]?.name || '';
      const toEmail = parsedEmail.to?.value?.[0]?.address || '';
      const toName = parsedEmail.to?.value?.[0]?.name || '';
      const subject = parsedEmail.subject || '(Nessun oggetto)';
      const bodyText = parsedEmail.text || '';
      const bodyHtml = parsedEmail.html || '';
      const receivedDate = parsedEmail.date || new Date();
      const attachments = parsedEmail.attachments || [];
      
      // Cerca di associare l'email a un'entità
      // Ad esempio, cerca un contatto con l'indirizzo email del mittente o del destinatario
      const entityInfo = await this.findEntityByEmail(fromEmail, toEmail);
      
      // Genera un ID per l'email
      const emailId = generateId();
      
      // Salva gli allegati
      const savedAttachmentIds: string[] = [];
      
      for (const attachment of attachments) {
        const attachmentId = generateId();
        
        await db.insert(emailAttachments).values({
          id: attachmentId,
          emailId,
          filename: attachment.filename || 'attachment',
          contentType: attachment.contentType || 'application/octet-stream',
          size: attachment.size || 0,
          content: attachment.content.toString('base64')
        });
        
        savedAttachmentIds.push(attachmentId);
      }
      
      // Salva l'email nel database
      await db.insert(emails).values({
        id: emailId,
        userId: this.userId,
        accountId: this.accountId,
        messageId: messageId || null,
        fromEmail,
        fromName,
        toEmail,
        toName,
        subject,
        body: bodyHtml || bodyText,
        bodyType: bodyHtml ? 'html' : 'text',
        receivedAt: receivedDate,
        isRead: false,
        direction: 'inbound',
        entityId: entityInfo?.entityId || null,
        entityType: entityInfo?.entityType || null
      });
      
      console.log(`Email salvata con ID: ${emailId}`);
    } catch (error) {
      console.error('Errore nel processamento dell\'email:', error);
    }
  }

  /**
   * Cerca un'entità (contatto, azienda, ecc.) in base all'indirizzo email
   */
  private async findEntityByEmail(fromEmail: string, toEmail: string): Promise<{ entityId: string, entityType: 'contact' | 'company' | 'deal' | 'lead' } | null> {
    // Cerca se l'email appartiene a un contatto
    try {
      // Cerca prima nei contatti
      const contactsQuery = `
        SELECT id FROM contacts 
        WHERE email = $1 OR secondary_email = $1
        LIMIT 1
      `;
      
      const contactResult = await db.execute(contactsQuery, [fromEmail]);
      
      if (contactResult.rows.length > 0) {
        return {
          entityId: contactResult.rows[0].id,
          entityType: 'contact'
        };
      }
      
      // Cerca nelle aziende
      const companiesQuery = `
        SELECT id FROM companies 
        WHERE email = $1
        LIMIT 1
      `;
      
      const companyResult = await db.execute(companiesQuery, [fromEmail]);
      
      if (companyResult.rows.length > 0) {
        return {
          entityId: companyResult.rows[0].id,
          entityType: 'company'
        };
      }
      
      // Se non trova corrispondenze, restituisce null
      return null;
    } catch (error) {
      console.error('Errore nella ricerca dell\'entità per email:', error);
      return null;
    }
  }

  /**
   * Avvia tutti i ricevitori di email per gli account attivi dell'utente
   */
  public static async startAllReceivers(userId: number): Promise<EmailReceiver[]> {
    const receivers: EmailReceiver[] = [];
    
    try {
      // Ottieni tutti gli account email attivi dell'utente
      const accounts = await db.select().from(emailAccounts)
        .where(and(
          eq(emailAccounts.userId, userId),
          eq(emailAccounts.isActive, true)
        ));
      
      for (const account of accounts) {
        // Configura IMAP per questo account
        const imapConfig: Imap.Config = {
          user: account.imapUser,
          password: account.imapPassword,
          host: account.imapHost,
          port: account.imapPort,
          tls: account.imapPort === 993, // TLS per la porta standard IMAPS
          tlsOptions: { rejectUnauthorized: false } // Non verificare i certificati in dev/test
        };
        
        // Crea un nuovo ricevitore
        const receiver = new EmailReceiver(imapConfig, account.id, userId);
        
        // Avvia l'ascolto
        receiver.startListening();
        
        // Aggiungi alla lista dei ricevitori
        receivers.push(receiver);
        
        console.log(`Avviato ricevitore email per l'account ${account.email}`);
      }
    } catch (error) {
      console.error('Errore nell\'avvio dei ricevitori email:', error);
    }
    
    return receivers;
  }
}