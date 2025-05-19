import { Request, Response } from 'express';
import { db } from '../db';
import { signatures } from '../../shared/schema';
import { eq, and, desc, or } from 'drizzle-orm';

export const emailSignatureController = {
  /**
   * Ottiene tutte le firme email dell'utente corrente
   */
  getEmailSignatures: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 1;
      
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
   * Ottiene una firma email specifica
   */
  getEmailSignatureById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1;
      
      console.log(`Retrieving signature with ID: ${id} for user ID: ${userId}`);
      
      // Parse the ID safely
      let signatureId;
      try {
        signatureId = parseInt(id);
        if (isNaN(signatureId)) {
          console.log('Invalid signature ID format:', id);
          return res.status(400).json({ error: 'ID firma non valido' });
        }
      } catch (parseError) {
        console.log('Error parsing signature ID:', parseError);
        return res.status(400).json({ error: 'Formato ID non valido' });
      }
      
      const [signature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, signatureId), 
            eq(signatures.userId, Number(userId))
          )
        )
        .limit(1);
      
      console.log('Retrieved signature:', signature || 'Not found');
      
      if (!signature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      res.json(signature);
    } catch (error) {
      console.error('Errore dettagliato durante il recupero della firma email:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  /**
   * Crea una nuova firma email
   */
  createEmailSignature: async (req: Request, res: Response) => {
    try {
      const { name, content, isDefault = false } = req.body;
      const userId = req.user?.id || 1;
      
      // Validazione input
      if (!name || !content) {
        return res.status(400).json({ error: 'Nome e contenuto sono campi obbligatori' });
      }
      
      // Se isDefault è true, aggiorna tutte le altre firme dell'utente a isDefault = false
      if (isDefault) {
        await db
          .update(signatures)
          .set({ isDefault: false })
          .where(eq(signatures.userId, Number(userId)));
      }
      
      // Inserisci la nuova firma
      const [newSignature] = await db
        .insert(signatures)
        .values({
          name,
          content,
          isDefault: isDefault || false,
          userId: Number(userId),
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
      const { name, content, isDefault = false } = req.body;
      const userId = req.user?.id || 1;
      
      // Verifica che la firma esista e appartenga all'utente
      const [existingSignature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, parseInt(id)),
            eq(signatures.userId, Number(userId))
          )
        )
        .limit(1);
      
      if (!existingSignature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Se isDefault è true, aggiorna tutte le altre firme dell'utente a isDefault = false
      if (isDefault) {
        await db
          .update(signatures)
          .set({ isDefault: false })
          .where(
            and(
              eq(signatures.userId, Number(userId)),
              or(
                eq(signatures.id, 0), // Questo OR serve solo per la sintassi, verrà sempre ignorata questa condizione
                eq(signatures.id, 0)  // perché i due ID sono uguali a zero (impossibile)
              )
            )
          );
      }
      
      // Aggiorna la firma
      const [updatedSignature] = await db
        .update(signatures)
        .set({
          name: name !== undefined ? name : existingSignature.name,
          content: content !== undefined ? content : existingSignature.content,
          isDefault: isDefault !== undefined ? isDefault : existingSignature.isDefault,
          updatedAt: new Date()
        })
        .where(eq(signatures.id, parseInt(id)))
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
      const userId = req.user?.id || 1;
      
      // Verifica che la firma esista e appartenga all'utente
      const [signature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, parseInt(id)),
            eq(signatures.userId, Number(userId))
          )
        )
        .limit(1);
      
      if (!signature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Elimina la firma
      await db
        .delete(signatures)
        .where(
          and(
            eq(signatures.id, parseInt(id)),
            eq(signatures.userId, Number(userId))
          )
        );
      
      res.status(204).send();
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
      const userId = req.user?.id || 1;
      
      // Verifica che la firma esista e appartenga all'utente
      const [signature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, parseInt(id)),
            eq(signatures.userId, Number(userId))
          )
        )
        .limit(1);
      
      if (!signature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Imposta tutte le firme dell'utente come non predefinite
      await db
        .update(signatures)
        .set({ isDefault: false })
        .where(eq(signatures.userId, Number(userId)));
      
      // Imposta la firma specificata come predefinita
      const [updatedSignature] = await db
        .update(signatures)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(signatures.id, parseInt(id)))
        .returning();
      
      res.json(updatedSignature);
    } catch (error) {
      console.error('Errore durante l\'impostazione della firma predefinita:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },
  
  /**
   * Ottiene la firma email predefinita dell'utente
   */
  getDefaultSignature: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 1;
      
      console.log(`Retrieving default signature for user ID: ${userId}`);
      
      const [defaultSignature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.userId, Number(userId)),
            eq(signatures.isDefault, true)
          )
        )
        .limit(1);
      
      console.log('Retrieved default signature:', defaultSignature || 'Not found');
      
      if (!defaultSignature) {
        return res.status(404).json({ error: 'Nessuna firma email predefinita trovata' });
      }
      
      res.json(defaultSignature);
    } catch (error) {
      console.error('Errore dettagliato durante il recupero della firma predefinita:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  }
};