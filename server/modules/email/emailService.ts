import { eq, and } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { db } from '../../db';
import { emails, emailAccounts, emailAttachments } from '../../../shared/schema';
import { generateId } from '../../utils';

interface SendEmailParams {
  from?: string; // Se non specificato, usa l'account predefinito
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  entityId?: string;
  entityType?: 'contact' | 'company' | 'deal' | 'lead';
}

interface EmailAccount {
  id: number;
  userId: number;
  email: string;
  name: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword: string;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Servizio per gestire l'invio e la ricezione di email
 */
export class EmailService {
  
  /**
   * Ottiene gli account email dell'utente corrente
   */
  static async getEmailAccounts(userId: number): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId));
  }

  /**
   * Ottiene l'account email predefinito dell'utente
   */
  static async getDefaultEmailAccount(userId: number): Promise<EmailAccount | undefined> {
    const accounts = await db.select().from(emailAccounts)
      .where(and(
        eq(emailAccounts.userId, userId),
        eq(emailAccounts.isDefault, true)
      ));
    
    return accounts[0];
  }

  /**
   * Invia un'email
   */
  static async sendEmail(params: SendEmailParams, userId: number): Promise<string> {
    const { from, to, subject, body, isHtml = false, attachments = [], entityId, entityType } = params;
    
    // Ottieni l'account email da usare per l'invio
    let account: EmailAccount | undefined;
    if (from) {
      const accounts = await db.select().from(emailAccounts)
        .where(and(
          eq(emailAccounts.userId, userId),
          eq(emailAccounts.email, from)
        ));
      account = accounts[0];
    } else {
      account = await this.getDefaultEmailAccount(userId);
    }

    if (!account) {
      throw new Error('Nessun account email disponibile per l\'invio');
    }

    // Configura il trasportatore SMTP
    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpPort === 465,
      auth: {
        user: account.smtpUser,
        pass: account.smtpPassword
      }
    });

    // Prepara l'email
    const mailOptions = {
      from: `"${account.name}" <${account.email}>`,
      to,
      subject,
      [isHtml ? 'html' : 'text']: body,
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    };

    // Invia l'email
    try {
      const info = await transporter.sendMail(mailOptions);
      
      // Salva l'email nel database
      const emailId = generateId();
      
      // Gestione allegati
      const savedAttachmentIds: string[] = [];
      
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const attachmentId = generateId();
          
          await db.insert(emailAttachments).values({
            id: attachmentId,
            emailId,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.content.length,
            content: Buffer.from(attachment.content).toString('base64')
          });
          
          savedAttachmentIds.push(attachmentId);
        }
      }
      
      // Salva l'email
      await db.insert(emails).values({
        id: emailId,
        userId,
        accountId: account.id,
        messageId: info.messageId,
        fromEmail: account.email,
        fromName: account.name,
        toEmail: to,
        toName: to.split('@')[0], // Semplice estrazione del nome dall'email
        subject,
        body,
        bodyType: isHtml ? 'html' : 'text',
        sentAt: new Date(),
        isRead: true, // L'email inviata è sempre già letta dall'utente
        direction: 'outbound',
        entityId: entityId || null,
        entityType: entityType || null
      });
      
      return emailId;
    } catch (error) {
      console.error('Errore nell\'invio dell\'email:', error);
      throw new Error(`Errore nell'invio dell'email: ${(error as Error).message}`);
    }
  }

  /**
   * Ottiene le email associate a un'entità
   */
  static async getEntityEmails(entityId: string, entityType: string): Promise<any[]> {
    return await db.select().from(emails)
      .where(and(
        eq(emails.entityId, entityId),
        eq(emails.entityType, entityType)
      ))
      .orderBy(emails.receivedAt, 'desc');
  }
  
  /**
   * Contrassegna un'email come letta
   */
  static async markEmailAsRead(emailId: string, userId: number): Promise<void> {
    await db.update(emails)
      .set({ isRead: true })
      .where(and(
        eq(emails.id, emailId),
        eq(emails.userId, userId)
      ));
  }
  
  /**
   * Ottiene il conteggio delle email non lette per utente
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const result = await db.select({ count: db.fn.count() })
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        eq(emails.isRead, false),
        eq(emails.direction, 'inbound')
      ));
    
    return Number(result[0].count);
  }
  
  /**
   * Elimina un'email
   */
  static async deleteEmail(emailId: string, userId: number): Promise<void> {
    await db.update(emails)
      .set({ deleted: true })
      .where(and(
        eq(emails.id, emailId),
        eq(emails.userId, userId)
      ));
  }
  
  /**
   * Risponde a un'email
   */
  static async replyToEmail(emailId: string, content: string, userId: number): Promise<string> {
    // Ottiene l'email originale
    const originalEmails = await db.select().from(emails)
      .where(and(
        eq(emails.id, emailId),
        eq(emails.userId, userId)
      ));
    
    if (originalEmails.length === 0) {
      throw new Error('Email non trovata');
    }
    
    const originalEmail = originalEmails[0];
    
    // Prepara il soggetto della risposta (aggiunge Re: se non è già presente)
    let subject = originalEmail.subject;
    if (!subject.toLowerCase().startsWith('re:')) {
      subject = `Re: ${subject}`;
    }
    
    // Formatta il corpo della risposta
    const replyBody = `${content}\n\n-------- Messaggio originale --------\nDa: ${originalEmail.fromName} <${originalEmail.fromEmail}>\nData: ${originalEmail.receivedAt}\nOggetto: ${originalEmail.subject}\n\n${originalEmail.body}`;
    
    // Invia la risposta
    return await this.sendEmail({
      to: originalEmail.fromEmail,
      subject,
      body: replyBody,
      isHtml: false,
      entityId: originalEmail.entityId,
      entityType: originalEmail.entityType
    }, userId);
  }
}