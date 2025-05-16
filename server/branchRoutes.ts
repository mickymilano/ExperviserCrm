import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertBranchSchema } from '@shared/schema';
import jwt from 'jsonwebtoken';

// Definiamo il middleware di authenticazione direttamente qui per evitare dipendenze circolari
const authenticateJWT = (req: any, res: any, next: any) => {
  // Ottieni il token dal cookie o dall'header Authorization
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  // Consenti l'autenticazione come utente di debug in sviluppo
  if (process.env.NODE_ENV === 'development' && !token) {
    console.log('Using debug authentication for Branch APIs');
    req.user = {
      id: 1,
      username: 'debug',
      role: 'super_admin'
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: 'Autenticazione richiesta' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';
  
  try {
    // Verifica il token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token non valido' });
  }
};

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