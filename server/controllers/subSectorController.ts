import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const createSubSectorSchema = z.object({
  sectorId: z.number(),
  name: z.string(),
});
export async function getSubSectors(req: Request, res: Response) {
  // Per la rotta /api/sectors/:sectorId/subsectors, usiamo params invece di query
  const sectorId = Number(req.params.sectorId);
  const search = String(req.query.search ?? '');
  
  console.log(`Controller: getSubSectors con sectorId=${sectorId}, search="${search}"`);
  
  if (isNaN(sectorId)) {
    return res.status(400).json({ message: 'ID settore non valido' });
  }
  
  try {
    const list = await storage.getSubSectors({
      sectorId,
      search,
    });
    res.json(list);
  } catch (error) {
    console.error('Errore nel recupero dei sottosettori:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei sottosettori' });
  }
}
export async function createSubSector(req: Request, res: Response) {
  try {
    // Otteniamo il sectorId dai parametri dell'URL
    const sectorId = Number(req.params.sectorId);
    
    if (isNaN(sectorId)) {
      return res.status(400).json({ message: 'ID settore non valido' });
    }

    // Validazione del corpo della richiesta (solo il nome è necessario perché sectorId viene dai parametri)
    const nameSchema = z.object({
      name: z.string().min(1, "Il nome è richiesto"),
    });
    
    const validatedData = nameSchema.parse(req.body);
    
    // Combiniamo il sectorId dai parametri con i dati validati
    const dto = {
      sectorId,
      name: validatedData.name
    };
    
    const item = await storage.createSubSector(dto);
    res.status(201).json(item);
  } catch (error) {
    console.error('Errore nella creazione del sottosettore:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Dati non validi', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Errore durante la creazione del sottosettore' });
    }
  }
}