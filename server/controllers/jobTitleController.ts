import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const createJobTitleSchema = z.object({
  subSectorId: z.number(),
  name: z.string(),
});

const updateJobTitleSchema = z.object({
  name: z.string().min(1, "Il nome è richiesto"),
});

// Ottiene tutti i job titles per un sottosettore specifico
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

// Ottiene un job title specifico per ID
export async function getJobTitle(req: Request, res: Response) {
  const id = Number(req.params.id);
  const subSectorId = Number(req.params.subSectorId);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID job title non valido' });
  }
  
  if (isNaN(subSectorId)) {
    return res.status(400).json({ message: 'ID sottosettore non valido' });
  }
  
  try {
    const jobTitle = await storage.getJobTitle(id);
    
    if (!jobTitle) {
      return res.status(404).json({ message: 'Job title non trovato' });
    }
    
    // Verifica che il job title appartenga effettivamente al sottosettore richiesto
    if (jobTitle.subSectorId !== subSectorId) {
      return res.status(404).json({ 
        message: `Job title con ID ${id} non appartiene al sottosettore con ID ${subSectorId}` 
      });
    }
    
    res.json(jobTitle);
  } catch (error) {
    console.error('Errore nel recupero del job title:', error);
    res.status(500).json({ message: 'Errore durante il recupero del job title' });
  }
}

// Crea un nuovo job title
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

// Aggiorna un job title esistente
export async function updateJobTitle(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const subSectorId = Number(req.params.subSectorId);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID job title non valido' });
    }
    
    if (isNaN(subSectorId)) {
      return res.status(400).json({ message: 'ID sottosettore non valido' });
    }
    
    // Validazione dei dati di aggiornamento
    const validatedData = updateJobTitleSchema.parse(req.body);
    
    // Verifichiamo che il job title esista
    const existingJobTitle = await storage.getJobTitle(id);
    
    if (!existingJobTitle) {
      return res.status(404).json({ message: 'Job title non trovato' });
    }
    
    // Verifica che il job title appartenga effettivamente al sottosettore richiesto
    if (existingJobTitle.subSectorId !== subSectorId) {
      return res.status(404).json({ 
        message: `Job title con ID ${id} non appartiene al sottosettore con ID ${subSectorId}` 
      });
    }
    
    // Aggiorniamo il job title
    const updatedJobTitle = await storage.updateJobTitle(id, validatedData);
    
    res.json(updatedJobTitle);
  } catch (error) {
    console.error('Errore nell\'aggiornamento del job title:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Dati non validi', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Errore durante l\'aggiornamento del job title' });
    }
  }
}

// Elimina un job title
export async function deleteJobTitle(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const subSectorId = Number(req.params.subSectorId);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID job title non valido' });
    }
    
    if (isNaN(subSectorId)) {
      return res.status(400).json({ message: 'ID sottosettore non valido' });
    }
    
    // Verifichiamo che il job title esista
    const existingJobTitle = await storage.getJobTitle(id);
    
    if (!existingJobTitle) {
      return res.status(404).json({ message: 'Job title non trovato' });
    }
    
    // Verifica che il job title appartenga effettivamente al sottosettore richiesto
    if (existingJobTitle.subSectorId !== subSectorId) {
      return res.status(404).json({ 
        message: `Job title con ID ${id} non appartiene al sottosettore con ID ${subSectorId}` 
      });
    }
    
    // Eliminiamo il job title
    await storage.deleteJobTitle(id);
    
    res.status(204).end();
  } catch (error) {
    console.error('Errore nell\'eliminazione del job title:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione del job title' });
  }
}