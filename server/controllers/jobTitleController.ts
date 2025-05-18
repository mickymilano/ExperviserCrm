import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const createJobTitleSchema = z.object({
  subSectorId: z.number(),
  name: z.string(),
});
export async function getJobTitles(req: Request, res: Response) {
  // Per la rotta /api/subsectors/:subSectorId/jobtitles, usiamo params invece di query
  const subSectorId = Number(req.params.subSectorId);
  const search = String(req.query.search ?? '');
  
  console.log(`Controller: getJobTitles con subSectorId=${subSectorId}, search="${search}"`);
  
  if (isNaN(subSectorId)) {
    return res.status(400).json({ message: 'ID sottosettore non valido' });
  }
  
  try {
    const list = await storage.getJobTitles({
      subSectorId,
      search,
    });
    res.json(list);
  } catch (error) {
    console.error('Errore nel recupero dei job titles:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei job titles' });
  }
}
export async function createJobTitle(req: Request, res: Response) {
  try {
    // Otteniamo il subSectorId dai parametri dell'URL
    const subSectorId = Number(req.params.subSectorId);
    
    if (isNaN(subSectorId)) {
      return res.status(400).json({ message: 'ID sottosettore non valido' });
    }

    // Validazione del corpo della richiesta (solo il nome è necessario perché subSectorId viene dai parametri)
    const nameSchema = z.object({
      name: z.string().min(1, "Il nome è richiesto"),
    });
    
    const validatedData = nameSchema.parse(req.body);
    
    // Combiniamo il subSectorId dai parametri con i dati validati
    const dto = {
      subSectorId,
      name: validatedData.name
    };
    
    const item = await storage.createJobTitle(dto);
    res.status(201).json(item);
  } catch (error) {
    console.error('Errore nella creazione del job title:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Dati non validi', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Errore durante la creazione del job title' });
    }
  }
}