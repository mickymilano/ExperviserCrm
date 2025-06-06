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

// IMPORTANTE: Le route più specifiche (/company/:companyId) devono 
// precedere quelle generiche (/:id) per evitare conflitti

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

// Ottieni tutte le filiali
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('API /api/branches: retrieving branches from storage');
    const branches = await storage.getBranches();
    
    // Debug: log dettagliato delle filiali recuperate
    if (branches && branches.length > 0) {
      console.log(`API /api/branches: found ${branches.length} branches in storage`);
      console.log('API /api/branches: first branch data sample:', JSON.stringify(branches[0]));
    } else {
      console.log('API /api/branches: no branches found in storage');
    }
    
    // Assicuriamo di restituire sempre un array
    res.json(branches || []);
  } catch (error) {
    console.error('Error retrieving branches:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Internal server error', details: error instanceof Error ? error.message : null });
  }
});

// Ottieni una filiale specifica - deve venire DOPO le route più specifiche
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

// Crea una nuova filiale
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Aggiunta della sincronizzazione dei campi linkedin/linkedinUrl e instagram/instagramUrl
    const branchData = { ...req.body };
    
    // Sincronizziamo i campi linkedinUrl e linkedin
    if (branchData.linkedin && !branchData.linkedinUrl) {
      branchData.linkedinUrl = branchData.linkedin;
    } else if (branchData.linkedinUrl && !branchData.linkedin) {
      branchData.linkedin = branchData.linkedinUrl;
    }
    
    // Sincronizziamo i campi instagramUrl e instagram
    if (branchData.instagram && !branchData.instagramUrl) {
      branchData.instagramUrl = branchData.instagram;
    } else if (branchData.instagramUrl && !branchData.instagram) {
      branchData.instagram = branchData.instagramUrl;
    }

    const validatedBranchData = insertBranchSchema.parse(branchData);
    
    // Verifica che l'azienda esista
    const company = await storage.getCompany(validatedBranchData.companyId);
    if (!company) {
      return res.status(400).json({ message: 'Company not found' });
    }
    
    const newBranch = await storage.createBranch(validatedBranchData);
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
    
    // Aggiunta della sincronizzazione dei campi linkedin/linkedinUrl e instagram/instagramUrl
    const branchData = { ...req.body };
    
    // Sincronizziamo i campi linkedinUrl e linkedin
    if (branchData.linkedin && !branchData.linkedinUrl) {
      branchData.linkedinUrl = branchData.linkedin;
    } else if (branchData.linkedinUrl && !branchData.linkedin) {
      branchData.linkedin = branchData.linkedinUrl;
    }
    
    // Sincronizziamo i campi instagramUrl e instagram
    if (branchData.instagram && !branchData.instagramUrl) {
      branchData.instagramUrl = branchData.instagram;
    } else if (branchData.instagramUrl && !branchData.instagram) {
      branchData.instagram = branchData.instagramUrl;
    }

    const updatedBranchData = insertBranchSchema.partial().parse(branchData);
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