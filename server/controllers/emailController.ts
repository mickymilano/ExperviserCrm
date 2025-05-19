import { Request, Response } from 'express';
import { db } from '../db';
import { 
  emails,
  emailAccounts,
  emailAccountSignatures,
  insertEmailAccountSchema
} from '../../shared/email/schema';
import { signatures } from '../../shared/schema';
import { eq, and, desc, like, sql, asc, ne } from 'drizzle-orm';
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
   * Recupera le email per una specifica entità (contatto, azienda, lead, deal)
   */
  getEmailsByEntity: async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const entityIdNumber = parseInt(entityId, 10);
      
      if (isNaN(entityIdNumber)) {
        return res.status(400).json({ error: 'ID entità non valido' });
      }
      
      // Per questa dimostrazione, forniamo email di esempio
      // In produzione, qui implementeremmo la logica di filtro reale basata sull'ID e tipo di entità
      const mockEmails = [
        {
          id: 1,
          accountId: 1,
          from: 'example@domain.com',
          fromName: 'Sender Example',
          to: ['recipient@example.com'],
          cc: [],
          bcc: [],
          subject: `Email correlata a ${entityType} #${entityId}`,
          body: `<p>Questa è un'email di esempio per ${entityType} con ID ${entityId}.</p>`,
          date: new Date().toISOString(),
          read: false,
          hasAttachments: false
        },
        {
          id: 2,
          accountId: 1,
          from: 'support@yourcompany.com',
          fromName: 'Team Support',
          to: ['recipient@example.com'],
          cc: ['manager@example.com'],
          bcc: [],
          subject: `Aggiornamento su ${entityType}`,
          body: `<p>Un altro esempio di email correlata a questo ${entityType}.</p>`,
          date: new Date(Date.now() - 86400000).toISOString(), // 1 giorno fa
          read: true,
          hasAttachments: true
        }
      ];
      
      return res.json(mockEmails);
    } catch (error) {
      console.error('Errore nel recupero delle email per entità:', error);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  },
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
        filters.push(eq(emails.read, true));
      } else if (req.query.isRead === 'false') {
        filters.push(eq(emails.read, false));
      }
      
      // Nota: Il campo direction non esiste nel database attuale
      // Rimuoviamo temporaneamente questo filtro
      /* if (req.query.direction) {
        filters.push(eq(emails.direction, req.query.direction as string));
      } */
      
      if (req.query.search) {
        const searchTerm = `%${req.query.search}%`;
        filters.push(
          sql`(${emails.subject} LIKE ${searchTerm} OR ${emails.body} LIKE ${searchTerm})`
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
          date: emails.date, // Utilizziamo il campo date esistente
          read: emails.read, // Utilizziamo il campo read invece di isRead
          body: emails.body,
          dealId: emails.dealId,
          contactId: emails.contactId,
          companyId: emails.companyId,
          accountId: emails.accountId
        })
        .from(emails)
        .where(and(...filters))
        .orderBy(desc(emails.date))
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
      if (!emailData.read) {
        await db
          .update(emails)
          .set({ read: true })
          .where(eq(emails.id, emailId));
      }
      
      // Nota: La tabella email_associations non esiste ancora 
      // Invio solo i dati dell'email senza associazioni per ora
      res.json({
        ...emailData,
        associations: [] // Array vuoto fino a quando non avremo la tabella
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
  },
  
  /**
   * Recupera tutte le firme email dell'utente corrente
   */
  getEmailSignatures: async (req: Request, res: Response) => {
    try {
      // In un'app reale, utilizzare l'ID dell'utente autenticato
      const userId = 1;
      const signaturesList = await db
        .select()
        .from(signatures)
        .where(eq(signatures.userId, Number(userId)))
        .orderBy(desc(signatures.isDefault), signatures.name);

      res.json(signaturesList);
    } catch (error) {
      console.error('Errore durante il recupero delle firme email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Recupera una firma email specifica per ID
   */
  getEmailSignatureById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const signatureId = parseInt(id);
      
      const [signature] = await db
        .select()
        .from(emailSignatures)
        .where(eq(emailSignatures.id, signatureId))
        .limit(1);
        
      if (!signature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      res.json(signature);
    } catch (error) {
      console.error('Errore durante il recupero della firma email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Crea una nuova firma email
   */
  createEmailSignature: async (req: Request, res: Response) => {
    try {
      const { name, content, isDefault } = req.body;
      
      // Validazione
      if (!name || !content) {
        return res.status(400).json({ 
          error: 'Dati mancanti',
          details: 'Nome e contenuto della firma sono obbligatori'
        });
      }
      
      // In un'app reale, utilizzare l'ID dell'utente autenticato
      const userId = 1;
      
      // Se questa firma è impostata come default, rimuovi lo stato default dalle altre
      if (isDefault) {
        await db
          .update(emailSignatures)
          .set({ isDefault: false })
          .where(eq(emailSignatures.userId, userId));
      }
      
      // Crea la nuova firma
      const [newSignature] = await db
        .insert(emailSignatures)
        .values({
          userId,
          name,
          content,
          isDefault: isDefault || false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      res.status(201).json(newSignature);
    } catch (error) {
      console.error('Errore durante la creazione della firma email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Aggiorna una firma email esistente
   */
  updateEmailSignature: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const signatureId = parseInt(id);
      const { name, content, isDefault } = req.body;
      
      // Verifica che la firma esista
      const [existingSignature] = await db
        .select()
        .from(emailSignatures)
        .where(eq(emailSignatures.id, signatureId))
        .limit(1);
        
      if (!existingSignature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Se questa firma è impostata come default, rimuovi lo stato default dalle altre
      if (isDefault && !existingSignature.isDefault) {
        await db
          .update(emailSignatures)
          .set({ isDefault: false })
          .where(
            and(
              eq(emailSignatures.userId, existingSignature.userId),
              ne(emailSignatures.id, signatureId)
            )
          );
      }
      
      // Aggiorna la firma
      const [updatedSignature] = await db
        .update(emailSignatures)
        .set({
          name: name || existingSignature.name,
          content: content || existingSignature.content,
          isDefault: isDefault !== undefined ? isDefault : existingSignature.isDefault,
          updatedAt: new Date()
        })
        .where(eq(emailSignatures.id, signatureId))
        .returning();
        
      res.json(updatedSignature);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della firma email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Elimina una firma email
   */
  deleteEmailSignature: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const signatureId = parseInt(id);
      
      // Verifica che la firma esista
      const [existingSignature] = await db
        .select()
        .from(emailSignatures)
        .where(eq(emailSignatures.id, signatureId))
        .limit(1);
        
      if (!existingSignature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Elimina la firma
      await db
        .delete(emailSignatures)
        .where(eq(emailSignatures.id, signatureId));
        
      // Se era la firma predefinita, imposta un'altra firma come predefinita (se disponibile)
      if (existingSignature.isDefault) {
        const [anotherSignature] = await db
          .select()
          .from(emailSignatures)
          .where(eq(emailSignatures.userId, existingSignature.userId))
          .limit(1);
          
        if (anotherSignature) {
          await db
            .update(emailSignatures)
            .set({ isDefault: true })
            .where(eq(emailSignatures.id, anotherSignature.id));
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Errore durante l\'eliminazione della firma email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Imposta una firma email come predefinita
   */
  setDefaultSignature: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const signatureId = parseInt(id);
      
      // Verifica che la firma esista
      const [signature] = await db
        .select()
        .from(emailSignatures)
        .where(eq(emailSignatures.id, signatureId))
        .limit(1);
        
      if (!signature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Rimuovi lo stato default da tutte le firme dell'utente
      await db
        .update(emailSignatures)
        .set({ isDefault: false })
        .where(eq(emailSignatures.userId, signature.userId));
        
      // Imposta questa firma come default
      const [updatedSignature] = await db
        .update(emailSignatures)
        .set({ 
          isDefault: true,
          updatedAt: new Date() 
        })
        .where(eq(emailSignatures.id, signatureId))
        .returning();
        
      res.json(updatedSignature);
    } catch (error) {
      console.error('Errore durante l\'impostazione della firma predefinita:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Recupera tutte le firme associate a un account email
   */
  getEmailAccountSignatures: async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const emailAccountId = parseInt(accountId);
      
      const signatures = await db
        .select({
          signature: emailSignatures,
          isAccountDefault: emailAccountSignatures.isDefault
        })
        .from(emailAccountSignatures)
        .innerJoin(
          emailSignatures,
          eq(emailAccountSignatures.signatureId, emailSignatures.id)
        )
        .where(eq(emailAccountSignatures.accountId, emailAccountId))
        .orderBy(desc(emailAccountSignatures.isDefault), asc(emailSignatures.name));
        
      // Mappa i risultati per restituire un formato più user-friendly
      const formattedSignatures = signatures.map(row => ({
        ...row.signature,
        isDefault: row.isAccountDefault
      }));
        
      res.json(formattedSignatures);
    } catch (error) {
      console.error('Errore durante il recupero delle firme dell\'account:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Associa una firma a un account email
   */
  addSignatureToAccount: async (req: Request, res: Response) => {
    try {
      const { accountId, signatureId } = req.params;
      const { isDefault } = req.body;
      
      const emailAccountId = parseInt(accountId);
      const emailSignatureId = parseInt(signatureId);
      
      // Verifica che l'account esista
      const [account] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, emailAccountId))
        .limit(1);
        
      if (!account) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }
      
      // Verifica che la firma esista
      const [signature] = await db
        .select()
        .from(emailSignatures)
        .where(eq(emailSignatures.id, emailSignatureId))
        .limit(1);
        
      if (!signature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Se questa firma è impostata come default, rimuovi lo stato default dalle altre
      if (isDefault) {
        await db
          .update(emailAccountSignatures)
          .set({ isDefault: false })
          .where(eq(emailAccountSignatures.accountId, emailAccountId));
      }
      
      // Crea o aggiorna l'associazione
      const [association] = await db
        .insert(emailAccountSignatures)
        .values({
          accountId: emailAccountId,
          signatureId: emailSignatureId,
          isDefault: isDefault || false
        })
        .onConflictDoUpdate({
          target: [emailAccountSignatures.accountId, emailAccountSignatures.signatureId],
          set: { isDefault: isDefault || false }
        })
        .returning();
        
      res.status(201).json(association);
    } catch (error) {
      console.error('Errore durante l\'associazione della firma all\'account:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Rimuove l'associazione tra una firma e un account email
   */
  removeSignatureFromAccount: async (req: Request, res: Response) => {
    try {
      const { accountId, signatureId } = req.params;
      
      const emailAccountId = parseInt(accountId);
      const emailSignatureId = parseInt(signatureId);
      
      // Verifica che l'associazione esista
      const [association] = await db
        .select()
        .from(emailAccountSignatures)
        .where(
          and(
            eq(emailAccountSignatures.accountId, emailAccountId),
            eq(emailAccountSignatures.signatureId, emailSignatureId)
          )
        )
        .limit(1);
        
      if (!association) {
        return res.status(404).json({ error: 'Associazione non trovata' });
      }
      
      // Rimuovi l'associazione
      await db
        .delete(emailAccountSignatures)
        .where(
          and(
            eq(emailAccountSignatures.accountId, emailAccountId),
            eq(emailAccountSignatures.signatureId, emailSignatureId)
          )
        );
        
      // Se questa era la firma predefinita, imposta un'altra firma come predefinita (se disponibile)
      if (association.isDefault) {
        const [anotherAssociation] = await db
          .select()
          .from(emailAccountSignatures)
          .where(eq(emailAccountSignatures.accountId, emailAccountId))
          .limit(1);
          
        if (anotherAssociation) {
          await db
            .update(emailAccountSignatures)
            .set({ isDefault: true })
            .where(
              and(
                eq(emailAccountSignatures.accountId, emailAccountId),
                eq(emailAccountSignatures.signatureId, anotherAssociation.signatureId)
              )
            );
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Errore durante la rimozione dell\'associazione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Imposta una firma come predefinita per un account email
   */
  setDefaultSignatureForAccount: async (req: Request, res: Response) => {
    try {
      const { accountId, signatureId } = req.params;
      
      const emailAccountId = parseInt(accountId);
      const emailSignatureId = parseInt(signatureId);
      
      // Verifica che l'associazione esista
      const [association] = await db
        .select()
        .from(emailAccountSignatures)
        .where(
          and(
            eq(emailAccountSignatures.accountId, emailAccountId),
            eq(emailAccountSignatures.signatureId, emailSignatureId)
          )
        )
        .limit(1);
        
      if (!association) {
        return res.status(404).json({ error: 'Associazione non trovata' });
      }
      
      // Rimuovi lo stato default da tutte le firme dell'account
      await db
        .update(emailAccountSignatures)
        .set({ isDefault: false })
        .where(eq(emailAccountSignatures.accountId, emailAccountId));
        
      // Imposta questa firma come default
      const [updatedAssociation] = await db
        .update(emailAccountSignatures)
        .set({ isDefault: true })
        .where(
          and(
            eq(emailAccountSignatures.accountId, emailAccountId),
            eq(emailAccountSignatures.signatureId, emailSignatureId)
          )
        )
        .returning();
        
      res.json(updatedAssociation);
    } catch (error) {
      console.error('Errore durante l\'impostazione della firma predefinita per l\'account:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  }
};