import { Request, Response } from 'express';
import { db } from '../db';
import { 
  emails, 
  emailAccounts, 
  insertEmailAccountSchema,
  emailAssociations
} from '../../shared/email/schema';
import { eq, and, desc, like, sql } from 'drizzle-orm';
import { EmailReceiver, ImapConfig, testImapConnection } from '../modules/email/emailReceiver';
import { EmailSender, SmtpConfig, testSmtpConnection } from '../modules/email/emailSender';
import { 
  emailSyncQueue, 
  emailProcessQueue, 
  syncAccountNow, 
  scheduleSyncJob 
} from '../modules/email/emailQueue';
import { ZodError, z } from 'zod';

export const emailController = {
  /**
   * Recupera tutti gli account email
   */
  getEmailAccounts: async (req: Request, res: Response) => {
    try {
      const allAccounts = await db
        .select({
          id: emailAccounts.id,
          name: emailAccounts.displayName, // Usa display_name invece di name
          email: emailAccounts.email,
          isActive: emailAccounts.isActive
          // Rimuovi campi che non esistono nel database
        })
        .from(emailAccounts)
        .orderBy(emailAccounts.displayName);
        
      // Aggiungiamo valori predefiniti per i campi mancanti nel database
      const accountsWithDefaults = allAccounts.map(account => ({
        ...account,
        provider: 'imap', // Valore predefinito
        lastSyncedAt: null, // Valore predefinito
        syncFrequency: 5, // Valore predefinito in minuti
      }));
        
      res.json(accountsWithDefaults);
    } catch (error) {
      console.error('Errore durante il recupero degli account email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Recupera un account email per ID
   */
  getEmailAccountById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [account] = await db
        .select({
          id: emailAccounts.id,
          name: emailAccounts.displayName, // Usiamo display_name ma mappiamo a name per il frontend
          email: emailAccounts.email,
          imapHost: emailAccounts.imapHost,
          imapPort: emailAccounts.imapPort,
          imapSecure: emailAccounts.imapSecure,
          smtpHost: emailAccounts.smtpHost,
          smtpPort: emailAccounts.smtpPort,
          smtpSecure: emailAccounts.smtpSecure,
          username: emailAccounts.username,
          isActive: emailAccounts.isActive
        })
        .from(emailAccounts)
        .where(eq(emailAccounts.id, parseInt(id)))
        .limit(1);
        
      if (!account) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Aggiunge campi mancanti per compatibilità con il frontend
      const accountWithDefaults = {
        ...account,
        provider: 'imap', // Valore predefinito
        lastSyncedAt: null, // Valore predefinito
        syncFrequency: 5 // Valore predefinito in minuti
      };
      
      res.json(accountWithDefaults);
    } catch (error) {
      console.error('Errore durante il recupero dell\'account email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Crea un nuovo account email
   */
  createEmailAccount: async (req: Request, res: Response) => {
    try {
      // Validate input with the updated schema
      const validatedData = insertEmailAccountSchema.parse({
        ...req.body,
        userId: 1, // TODO: recuperare l'utente autenticato
      });
      
      // Prepara i dati per il database
      const dbData = {
        userId: 1, // Utilizzare l'ID dell'utente autenticato
        displayName: validatedData.name,
        email: validatedData.email,
        imapHost: validatedData.imapHost,
        imapPort: validatedData.imapPort,
        imapSecure: validatedData.imapSecure !== undefined ? validatedData.imapSecure : 
                   (validatedData.imapSecurity === 'ssl'),
        smtpHost: validatedData.smtpHost,
        smtpPort: validatedData.smtpPort,
        smtpSecure: validatedData.smtpSecure !== undefined ? validatedData.smtpSecure : 
                   (validatedData.smtpSecurity === 'ssl'),
        username: validatedData.username,
        password: validatedData.password,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
        isPrimary: false, 
        status: 'active'
      };
      
      console.log('Dati account email preparati per il database:', dbData);
      
      // Inserisci nel database
      const [newAccount] = await db
        .insert(emailAccounts)
        .values(dbData)
        .returning();
        
      // Adatta i nomi dei campi per il frontend (aggiungi campi virtuali per retrocompatibilità)
      const accountWithVirtualFields = {
        ...newAccount,
        name: newAccount.displayName,
        provider: 'imap', // Valore predefinito per il frontend
        imapSecurity: newAccount.imapSecure ? 'ssl' : 'none',
        smtpSecurity: newAccount.smtpSecure ? 'ssl' : 'none',
        lastSyncedAt: newAccount.lastSyncTime || null, // Mappa lastSyncTime a lastSyncedAt
        syncFrequency: 5 // Valore predefinito per il frontend
      };
        
      // Pianifica la sincronizzazione
      if (newAccount.isActive) {
        await scheduleSyncJob(newAccount.id, 5); // Usa un valore fisso di 5 minuti
      }
      
      res.status(201).json(accountWithVirtualFields);
    } catch (error) {
      console.error('Errore durante la creazione dell\'account email:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Dati non validi',
          details: error.errors
        });
      }
      
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Aggiorna un account email
   */
  updateEmailAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const accountId = parseInt(id);
      
      // Verifica che l'account esista
      const [existingAccount] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, accountId))
        .limit(1);
        
      if (!existingAccount) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Valida i dati aggiornati
      const updateSchema = insertEmailAccountSchema.partial();
      const accountData = updateSchema.parse(req.body);
      
      // Adatta i nomi dei campi per il database
      const dbData = { ...accountData };
      
      // Se è presente il campo name, usalo per displayName
      if (dbData.name) {
        dbData.displayName = dbData.name;
        // @ts-ignore
        delete dbData.name;
      }
      
      // Rimuovi campi che non esistono nel database
      // @ts-ignore - rimuoviamo provider che non esiste nel database
      delete dbData.provider;
      // @ts-ignore - rimuoviamo syncFrequency che non esiste nel database
      delete dbData.syncFrequency;
      // @ts-ignore - rimuoviamo lastSyncedAt che non esiste nel database
      delete dbData.lastSyncedAt;
      // @ts-ignore - rimuoviamo updatedAt che potrebbe non esistere
      delete dbData.updatedAt;
      
      // Aggiorna il database
      const [updatedAccount] = await db
        .update(emailAccounts)
        .set(dbData)
        .where(eq(emailAccounts.id, accountId))
        .returning();
        
      // Aggiorna la pianificazione della sincronizzazione se necessario
      if (updatedAccount.isActive !== existingAccount.isActive) {
        if (updatedAccount.isActive) {
          await scheduleSyncJob(accountId, 5); // Usa valore fisso di 5 minuti
        } else {
          // Disabilita la sincronizzazione se l'account non è più attivo
          const jobs = await emailSyncQueue.getRepeatableJobs();
          for (const job of jobs) {
            if (job.name === `sync-account-${accountId}`) {
              await emailSyncQueue.removeRepeatableByKey(job.key);
              break;
            }
          }
        }
      }
      
      // Adatta i nomi dei campi per il frontend e aggiungi valori predefiniti
      const accountWithDefaults = {
        ...updatedAccount,
        name: updatedAccount.displayName,
        provider: 'imap', // Valore predefinito per il frontend
        syncFrequency: 5, // Valore predefinito per il frontend
        lastSyncedAt: null // Valore predefinito per il frontend
      };
      
      res.json(accountWithDefaults);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'account email:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Dati non validi',
          details: error.errors
        });
      }
      
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Elimina un account email
   */
  deleteEmailAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const accountId = parseInt(id);
      
      // Verifica che l'account esista
      const [existingAccount] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, accountId))
        .limit(1);
        
      if (!existingAccount) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Elimina l'account
      await db
        .delete(emailAccounts)
        .where(eq(emailAccounts.id, accountId));
        
      // Disabilita la sincronizzazione
      const jobs = await emailSyncQueue.getRepeatableJobs();
      for (const job of jobs) {
        if (job.name === `sync-account-${accountId}`) {
          await emailSyncQueue.removeRepeatableByKey(job.key);
          break;
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'account email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Testa la connessione a un account email
   */
  testEmailConnection: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const accountId = parseInt(id);
      
      // Verifica che l'account esista
      const [account] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, accountId))
        .limit(1);
        
      if (!account) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Testa la connessione IMAP
      const imapConfig: ImapConfig = {
        user: account.username || '',
        password: account.password || '',
        host: account.imapHost || '',
        port: account.imapPort || 993,
        tls: account.imapSecure || true,
        authTimeout: 10000,
        tlsOptions: {
          rejectUnauthorized: false
        }
      };
      
      const imapSuccess = await testImapConnection(imapConfig);
      
      // Testa la connessione SMTP
      const smtpConfig: SmtpConfig = {
        host: account.smtpHost || '',
        port: account.smtpPort || 587,
        secure: account.smtpSecure || false,
        auth: {
          user: account.username || '',
          pass: account.password || ''
        }
      };
      
      const smtpSuccess = await testSmtpConnection(smtpConfig);
      
      res.json({
        imap: imapSuccess,
        smtp: smtpSuccess,
        success: imapSuccess && smtpSuccess
      });
    } catch (error) {
      console.error('Errore durante il test di connessione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Avvia manualmente la sincronizzazione di un account
   */
  syncEmailAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const accountId = parseInt(id);
      
      // Verifica che l'account esista
      const [account] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, accountId))
        .limit(1);
        
      if (!account) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Avvia la sincronizzazione
      const jobId = await syncAccountNow(accountId);
      
      res.json({
        success: true,
        jobId,
        message: 'Sincronizzazione avviata'
      });
    } catch (error) {
      console.error('Errore durante l\'avvio della sincronizzazione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Recupera le email per un account specifico
   */
  getEmailsByAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const accountId = parseInt(id);
      
      // Parametri di paginazione
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Filtri opzionali
      const filters: any[] = [eq(emails.accountId, accountId)];
      
      if (req.query.isRead === 'true') {
        filters.push(eq(emails.isRead, true));
      } else if (req.query.isRead === 'false') {
        filters.push(eq(emails.isRead, false));
      }
      
      if (req.query.direction) {
        filters.push(eq(emails.direction, req.query.direction as string));
      }
      
      if (req.query.search) {
        const searchTerm = `%${req.query.search}%`;
        filters.push(
          sql`(${emails.subject} LIKE ${searchTerm} OR ${emails.textBody} LIKE ${searchTerm})`
        );
      }
      
      // Recupera le email
      const emailsList = await db
        .select({
          id: emails.id,
          messageId: emails.messageId,
          from: emails.from,
          to: emails.to,
          subject: emails.subject,
          receivedDate: emails.receivedDate,
          sentDate: emails.sentDate,
          isRead: emails.isRead,
          hasAttachments: emails.hasAttachments,
          direction: emails.direction,
          status: emails.status,
          dealId: emails.dealId,
          contactId: emails.contactId,
          companyId: emails.companyId
        })
        .from(emails)
        .where(and(...filters))
        .orderBy(desc(emails.receivedDate))
        .limit(limit)
        .offset(offset);
        
      // Conta il totale delle email che soddisfano i filtri (per la paginazione)
      const [{ count }] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(emails)
        .where(and(...filters));
        
      res.json({
        data: emailsList,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Errore durante il recupero delle email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Recupera i dettagli di una email specifica
   */
  getEmailById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const emailId = parseInt(id);
      
      // Recupera l'email
      const [emailData] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, emailId))
        .limit(1);
        
      if (!emailData) {
        return res.status(404).json({ error: 'Email non trovata' });
      }
      
      // Segna l'email come letta se non lo è già
      if (!emailData.isRead) {
        await db
          .update(emails)
          .set({ isRead: true })
          .where(eq(emails.id, emailId));
      }
      
      // Recupera le associazioni
      const associations = await db
        .select()
        .from(emailAssociations)
        .where(eq(emailAssociations.emailId, emailId));
        
      res.json({
        ...emailData,
        associations
      });
    } catch (error) {
      console.error('Errore durante il recupero dei dettagli dell\'email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Invia una nuova email
   */
  sendEmail: async (req: Request, res: Response) => {
    try {
      const { accountId, to, cc, bcc, subject, text, html, dealId, contactId, companyId } = req.body;
      
      // Valida i dati
      const schema = z.object({
        accountId: z.number(),
        to: z.union([z.string(), z.array(z.string())]),
        cc: z.union([z.string(), z.array(z.string()), z.undefined()]),
        bcc: z.union([z.string(), z.array(z.string()), z.undefined()]),
        subject: z.string(),
        text: z.string().optional(),
        html: z.string().optional(),
        dealId: z.number().optional(),
        contactId: z.number().optional(),
        companyId: z.number().optional()
      });
      
      const validatedData = schema.parse(req.body);
      
      // Recupera l'account
      const [account] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, validatedData.accountId))
        .limit(1);
        
      if (!account) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Configura SMTP
      const smtpConfig: SmtpConfig = {
        host: account.smtpHost || '',
        port: account.smtpPort || 587,
        secure: account.smtpSecure || false,
        auth: {
          user: account.username || '',
          pass: account.password || ''
        }
      };
      
      // Crea il mittente email
      const sender = new EmailSender(smtpConfig, account.id, account.email);
      
      // Invia l'email
      const result = await sender.sendEmail(
        {
          to: validatedData.to,
          cc: validatedData.cc,
          bcc: validatedData.bcc,
          subject: validatedData.subject,
          text: validatedData.text,
          html: validatedData.html
        },
        {
          dealId: validatedData.dealId,
          contactId: validatedData.contactId,
          companyId: validatedData.companyId
        }
      );
      
      if (!result.success) {
        return res.status(500).json({ 
          error: 'Errore durante l\'invio dell\'email',
          details: result.error
        });
      }
      
      // Recupera l'email salvata
      const [savedEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, result.id as number))
        .limit(1);
        
      res.status(201).json(savedEmail);
    } catch (error) {
      console.error('Errore durante l\'invio dell\'email:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Dati non validi',
          details: error.errors
        });
      }
      
      res.status(500).json({ error: 'Errore interno del server' });
    }
  }
};