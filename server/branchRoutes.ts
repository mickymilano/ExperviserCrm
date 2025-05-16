import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertBranchSchema } from '@shared/schema';
import { authenticateJWT } from './routes';

const router = Router();

// Ottieni tutte le filiali
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('API /api/branches: retrieving branches from storage');
    const branches = await storage.getBranches();
    console.log(`API /api/branches: found ${branches.length} branches in storage`);
    res.json(branches);
  } catch (error) {
    console.error('Error retrieving branches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ottieni una filiale specifica
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID must be a number' });
  }

  try {
    const branch = await storage.getBranch(id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error(`Error retrieving branch ${id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ottieni filiali per azienda
router.get('/company/:companyId', authenticateJWT, async (req: Request, res: Response) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) {
    return res.status(400).json({ message: 'Company ID must be a number' });
  }

  try {
    // Verifica prima se l'azienda esiste
    const company = await storage.getCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const branches = await storage.getBranchesByCompanyId(companyId);
    res.json(branches);
  } catch (error) {
    console.error(`Error retrieving branches for company ${companyId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Crea una nuova filiale
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const branchData = insertBranchSchema.parse(req.body);
    
    // Verifica che l'azienda esista
    const company = await storage.getCompany(branchData.companyId);
    if (!company) {
      return res.status(400).json({ message: 'Company not found' });
    }
    
    const newBranch = await storage.createBranch(branchData);
    res.status(201).json(newBranch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    console.error('Error creating branch:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Aggiorna una filiale
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID must be a number' });
  }

  try {
    // Verifica che la filiale esista
    const existingBranch = await storage.getBranch(id);
    if (!existingBranch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Se viene aggiornata l'azienda associata, verifica che esista
    if (req.body.companyId) {
      const company = await storage.getCompany(req.body.companyId);
      if (!company) {
        return res.status(400).json({ message: 'Company not found' });
      }
    }

    const updatedBranchData = insertBranchSchema.partial().parse(req.body);
    const updatedBranch = await storage.updateBranch(id, updatedBranchData);
    
    res.json(updatedBranch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    console.error(`Error updating branch ${id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Elimina una filiale
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID must be a number' });
  }

  try {
    // Verifica che la filiale esista
    const existingBranch = await storage.getBranch(id);
    if (!existingBranch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    await storage.deleteBranch(id);
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting branch ${id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;