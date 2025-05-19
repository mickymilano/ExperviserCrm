import { Request, Response } from 'express';
import OpenAI from 'openai';
import { makeGenericId } from '../utils';
import nodemailer from 'nodemailer';

// Utilizzo di dati per l'integrazione del modulo email

// Inizializza il client OpenAI se l'API key è disponibile
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Ottiene tutti gli account email dell'utente
 */
export const getEmailAccounts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    
    const accounts = await db.select().from(emailAccounts)
      .where(eq(emailAccounts.userId, userId))
      .orderBy(desc(emailAccounts.isPrimary));
    
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ error: 'Failed to fetch email accounts' });
  }
};

/**
 * Crea un nuovo account email
 */
export const createEmailAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    const accountData = { ...req.body, userId };
    
    // Se è il primo account, impostarlo come primario
    const existingAccounts = await db.select({ count: { count: emailAccounts.id } })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));
    
    const isFirstAccount = existingAccounts.length === 0 || existingAccounts[0].count.count === 0;
    if (isFirstAccount) {
      accountData.isPrimary = true;
    }
    
    const [newAccount] = await db.insert(emailAccounts).values(accountData).returning();
    
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating email account:', error);
    res.status(500).json({ error: 'Failed to create email account' });
  }
};

/**
 * Aggiorna un account email
 */
export const updateEmailAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    
    const [updatedAccount] = await db.update(emailAccounts)
      .set(req.body)
      .where(and(
        eq(emailAccounts.id, parseInt(id)), 
        eq(emailAccounts.userId, userId)
      ))
      .returning();
    
    if (!updatedAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }
    
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({ error: 'Failed to update email account' });
  }
};

/**
 * Elimina un account email
 */
export const deleteEmailAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    
    const accountToDelete = await db.select()
      .from(emailAccounts)
      .where(and(
        eq(emailAccounts.id, parseInt(id)),
        eq(emailAccounts.userId, userId)
      ))
      .limit(1);
    
    if (accountToDelete.length === 0) {
      return res.status(404).json({ error: 'Email account not found' });
    }
    
    // Verifica se questo è l'account primario
    const isPrimary = accountToDelete[0].isPrimary;
    
    await db.delete(emailAccounts)
      .where(and(
        eq(emailAccounts.id, parseInt(id)),
        eq(emailAccounts.userId, userId)
      ));
    
    // Se era l'account primario, imposta un altro account come primario (se esiste)
    if (isPrimary) {
      const remainingAccounts = await db.select()
        .from(emailAccounts)
        .where(eq(emailAccounts.userId, userId))
        .limit(1);
      
      if (remainingAccounts.length > 0) {
        await db.update(emailAccounts)
          .set({ isPrimary: true })
          .where(eq(emailAccounts.id, remainingAccounts[0].id));
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({ error: 'Failed to delete email account' });
  }
};

/**
 * Imposta un account email come primario
 */
export const setPrimaryEmailAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    
    // Reimposta tutti gli account come non primari
    await db.update(emailAccounts)
      .set({ isPrimary: false })
      .where(eq(emailAccounts.userId, userId));
    
    // Imposta l'account specificato come primario
    const [updatedAccount] = await db.update(emailAccounts)
      .set({ isPrimary: true })
      .where(and(
        eq(emailAccounts.id, parseInt(id)),
        eq(emailAccounts.userId, userId)
      ))
      .returning();
    
    if (!updatedAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }
    
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error setting primary email account:', error);
    res.status(500).json({ error: 'Failed to set primary email account' });
  }
};

/**
 * Ottiene tutte le firme email dell'utente
 */
export const getEmailSignatures = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    
    const signatures = await db.select()
      .from(emailAccountSignatures)
      .where(eq(emailAccountSignatures.userId, userId))
      .orderBy(desc(emailAccountSignatures.isDefault));
    
    res.json(signatures);
  } catch (error) {
    console.error('Error fetching email signatures:', error);
    res.status(500).json({ error: 'Failed to fetch email signatures' });
  }
};

/**
 * Crea una nuova firma email
 */
export const createEmailSignature = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    const signatureData = { ...req.body, userId };
    
    // Se è la prima firma, impostarla come predefinita
    const existingSignatures = await db.select({ count: { count: emailAccountSignatures.id } })
      .from(emailAccountSignatures)
      .where(eq(emailAccountSignatures.userId, userId));
    
    const isFirstSignature = existingSignatures.length === 0 || existingSignatures[0].count.count === 0;
    if (isFirstSignature) {
      signatureData.isDefault = true;
    }
    
    const [newSignature] = await db.insert(emailAccountSignatures).values(signatureData).returning();
    
    res.status(201).json(newSignature);
  } catch (error) {
    console.error('Error creating email signature:', error);
    res.status(500).json({ error: 'Failed to create email signature' });
  }
};

/**
 * Ottiene le email filtrate per entità
 */
export const getEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    const { 
      entityId, 
      entityType,
      read,
      unread,
      hasAttachments,
      sentByMe,
      receivedByMe,
      dateFrom,
      dateTo,
      searchText
    } = req.query;
    
    let query = db.select({
      id: emails.id,
      subject: emails.subject,
      from: emails.from,
      fromName: emails.fromName,
      to: emails.to,
      cc: emails.cc,
      bcc: emails.bcc,
      body: emails.body,
      date: emails.date,
      read: emails.read,
      hasAttachments: emails.hasAttachments,
      accountId: emails.accountId,
      // Altri campi che potrebbero essere necessari
    })
    .from(emails)
    .orderBy(desc(emails.date));

    // Filtra per entità associata se specificato
    if (entityId && entityType) {
      query = query.innerJoin(
        emailEntityAssociations,
        and(
          eq(emailEntityAssociations.emailId, emails.id),
          eq(emailEntityAssociations.entityId, Number(entityId)),
          eq(emailEntityAssociations.entityType, String(entityType))
        )
      );
    }

    // Filtra per stato di lettura
    if (read === 'true') {
      query = query.where(eq(emails.read, true));
    } else if (unread === 'true') {
      query = query.where(eq(emails.read, false));
    }

    // Filtra per allegati
    if (hasAttachments === 'true') {
      query = query.where(eq(emails.hasAttachments, true));
    }

    // Filtra per mittente/destinatario
    if (sentByMe === 'true') {
      // Trova gli account email dell'utente e filtra per email inviate da questi account
      const userAccounts = await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId));
      const userEmails = userAccounts.map(acc => acc.email);
      // TODO: implementare la logica per verificare se l'email è stata inviata dall'utente
    }

    // Filtra per data
    if (dateFrom) {
      query = query.where(desc(emails.date, new Date(String(dateFrom))));
    }
    if (dateTo) {
      query = query.where(asc(emails.date, new Date(String(dateTo))));
    }

    // Ricerca testo
    if (searchText) {
      const searchPattern = `%${searchText}%`;
      query = query.where(
        or(
          like(emails.subject, searchPattern),
          like(emails.body, searchPattern),
          like(emails.from, searchPattern),
          like(emails.fromName, searchPattern)
        )
      );
    }

    // Esegui la query
    const fetchedEmails = await query;
    
    // Risposta con dati mock in assenza di un'implementazione completa
    const mockEmails = [
      {
        id: 1,
        from: 'mario.rossi@example.com',
        fromName: 'Mario Rossi',
        to: ['utente@experviser.com'],
        subject: 'Richiesta informazioni prodotto',
        body: '<p>Buongiorno,</p><p>Sarei interessato a ricevere maggiori informazioni sul vostro prodotto XYZ. Potremmo organizzare una chiamata la prossima settimana?</p><p>Cordiali saluti,<br>Mario Rossi</p>',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ieri
        read: true,
        hasAttachments: false,
        accountId: 1
      },
      {
        id: 2,
        from: 'laura.bianchi@example.com',
        fromName: 'Laura Bianchi',
        to: ['utente@experviser.com'],
        subject: 'Conferma appuntamento',
        body: '<p>Gentile utente,</p><p>Confermo l\'appuntamento per il giorno 25 maggio alle ore 15:00 presso la nostra sede.</p><p>Cordiali saluti,<br>Laura Bianchi</p>',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 ore fa
        read: false,
        hasAttachments: false,
        accountId: 1
      },
      {
        id: 3,
        from: 'giovanni.verdi@example.com',
        fromName: 'Giovanni Verdi',
        to: ['utente@experviser.com'],
        cc: ['responsabile@example.com'],
        subject: 'Documentazione richiesta',
        body: '<p>Buongiorno,</p><p>In allegato troverà la documentazione richiesta per il progetto.</p><p>Rimango a disposizione per qualsiasi chiarimento.</p><p>Cordiali saluti,<br>Giovanni Verdi</p>',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minuti fa
        read: false,
        hasAttachments: true,
        accountId: 1
      }
    ];
    
    // Per ora, restituiamo dati mock invece dei dati effettivi dal database
    // In una implementazione reale, restituiremmo fetchedEmails
    res.json(mockEmails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

/**
 * Invia una nuova email
 */
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    const {
      to,
      cc,
      bcc,
      subject,
      body,
      accountId,
      signatureId,
      inReplyTo,
      entityId,
      entityType
    } = req.body;
    
    // Ottieni le informazioni sull'account email
    const account = await db.select()
      .from(emailAccounts)
      .where(and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      ))
      .limit(1);
    
    if (account.length === 0) {
      return res.status(404).json({ error: 'Email account not found' });
    }
    
    // In una implementazione reale, utilizzeremmo nodemailer per inviare l'email
    // Per ora, salviamo solo l'email nel database
    
    // Crea un ID univoco per l'email
    const emailId = makeGenericId();
    
    // Inserisci l'email nel database
    const [newEmail] = await db.insert(emails).values({
      id: emailId,
      from: account[0].email,
      fromName: account[0].name,
      to,
      cc,
      bcc,
      subject,
      body,
      date: new Date().toISOString(),
      read: true, // Le email inviate sono automaticamente lette
      hasAttachments: false, // Per ora, nessun allegato
      accountId,
      // Altri campi che potrebbero essere necessari
    }).returning();
    
    // Se l'email è associata a un'entità, crea l'associazione
    if (entityId && entityType) {
      await db.insert(emailEntityAssociations).values({
        emailId: emailId,
        entityId: Number(entityId),
        entityType: String(entityType)
      });
    }
    
    // In una implementazione reale, invieremmo effettivamente l'email
    // Simula un ritardo per l'invio
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.status(201).json({
      success: true,
      emailId: emailId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

/**
 * Marca le email come lette
 */
export const markEmailsAsRead = async (req: Request, res: Response) => {
  try {
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: 'No email IDs provided' });
    }
    
    // Aggiorna lo stato delle email nel database
    await db.update(emails)
      .set({ read: true })
      .where(eq(emails.id, emailIds[0])); // Per ora, aggiorniamo solo la prima email
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking emails as read:', error);
    res.status(500).json({ error: 'Failed to mark emails as read' });
  }
};

/**
 * Elimina le email
 */
export const deleteEmails = async (req: Request, res: Response) => {
  try {
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: 'No email IDs provided' });
    }
    
    // Elimina le email dal database
    await db.delete(emails)
      .where(eq(emails.id, emailIds[0])); // Per ora, eliminiamo solo la prima email
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting emails:', error);
    res.status(500).json({ error: 'Failed to delete emails' });
  }
};

/**
 * Genera una risposta automatica con AI
 */
export const generateAIReply = async (req: Request, res: Response) => {
  try {
    const { emailBody, emailSubject, entityId, entityType } = req.body;
    
    // Verifica se l'API OpenAI è disponibile
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not available' });
    }
    
    // Ottieni informazioni sull'entità per personalizzare la risposta (in una implementazione reale)
    let entityInfo = {};
    if (entityId && entityType) {
      // Qui si recupererebbero le informazioni sull'entità dal database
      // Per ora, usiamo dati di esempio
      if (entityType === 'contact') {
        entityInfo = { type: 'contatto', name: 'Mario Rossi' };
      } else if (entityType === 'company') {
        entityInfo = { type: 'azienda', name: 'Acme S.p.A.' };
      }
    }
    
    // Costruisci il prompt per l'AI
    const prompt = `
Sei un assistente professionale che deve generare una risposta email in italiano.

L'email originale ha come oggetto: "${emailSubject}"
Contenuto dell'email originale: "${emailBody.replace(/<[^>]*>/g, '')}"

${entityInfo && entityInfo.type ? `Questa email è relativa a ${entityInfo.type} ${entityInfo.name}.` : ''}

Per favore, genera una risposta professionale, concisa e cortese in formato HTML.
La risposta deve essere scritta in italiano, utilizzare un tono professionale ma amichevole,
e non deve includere 'AI' o riferimenti a intelligenza artificiale.
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const generatedReply = completion.choices[0].message.content || '';
    
    res.json({ generatedReply });
  } catch (error) {
    console.error('Error generating AI reply:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI reply',
      details: error.message
    });
  }
};

/**
 * Sincronizza gli account email
 * Nota: in un'implementazione reale, questo connetterebbe agli account email tramite IMAP/POP3
 */
export const syncEmailAccounts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 1; // In modalità dev, userId = 1
    
    // Ottieni tutti gli account email dell'utente
    const accounts = await db.select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));
    
    // Simula un processo di sincronizzazione per ogni account
    const syncResults = [];
    for (const account of accounts) {
      // In una implementazione reale, connetteremmo al server IMAP/POP3 e sincronizzeremmo le email
      // Per ora, aggiungiamo semplicemente un risultato fittizio
      syncResults.push({
        accountId: account.id,
        success: true,
        newEmails: Math.floor(Math.random() * 5), // 0-4 nuove email
        message: `Account ${account.email} sincronizzato con successo`
      });
    }
    
    res.json({
      success: true,
      syncResults
    });
  } catch (error) {
    console.error('Error syncing email accounts:', error);
    res.status(500).json({ error: 'Failed to sync email accounts' });
  }
};