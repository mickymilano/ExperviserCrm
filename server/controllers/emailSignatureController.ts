import { Request, Response } from 'express';
import { db } from '../db';
import { signatures } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Schema di validazione per la creazione/aggiornamento delle firme email
const emailSignatureSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  content: z.string().min(1, 'Il contenuto è obbligatorio'),
  isDefault: z.boolean().optional().default(false),
});

// Controller per le firme email
export const emailSignatureController = {
  /**
   * Ottiene tutte le firme email dell'utente corrente
   */
  getEmailSignatures: async (req: Request, res: Response) => {
    try {
      // In modalità sviluppo, usa sempre l'utente 1 simulato
      const userId = req.user?.id || 1;
      
      const signaturesList = await db
        .select()
        .from(signatures)
        .where(eq(signatures.userId, Number(userId)))
        .orderBy(signatures.name);
      
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
      // Valida i dati in ingresso
      const validatedData = emailSignatureSchema.parse(req.body);
      const userId = req.user?.id || 1;
      
      // Se questa firma è impostata come predefinita, ripristina tutte le altre
      if (validatedData.isDefault) {
        await db
          .update(signatures)
          .set({ isDefault: false })
          .where(eq(signatures.userId, userId));
      }
      
      // Crea la nuova firma
      const [newSignature] = await db
        .insert(signatures)
        .values({
          userId: userId,
          name: validatedData.name,
          content: validatedData.content,
          isDefault: validatedData.isDefault,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      res.status(201).json(newSignature);
    } catch (error) {
      console.error('Errore durante la creazione della firma email:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Dati non validi',
          details: error.errors
        });
      }
      
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
      const userId = req.user?.id || 1;
      
      // Verifica che la firma esista e appartenga all'utente
      const [existingSignature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, signatureId),
            eq(signatures.userId, userId)
          )
        )
        .limit(1);
      
      if (!existingSignature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Valida i dati in ingresso
      const validatedData = emailSignatureSchema.parse(req.body);
      
      // Se questa firma è impostata come predefinita, ripristina tutte le altre
      if (validatedData.isDefault && !existingSignature.isDefault) {
        await db
          .update(signatures)
          .set({ isDefault: false })
          .where(eq(signatures.userId, userId));
      }
      
      // Aggiorna la firma
      const [updatedSignature] = await db
        .update(signatures)
        .set({
          name: validatedData.name,
          content: validatedData.content,
          isDefault: validatedData.isDefault,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(signatures.id, signatureId),
            eq(signatures.userId, userId)
          )
        )
        .returning();
      
      res.json(updatedSignature);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della firma email:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Dati non validi',
          details: error.errors
        });
      }
      
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
      const userId = req.user?.id || 1;
      
      // Verifica che la firma esista e appartenga all'utente
      const [existingSignature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, signatureId),
            eq(signatures.userId, userId)
          )
        )
        .limit(1);
      
      if (!existingSignature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Elimina la firma
      await db
        .delete(signatures)
        .where(
          and(
            eq(signatures.id, signatureId),
            eq(signatures.userId, userId)
          )
        );
      
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
      const userId = req.user?.id || 1;
      
      // Verifica che la firma esista e appartenga all'utente
      const [existingSignature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.id, signatureId),
            eq(signatures.userId, userId)
          )
        )
        .limit(1);
      
      if (!existingSignature) {
        return res.status(404).json({ error: 'Firma email non trovata' });
      }
      
      // Ripristina tutte le firme
      await db
        .update(signatures)
        .set({ isDefault: false })
        .where(eq(signatures.userId, userId));
      
      // Imposta questa firma come predefinita
      const [updatedSignature] = await db
        .update(signatures)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(signatures.id, signatureId),
            eq(signatures.userId, userId)
          )
        )
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
      
      const [signature] = await db
        .select()
        .from(signatures)
        .where(
          and(
            eq(signatures.userId, userId),
            eq(signatures.isDefault, true)
          )
        )
        .limit(1);
      
      if (!signature) {
        return res.status(404).json({ error: 'Nessuna firma predefinita trovata' });
      }
      
      res.json(signature);
    } catch (error) {
      console.error('Errore durante il recupero della firma predefinita:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  }
};