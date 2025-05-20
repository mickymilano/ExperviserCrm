import { createServer } from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { pool, db } from './db'; // Importiamo il pool di connessione PostgreSQL
import { z } from 'zod';
import { 
  insertUserSchema, 
  insertContactSchema, 
  insertCompanySchema, 
  insertDealSchema, 
  insertPipelineStageSchema, 
  insertLeadSchema, 
  insertAreaOfActivitySchema, 
  insertContactEmailSchema, 
  insertBranchSchema,
  areasOfActivity  // Importiamo la tabella areasOfActivity
} from '../shared/schema';
import { 
  listLeads, 
  getLead, 
  createLead, 
  updateLead, 
  deleteLead, 
  convertLead 
} from './controllers/leadController.js';
import branchRoutes from './branchRoutes';
import mockEmailRoutes from './mockEmailRoutes';
import emailModuleRoutes from './routes/emailRoutes';
import importExportRoutes from './routes/import-export';
import debugConsoleRouter from './modules/debug-console';
import testDataRouter from './routes/test-data';
import { getSectors, createSector } from './controllers/sectorController';
import { getSubSectors, createSubSector } from './controllers/subSectorController';
import { getJobTitles, getJobTitle, createJobTitle, updateJobTitle, deleteJobTitle } from './controllers/jobTitleController';

// Chiave segreta per JWT
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';

// Middleware di autenticazione - DEVELOPMENT MODE ENABLED
export const authenticate = (req: any, res: any, next: any) => {
  // DEVELOPMENT MODE: Per test e sviluppo, l'autenticazione è sempre consentita
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH DEBUG] Autenticazione bypassata in modalità sviluppo');
    
    // Usa sempre un token hardcoded per l'utente di sviluppo
    // Questo garantisce che anche se il database non è disponibile, l'utente può comunque accedere
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@experviser.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };
    
    // Salta completamente la verifica del database
    return next();
  }

  // In PRODUCTION continua con la verifica del token
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Autenticazione richiesta' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token non valido' });
  }
};

// Middleware di autenticazione JWT - SEMPRE ABILITATO IN SVILUPPO
export const authenticateJWT = (req: any, res: any, next: any) => {
  // BYPASS TOTALE: in modalità development garantiamo l'autenticazione
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH DEBUG] Autenticazione JWT bypassata in modalità sviluppo');
    
    // Utente di debug predefinito
    const debugUser = {
      id: 1,
      username: 'admin',
      email: 'admin@experviser.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };
    
    req.user = debugUser;
    return next();
  }

  // Solo in PRODUCTION verifichiamo il token
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Autenticazione richiesta' });
  }

  try {
    // Verifica il token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token non valido' });
  }
};

// Middleware per verificare i ruoli admin
export const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Accesso negato. Richiesti privilegi di amministratore.' });
  }
  next();
};

// Middleware per verificare il ruolo super admin
export const isSuperAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Accesso negato. Richiesti privilegi di super amministratore.' });
  }
  next();
};

// Interfaccia per la richiesta Express
interface Request {
  user?: any;
  cookies?: {
    token?: string;
  };
  headers: {
    authorization?: string;
  };
  params: {
    [key: string]: string;
  };
  query: {
    [key: string]: string;
  };
  body: any;
}

// Interfaccia per la risposta Express
interface Response {
  status(code: number): Response;
  json(data: any): void;
  clearCookie(name: string): Response;
  cookie(name: string, value: string, options: any): Response;
  redirect(url: string): void;
}

export function registerRoutes(app: any) {
  
  // --- STATISTICHE E DATI RECENTI ---
  
  // Ottieni statistiche per la dashboard
  app.get('/api/stats/overview', authenticateJWT, async (req: Request, res: Response) => {
    try {
      // Ottieni i conteggi attuali
      const contactsCount = await storage.getContactsCount();
      const companiesCount = await storage.getCompaniesCount();
      const dealsCount = await storage.getDealsCount({ status: 'active' });
      const leadsCount = await storage.getLeadsCount();
      const synergiesCount = await storage.getSynergiesCount();
      const branchesCount = await storage.getBranchesCount();
      
      // Per ora simuliamo il conteggio delle attività
      const upcomingTasksCount = 8;
      const overdueTasksCount = 3;
      
      // Percentuali di cambiamento (simulati per ora)
      const stats = {
        contacts: {
          count: contactsCount,
          percentChange: 5.2
        },
        companies: {
          count: companiesCount,
          percentChange: 2.8
        },
        deals: {
          count: dealsCount,
          percentChange: -1.5
        },
        leads: {
          count: leadsCount,
          percentChange: 8.4
        },
        synergies: {
          count: synergiesCount,
          percentChange: 10.0
        },
        branches: {
          count: branchesCount,
          percentChange: 3.5
        },
        tasks: {
          upcomingCount: upcomingTasksCount,
          overdueCount: overdueTasksCount
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle statistiche' });
    }
  });
  
  // Ottieni opportunità recenti
  app.get('/api/deals/recent', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const recentDeals = await storage.getRecentDeals(5);
      res.json(recentDeals);
    } catch (error) {
      console.error('Error fetching recent deals:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle opportunità recenti' });
    }
  });
  
  // Ottieni contatti recenti
  app.get('/api/contacts/recent', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const recentContacts = await storage.getRecentContacts(5);
      res.json(recentContacts);
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei contatti recenti' });
    }
  });
  
  // Ottieni attività recenti (simulato per ora)
  app.get('/api/activities/recent', authenticate, async (req: Request, res: Response) => {
    try {
      // Simuliamo alcune attività recenti
      const recentActivities = [
        {
          id: 1,
          title: 'Email inviata a Rossi Srl',
          description: 'Promemoria per il meeting di lunedì',
          type: 'email',
          createdAt: new Date(Date.now() - 3600000) // 1 ora fa
        },
        {
          id: 2,
          title: 'Meeting con Mario Bianchi',
          description: 'Discussione sul nuovo progetto',
          type: 'meeting',
          createdAt: new Date(Date.now() - 86400000) // 1 giorno fa
        },
        {
          id: 3,
          title: 'Telefonata a Luisa Verdi',
          description: 'Follow-up dopo la presentazione',
          type: 'call',
          createdAt: new Date(Date.now() - 172800000) // 2 giorni fa
        }
      ];
      
      res.json(recentActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle attività recenti' });
    }
  });
  // --- AUTH ROUTES ---
  
  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      // Supporto per entrambi i formati (sia username che email)
      const username = req.body.username || req.body.email;
      const { password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username/Email e password sono richiesti' });
      }
      
      // In modalità sviluppo, bypass dell'autenticazione per qualsiasi credenziale
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH DEBUG] Login automatico in modalità sviluppo per l'utente: ${username}`);
        
        // Utente di debug predefinito
        const debugUser = {
          id: 1,
          username: username,
          email: 'admin@experviser.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'super_admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };
        
        // Crea il token JWT
        const token = jwt.sign(
          { id: debugUser.id, username: debugUser.username, role: debugUser.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // Imposta il token come cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000 // 24 ore
        });
        
        // Restituisci i dati utente simulati
        return res.json({
          user: debugUser,
          token
        });
      }
      
      // In produzione, autenticazione normale
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: 'Credenziali non valide' });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Credenziali non valide' });
      }
      
      // Aggiorna l'ultimo accesso
      await storage.updateUser(user.id, {
        lastLogin: new Date()
      });
      
      // Crea il token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Imposta il token come cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 ore
      });
      
      // Restituisci i dati utente (senza la password)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Se c'è un errore ma siamo in modalità sviluppo, login di emergenza
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH DEBUG] Login di emergenza attivato dopo errore');
        
        // Utente di debug predefinito
        const debugUser = {
          id: 1,
          username: 'admin',
          email: 'admin@experviser.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'super_admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };
        
        // Crea il token JWT
        const token = jwt.sign(
          { id: debugUser.id, username: debugUser.username, role: debugUser.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // Imposta il token come cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000 // 24 ore
        });
        
        // Restituisci i dati utente simulati
        return res.json({
          user: debugUser,
          token
        });
      }
      
      res.status(500).json({ message: 'Errore durante il login' });
    }
  });
  
  // Verifica dello stato di autenticazione
  app.get('/api/auth/status', authenticate, (req, res) => {
    res.json({ authenticated: true, user: req.user });
  });
  
  // Ottieni dati utente corrente
  app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      
      // Rimuovi la password dalla risposta
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ message: 'Errore durante il recupero dati utente' });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout effettuato con successo' });
  });
  
  // --- USER ROUTES ---
  
  // Ottieni tutti gli utenti (solo admin)
  app.get('/api/users', authenticate, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Rimuovi le password dai dati
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Errore durante il recupero degli utenti' });
    }
  });
  
  // Ottieni singolo utente (l'utente può vedere solo se stesso, admin possono vedere tutti)
  app.get('/api/users/:id', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verifica se l'utente è autorizzato
      if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Non autorizzato a visualizzare questo utente' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      
      // Rimuovi la password
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Errore durante il recupero dell\'utente' });
    }
  });
  
  // Crea un nuovo utente (solo admin)
  app.post('/api/users', authenticate, isAdmin, async (req, res) => {
    try {
      // Validazione dello schema
      const userSchema = insertUserSchema.extend({
        password: z.string().min(6, 'La password deve contenere almeno 6 caratteri')
      });
      
      const validatedData = userSchema.parse(req.body);
      
      // Verifica se l'username è già in uso
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username già in uso' });
      }
      
      // Hash della password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Crea l'utente
      const newUser = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: validatedData.role || 'user',
        status: validatedData.status || 'active',
        createdAt: new Date(),
      });
      
      // Rimuovi la password dalla risposta
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Errore durante la creazione dell\'utente' });
      }
    }
  });
  
  // Aggiorna un utente
  app.put('/api/users/:id', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verifica se l'utente è autorizzato (può modificare solo se stesso o, se admin, tutti)
      if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Non autorizzato a modificare questo utente' });
      }
      
      // Un utente normale non può modificare il proprio ruolo o status
      if (req.user.id === userId && (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        if (req.body.role || req.body.status) {
          return res.status(403).json({ message: 'Non autorizzato a modificare ruolo o status' });
        }
      }
      
      // Solo i super admin possono promuovere a super admin
      if (req.body.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo i super admin possono promuovere a super admin' });
      }
      
      // Verifica se l'utente esiste
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      
      // Se viene fornita una nuova password, hash
      let updatedData: any = { ...req.body };
      if (updatedData.password) {
        updatedData.password = await bcrypt.hash(updatedData.password, 10);
      }
      
      // Aggiorna l'utente
      const updatedUser = await storage.updateUser(userId, updatedData);
      
      // Rimuovi la password dalla risposta
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'utente' });
    }
  });
  
  // Elimina un utente (solo admin)
  app.delete('/api/users/:id', authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verifica se l'utente esiste
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      
      // Un admin non può eliminare un super admin
      if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Non autorizzato a eliminare un super admin' });
      }
      
      // Elimina l'utente
      await storage.deleteUser(userId);
      
      res.json({ message: 'Utente eliminato con successo' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'utente' });
    }
  });
  
  // --- CONTACT ROUTES ---
  
  // Ottieni tutti i contatti
  app.get('/api/contacts', authenticate, async (req, res) => {
    try {
      console.log("API /api/contacts: retrieving contacts from storage");
      
      // Verifico se è richiesto il filtro per contatti non associati e ricerca
      const unassignedOnly = req.query.unassigned === 'true';
      const searchQuery = req.query.search ? String(req.query.search) : '';
      
      console.log(`API /api/contacts: filtering options - unassigned: ${unassignedOnly}, search: "${searchQuery}"`);
      
      if (unassignedOnly) {
        console.log("API /api/contacts: filtering for unassigned contacts only");
        const unassignedContacts = await storage.getUnassignedContacts(searchQuery);
        console.log(`API /api/contacts: found ${unassignedContacts.length} unassigned contacts for search: "${searchQuery || 'none'}"`);
        return res.json(unassignedContacts);
      }
      
      // Comportamento standard: restituisci tutti i contatti
      const contacts = await storage.getContacts(); // Cambiato getAllContacts con getContacts
      console.log(`API /api/contacts: found ${contacts.length} contacts in storage`);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei contatti' });
    }
  });
  
  // Ottieni un singolo contatto
  app.get('/api/contacts/:id', async (req, res) => { // Rimosso authenticate temporaneamente per il debug
    try {
      const contactId = parseInt(req.params.id);
      console.log(`API endpoint /api/contacts/:id called with id: ${contactId}, type: ${typeof contactId}`);
      
      // Verifica con raw SQL
      try {
        const sqlResult = await pool.query(
          'SELECT id, first_name, last_name FROM contacts WHERE id = $1',
          [contactId]
        );
        console.log(`API Direct SQL check for contact ${contactId}:`, sqlResult.rows);
      } catch (sqlError) {
        console.error(`API SQL Error for contact ${contactId}:`, sqlError);
      }
      
      const contact = await storage.getContact(contactId);
      console.log(`API result from storage.getContact(${contactId}):`, contact);
      
      if (!contact) {
        console.log(`API Contact with id ${contactId} not found`);
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: 'Errore durante il recupero del contatto' });
    }
  });
  
  // Crea un nuovo contatto
  app.post('/api/contacts', authenticate, async (req, res) => {
    try {
      // Validazione dello schema
      const validatedData = insertContactSchema.parse(req.body);
      
      console.log('POST /api/contacts - Dati validati:', validatedData);
      
      let companyId = null;
      let companyData = null;
      
      // Verifica se è stato fornito un companyId
      if (req.body.companyId) {
        companyId = parseInt(req.body.companyId);
        console.log(`Verifico esistenza azienda con ID: ${companyId}`);
        
        // Controlla se esiste l'azienda prima di creare il contatto
        companyData = await storage.getCompany(companyId);
        if (!companyData) {
          console.error(`Azienda ${companyId} non trovata`);
          return res.status(404).json({ message: `Azienda con ID ${companyId} non trovata` });
        }
        
        console.log(`Azienda trovata: ${companyData.name}`);
      }
      
      // Crea il contatto
      const newContact = await storage.createContact({
        ...validatedData,
        status: validatedData.status || 'active'
      });
      
      console.log(`Contatto creato con ID: ${newContact.id}`);
      
      // Se abbiamo un'azienda valida, creiamo l'area di attività
      if (companyId && companyData) {
        console.log(`Creazione area di attività per contatto ${newContact.id} e azienda ${companyId}`);
        
        try {
          // Approccio 1: Utilizzo di storage.createAreaOfActivity
          console.log("Approccio 1: Utilizzo di storage.createAreaOfActivity");
          const area = await storage.createAreaOfActivity({
            contactId: newContact.id,
            companyId: companyId,
            companyName: companyData.name,
            isPrimary: true,
            role: req.body.role || null,
            jobDescription: req.body.jobDescription || null
          });
          
          console.log(`Area di attività creata con ID: ${area.id}`);
          
          // Aggiungi l'area al contatto restituito
          newContact.areasOfActivity = [area];
          
          // Verifica che l'area sia stata creata correttamente
          const verifyResult = await pool.query(
            'SELECT * FROM areas_of_activity WHERE contact_id = $1 AND company_id = $2',
            [newContact.id, companyId]
          );
          
          if (verifyResult.rows && verifyResult.rows.length > 0) {
            console.log(`✅ Verifica automatica: area di attività trovata nel database`);
          } else {
            console.error(`❌ Verifica automatica: area di attività NON trovata nel database!`);
            throw new Error("Area di attività non trovata dopo la creazione");
          }
        } catch (areaError) {
          console.error(`Errore nel primo approccio: ${areaError}`);
          
          try {
            // Approccio 2: Query SQL diretta
            console.log("Approccio 2: Query SQL diretta");
            const areaResult = await pool.query(
              `INSERT INTO areas_of_activity 
               (contact_id, company_id, company_name, is_primary, role, job_description, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
               RETURNING *`,
              [
                newContact.id,
                companyId,
                companyData.name,
                true,
                req.body.role || '',
                req.body.jobDescription || ''
              ]
            );
            
            if (areaResult.rows && areaResult.rows.length > 0) {
              const area = areaResult.rows[0];
              console.log(`Area di attività creata con SQL diretta, ID: ${area.id}`);
              
              // Mappiamo i nomi delle colonne in camelCase per il frontend
              const mappedArea = {
                id: area.id,
                contactId: area.contact_id,
                companyId: area.company_id,
                companyName: area.company_name,
                isPrimary: area.is_primary,
                role: area.role,
                jobDescription: area.job_description,
                createdAt: area.created_at,
                updatedAt: area.updated_at
              };
              
              // Aggiungi l'area al contatto restituito
              newContact.areasOfActivity = [mappedArea];
            } else {
              throw new Error("Nessun risultato dall'inserimento SQL diretto");
            }
          } catch (sqlError) {
            console.error(`Errore nel secondo approccio: ${sqlError}`);
            
            try {
              // Approccio 3: Scrittura direttamente sulla connessione del pool
              console.log("Approccio 3: Query con client dedicato");
              
              // Ottieni un client dedicato dal pool per una transazione
              const client = await pool.connect();
              
              try {
                await client.query('BEGIN');
                
                const areaResult = await client.query(
                  `INSERT INTO areas_of_activity 
                   (contact_id, company_id, company_name, is_primary, created_at, updated_at) 
                   VALUES ($1, $2, $3, $4, NOW(), NOW()) 
                   RETURNING id`,
                  [newContact.id, companyId, companyData.name, true]
                );
                
                if (areaResult.rows && areaResult.rows.length > 0) {
                  console.log(`✅ Approccio 3 riuscito, area ID: ${areaResult.rows[0].id}`);
                  await client.query('COMMIT');
                } else {
                  await client.query('ROLLBACK');
                  throw new Error("Nessun risultato dall'inserimento con client dedicato");
                }
              } catch (transactionError) {
                await client.query('ROLLBACK');
                throw transactionError;
              } finally {
                client.release();
              }
            } catch (finalError) {
              console.error(`Tutti gli approcci falliti: ${finalError}`);
            }
          }
        }
      }
      
      res.status(201).json(newContact);
    } catch (error) {
      console.error('Error creating contact:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Errore durante la creazione del contatto' });
      }
    }
  });
  
  // Aggiorna un contatto
  app.put('/api/contacts/:id', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      // Aggiorna il contatto
      const updatedContact = await storage.updateContact(contactId, req.body);
      
      res.json(updatedContact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento del contatto' });
    }
  });
  
  // Aggiorna un contatto (supporto PATCH)
  app.patch('/api/contacts/:id', authenticate, async (req, res) => {
    try {
      console.log('PATCH /api/contacts/:id - Richiesta aggiornamento contatto', req.params.id);
      const contactId = parseInt(req.params.id);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      console.log('PATCH /api/contacts/:id - Dati ricevuti:', req.body);
      
      // Aggiorna il contatto
      const updatedContact = await storage.updateContact(contactId, req.body);
      
      console.log('PATCH /api/contacts/:id - Contatto aggiornato con successo');
      res.json(updatedContact);
    } catch (error) {
      console.error('Error updating contact (PATCH):', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento del contatto' });
    }
  });
  
  // Elimina un contatto
  app.delete('/api/contacts/:id', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      // Elimina il contatto
      await storage.deleteContact(contactId);
      
      res.json({ message: 'Contatto eliminato con successo' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione del contatto' });
    }
  });
  
  // --- CONTACT EMAIL ROUTES ---
  
  // Ottieni tutte le email di un contatto
  app.get('/api/contacts/:contactId/emails', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      const emails = await storage.getContactEmails(contactId);
      res.json(emails);
    } catch (error) {
      console.error('Error fetching contact emails:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle email del contatto' });
    }
  });
  
  // Ottieni una singola email di contatto
  app.get('/api/contact-emails/:id', authenticate, async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const email = await storage.getContactEmail(emailId);
      
      if (!email) {
        return res.status(404).json({ message: 'Email non trovata' });
      }
      
      res.json(email);
    } catch (error) {
      console.error('Error fetching contact email:', error);
      res.status(500).json({ message: 'Errore durante il recupero dell\'email' });
    }
  });
  
  // Ottieni l'email primaria di un contatto
  app.get('/api/contacts/:contactId/primary-email', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      const primaryEmail = await storage.getPrimaryContactEmail(contactId);
      
      if (!primaryEmail) {
        return res.status(404).json({ message: 'Nessuna email primaria trovata per questo contatto' });
      }
      
      res.json(primaryEmail);
    } catch (error) {
      console.error('Error fetching primary contact email:', error);
      res.status(500).json({ message: 'Errore durante il recupero dell\'email primaria' });
    }
  });
  
  // Crea una nuova email per un contatto
  app.post('/api/contacts/:contactId/emails', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      // Validazione dello schema
      const validatedData = insertContactEmailSchema.parse({
        ...req.body,
        contactId
      });
      
      // Crea l'email
      const newEmail = await storage.createContactEmail(validatedData);
      
      res.status(201).json(newEmail);
    } catch (error: unknown) {
      console.error('Error creating contact email:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dati email non validi', errors: error.errors });
      }
      res.status(500).json({ message: 'Errore durante la creazione dell\'email' });
    }
  });
  
  // Aggiorna un'email di contatto
  app.put('/api/contact-emails/:id', authenticate, async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      
      // Verifica se l'email esiste
      const email = await storage.getContactEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: 'Email non trovata' });
      }
      
      // Aggiorna l'email
      const updatedEmail = await storage.updateContactEmail(emailId, req.body);
      
      res.json(updatedEmail);
    } catch (error) {
      console.error('Error updating contact email:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'email' });
    }
  });
  
  // Imposta un'email come primaria
  app.put('/api/contact-emails/:id/set-primary', authenticate, async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      
      // Verifica se l'email esiste
      const email = await storage.getContactEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: 'Email non trovata' });
      }
      
      // Imposta come primaria
      const updatedEmail = await storage.setContactEmailAsPrimary(emailId);
      
      res.json(updatedEmail);
    } catch (error) {
      console.error('Error setting primary email:', error);
      res.status(500).json({ message: 'Errore durante l\'impostazione dell\'email primaria' });
    }
  });
  
  // Elimina un'email di contatto
  app.delete('/api/contact-emails/:id', authenticate, async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      
      // Elimina l'email
      const success = await storage.deleteContactEmail(emailId);
      
      if (!success) {
        return res.status(404).json({ message: 'Email non trovata' });
      }
      
      res.json({ message: 'Email eliminata con successo' });
    } catch (error) {
      console.error('Error deleting contact email:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'email' });
    }
  });
  
  // --- COMPANY ROUTES ---
  
  // Ottieni tutte le aziende
  app.get('/api/companies', authenticate, async (req, res) => {
    try {
      console.log("API /api/companies: retrieving companies from storage");
      const companies = await storage.getCompanies(); // Cambiato getAllCompanies con getCompanies
      console.log(`API /api/companies: found ${companies.length} companies in storage`);
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle aziende' });
    }
  });
  
  // Ottieni una singola azienda
  app.get('/api/companies/:id', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ message: 'Errore durante il recupero dell\'azienda' });
    }
  });
  
  // Crea una nuova azienda
  app.post('/api/companies', authenticate, async (req, res) => {
    try {
      // Validazione dello schema
      const validatedData = insertCompanySchema.parse(req.body);
      
      // Crea l'azienda
      const newCompany = await storage.createCompany({
        ...validatedData,
        status: validatedData.status || 'active'
      });
      
      res.status(201).json(newCompany);
    } catch (error) {
      console.error('Error creating company:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Errore durante la creazione dell\'azienda' });
      }
    }
  });
  
  // Aggiorna un'azienda (metodo PUT)
  app.put('/api/companies/:id', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Verifica se l'azienda esiste
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      // Aggiorna l'azienda
      const updatedCompany = await storage.updateCompany(companyId, req.body);
      
      res.json(updatedCompany);
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'azienda' });
    }
  });
  
  // Aggiorna parzialmente un'azienda (metodo PATCH, più indicato per aggiornamenti parziali)
  app.patch('/api/companies/:id', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Log diagnostico per problemi di aggiornamento
      console.log("PATCH companies: aggiornamento azienda richiesto con ID", companyId);
      console.log("PATCH companies: dati ricevuti per l'aggiornamento:", req.body);
      
      // Verifica se l'azienda esiste
      const company = await storage.getCompany(companyId);
      if (!company) {
        console.log("PATCH companies: azienda non trovata con ID", companyId);
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      // Aggiorna l'azienda
      const updatedCompany = await storage.updateCompany(companyId, req.body);
      
      console.log("PATCH companies: azienda aggiornata con successo, nuovi dati:", updatedCompany);
      res.json(updatedCompany);
    } catch (error) {
      console.error('PATCH companies: errore durante aggiornamento azienda:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'azienda' });
    }
  });
  
  // Elimina un'azienda
  app.delete('/api/companies/:id', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Verifica se l'azienda esiste
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      // Elimina l'azienda
      await storage.deleteCompany(companyId);
      
      res.json({ message: 'Azienda eliminata con successo' });
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'azienda' });
    }
  });
  
  // Endpoint standardizzato per ricevere i contatti di un'azienda
  app.get('/api/companies/:id/contacts', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      console.log(`API: Fetching contacts for company ${companyId}`);
      
      // Usa l'approccio più semplice e diretto:
      // 1. Prima ottiene tutti gli ID dei contatti associati all'azienda tramite aree di attività
      const queryAreas = {
        text: "SELECT contact_id FROM areas_of_activity WHERE company_id = $1",
        values: [companyId]
      };
      
      const areasResult = await pool.query(queryAreas);
      console.log(`Found ${areasResult.rows.length} areas for company ${companyId}`);
      
      if (areasResult.rows.length === 0) {
        return res.json([]);
      }
      
      // Estrae gli ID dei contatti
      const contactIds = areasResult.rows.map(row => row.contact_id);
      console.log(`Contact IDs for company ${companyId}:`, contactIds);
      
      // 2. Poi recupera i dettagli di quei contatti in una sola query
      const contactsQuery = {
        text: `
          SELECT 
            id, 
            first_name AS "firstName", 
            last_name AS "lastName", 
            status, 
            company_email AS "companyEmail", 
            private_email AS "privateEmail", 
            mobile_phone AS "mobilePhone",
            office_phone AS "officePhone",
            linkedin,
            tags,
            notes
          FROM contacts 
          WHERE id = ANY($1)
        `,
        values: [contactIds]
      };
      
      const contactsResult = await pool.query(contactsQuery);
      console.log(`Retrieved ${contactsResult.rows.length} contacts for company ${companyId}`);
      
      res.json(contactsResult.rows);
    } catch (error) {
      console.error(`Error fetching contacts for company:`, error);
      res.status(500).json({ message: 'Errore durante il recupero dei contatti dell\'azienda' });
    }
  });
  
  // Endpoint per recuperare i deal associati a un'azienda
  app.get('/api/companies/:id/deals', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      console.log(`API: Fetching deals for company ${companyId}`);
      
      // Query per ottenere tutti i deal associati a questa azienda
      const dealsQuery = {
        text: `
          SELECT 
            d.id, 
            d.name,
            d.notes,
            d.value,
            d.status,
            d.stage_id AS "stageId",
            d.expected_close_date AS "expectedCloseDate",
            d.contact_id AS "contactId",
            d.company_id AS "companyId",
            d.branch_id AS "branchId",
            d.tags,
            d.created_at AS "createdAt",
            d.updated_at AS "updatedAt",
            ps.name AS "stageName",
            COALESCE(c.first_name || ' ' || c.last_name, '') AS "contactName"
          FROM deals d
          LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
          LEFT JOIN contacts c ON d.contact_id = c.id
          WHERE d.company_id = $1 AND d.status = 'active'
          ORDER BY d.updated_at DESC
        `,
        values: [companyId]
      };
      
      const dealsResult = await pool.query(dealsQuery);
      console.log(`Retrieved ${dealsResult.rows.length} deals for company ${companyId}`);
      
      res.json(dealsResult.rows);
    } catch (error) {
      console.error('Error fetching company deals:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle opportunità dell\'azienda' });
    }
  });
  
  // Manteniamo anche la versione v2 per retrocompatibilità
  app.get('/api/v2/companies/:id/contacts', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      console.log(`ENDPOINT V2: Fetching contacts for company ${companyId}`);
      
      // Usa l'approccio più semplice e diretto:
      // 1. Prima ottiene tutti gli ID dei contatti associati all'azienda
      const queryAreas = {
        text: "SELECT contact_id FROM areas_of_activity WHERE company_id = $1",
        values: [companyId]
      };
      
      const areasResult = await pool.query(queryAreas);
      console.log(`Found ${areasResult.rows.length} areas for company ${companyId}`);
      
      if (areasResult.rows.length === 0) {
        return res.json([]);
      }
      
      // Estrae gli ID dei contatti
      const contactIds = areasResult.rows.map(row => row.contact_id);
      console.log(`Contact IDs for company ${companyId}:`, contactIds);
      
      // 2. Poi recupera i dettagli di quei contatti in una sola query
      const contactsQuery = {
        text: `
          SELECT 
            id, 
            first_name AS "firstName", 
            last_name AS "lastName", 
            status, 
            company_email AS "companyEmail", 
            private_email AS "privateEmail", 
            mobile_phone AS "mobilePhone"
          FROM contacts 
          WHERE id = ANY($1::int[])
          ORDER BY first_name, last_name
        `,
        values: [contactIds]
      };
      
      const contactsResult = await pool.query(contactsQuery);
      const contacts = contactsResult.rows;
      
      console.log(`ENDPOINT V2: Retrieved ${contacts.length} contacts for company ${companyId}`);
      return res.json(contacts);
    } catch (error) {
      console.error('Error in contact retrieval:', error);
      res.status(500).json({ 
        message: 'Errore durante il recupero dei contatti dell\'azienda',
        error: error.message
      });
    }
  });

  // Endpoint di debug - ottieni i contatti associati ad un'azienda con SQL diretto
  app.get('/api/debug/companies/:id/contacts', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      console.log(`DEBUG: Fetching contacts for company ${companyId}`);
      
      // Primo approccio: Query diretta con pg client
      const query = `
        SELECT 
          a.id as area_id, 
          a.contact_id, 
          a.company_id,
          a.company_name,
          a.is_primary,
          c.id as contact_id,
          c.first_name,
          c.last_name,
          c.company_email
        FROM areas_of_activity a
        LEFT JOIN contacts c ON a.contact_id = c.id
        WHERE a.company_id = $1
      `;
      
      // Usa la query preparata con parametri
      const result = await pool.query(query, [companyId]);
      
      console.log(`DEBUG: Query result:`, result.rows);
      
      res.json({
        success: true, 
        count: result.rows.length,
        data: result.rows
      });
    } catch (error) {
      console.error('Debug Error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Errore durante l\'esecuzione della query di debug',
        error: error.message 
      });
    }
  });
  
  // Imposta il contatto primario per un'azienda
  app.patch('/api/companies/:id/primary-contact', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      let { primaryContactId } = req.body;
      // Forziamo il cast a intero, in modo da non ricevere stringhe
      primaryContactId = primaryContactId !== undefined
        ? parseInt(primaryContactId, 10)
        : null;
      
      console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Ricevuta richiesta da ${req.ip} di impostazione contatto primario per azienda ${companyId}:`, req.body);
      
      // Verifica se l'azienda esiste
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Azienda ${companyId} non trovata`);
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      // Preparazione del valore di primary_contact_id
      let primary_contact_id = null;
      
      // Se primaryContactId è fornito, verifica che il contatto esista
      if (primaryContactId) {
        console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** primaryContactId fornito:`, primaryContactId, `tipo:`, typeof primaryContactId);
        let contactId;
        
        // Gestione esplicita sia di stringhe che di numeri
        if (typeof primaryContactId === 'string') {
          contactId = parseInt(primaryContactId, 10);
        } else if (typeof primaryContactId === 'number') {
          contactId = primaryContactId;
        } else {
          console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Formato primaryContactId non valido`);
          return res.status(400).json({ message: 'Formato ID contatto non valido' });
        }
        
        if (isNaN(contactId)) {
          console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** ID contatto non è un numero valido`);
          return res.status(400).json({ message: 'ID contatto non è un numero valido' });
        }
        
        console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** contactId dopo conversione:`, contactId, `tipo:`, typeof contactId);
        
        const contact = await storage.getContact(contactId);
        console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Dettagli contatto:`, contact ? `ID ${contact.id}, Nome: ${contact.firstName} ${contact.lastName}` : 'Contatto non trovato');
        
        if (!contact) {
          console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Contatto ${contactId} non trovato`);
          return res.status(404).json({ message: 'Contatto non trovato' });
        }
        
        primary_contact_id = contactId;
      }
      
      console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Stato dell'azienda PRIMA dell'aggiornamento:`, {
        id: company.id,
        name: company.name,
        primary_contact_id: company.primary_contact_id
      });
      
      // Aggiorna l'azienda utilizzando direttamente una query SQL nativa
      try {
        const query = `
          UPDATE companies 
          SET primary_contact_id = $1, updated_at = NOW() 
          WHERE id = $2 
          RETURNING id, name, primary_contact_id
        `;
        
        const result = await pool.query(query, [primary_contact_id, companyId]);
        
        if (result.rows.length === 0) {
          console.error('***DIAGNOSTICA CONTATTO PRIMARIO*** Nessuna riga aggiornata');
          return res.status(404).json({ message: 'Azienda non trovata o aggiornamento fallito' });
        }
        
        const updatedCompany = result.rows[0];
        console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Risultato diretto della query SQL:`, updatedCompany);
        
        // Verifica immediata dal database con una nuova query per confermare la persistenza
        const verifyQuery = `
          SELECT id, name, primary_contact_id FROM companies WHERE id = $1
        `;
        const verifyResult = await pool.query(verifyQuery, [companyId]);
        
        if (verifyResult.rows.length > 0) {
          console.log(`***DIAGNOSTICA CONTATTO PRIMARIO*** Verifica dal database dopo l'aggiornamento:`, verifyResult.rows[0]);
        }
        
        res.json(updatedCompany);
      } catch (dbError) {
        console.error('***DIAGNOSTICA CONTATTO PRIMARIO*** Errore database:', dbError);
        res.status(500).json({ message: 'Errore database durante l\'aggiornamento' });
      }
    } catch (error) {
      console.error('***DIAGNOSTICA CONTATTO PRIMARIO*** Error setting primary contact:', error);
      res.status(500).json({ message: 'Errore durante l\'impostazione del contatto primario' });
    }
  });
  
  // --- LEAD ROUTES ---
  
  // Lead CRUD + conversion 
  // Registra le rotte dei lead usando il controller dedicato
  app.get('/api/leads', authenticate, listLeads);
  app.get('/api/leads/:id', authenticate, getLead);
  app.post('/api/leads', authenticate, createLead);
  app.patch('/api/leads/:id', authenticate, updateLead);
  app.delete('/api/leads/:id', authenticate, deleteLead);
  app.post('/api/leads/:id/convert', authenticate, convertLead);
  
  // --- DEAL ROUTES ---
  
  // Ottieni tutti i deal
  app.get('/api/deals', authenticate, async (req, res) => {
    try {
      const { status } = req.query;
      // Filtra i deals in base allo status (se specificato)
      const deals = status 
        ? await storage.getDealsWithFilters({ status: status as string }) 
        : await storage.getDealsWithFilters({ status: 'active' }); // Default a 'active'
      
      res.json(deals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei deal' });
    }
  });
  
  // Ottieni un singolo deal - implementazione debug
  app.get('/api/deals/:id', authenticateJWT, async (req, res) => {
    console.log('=====================================================');
    console.log(`[DEAL DEBUG] API endpoint /api/deals/${req.params.id} è stato chiamato`);
    console.log('=====================================================');

    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        console.log(`[DEAL DEBUG] ID deal non valido: ${req.params.id}`);
        return res.status(400).json({ message: 'ID deal non valido' });
      }
      
      // Utilizziamo il pool già importato all'inizio del file
      console.log(`[DEAL DEBUG] Fetching deal with id ${dealId} using direct SQL`);
      
      // Query per il deal
      const dealResult = await pool.query(`
        SELECT * FROM deals 
        WHERE id = $1
      `, [dealId]);
      
      if (dealResult.rows.length === 0) {
        console.log(`[DEAL DEBUG] Deal with id ${dealId} not found in database`);
        return res.status(404).json({ message: 'Deal non trovato' });
      }
      
      console.log(`[DEAL DEBUG] Deal found in database:`, JSON.stringify(dealResult.rows[0]));
      
      const deal = dealResult.rows[0];
      
      // Convertiamo in camelCase
      const dealData = {
        id: deal.id,
        name: deal.name,
        value: deal.value,
        stageId: deal.stage_id,
        contactId: deal.contact_id,
        companyId: deal.company_id,
        expectedCloseDate: deal.expected_close_date,
        notes: deal.notes,
        tags: deal.tags,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        status: deal.status,
        lastContactedAt: deal.last_contacted_at,
        nextFollowUpAt: deal.next_follow_up_at,
        branchId: deal.branch_id
      };
      
      // Ottieni informazioni di contatto
      let contactData = null;
      if (dealData.contactId) {
        const contactResult = await pool.query(`
          SELECT * FROM contacts WHERE id = $1
        `, [dealData.contactId]);
        
        if (contactResult.rows.length > 0) {
          const contact = contactResult.rows[0];
          // Convertiamo in camelCase
          contactData = {
            id: contact.id,
            firstName: contact.first_name,
            lastName: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            status: contact.status
          };
          console.log(`[DEAL DEBUG] Contact data found:`, JSON.stringify(contactData));
        }
      }
      
      // Ottieni informazioni di azienda
      let companyData = null;
      if (dealData.companyId) {
        const companyResult = await pool.query(`
          SELECT * FROM companies WHERE id = $1
        `, [dealData.companyId]);
        
        if (companyResult.rows.length > 0) {
          const company = companyResult.rows[0];
          // Convertiamo in camelCase
          companyData = {
            id: company.id,
            name: company.name,
            status: company.status,
            address: company.address,
            fullAddress: company.full_address,
            email: company.email,
            phone: company.phone,
            tags: company.tags
          };
          console.log(`[DEAL DEBUG] Company data found:`, JSON.stringify(companyData));
        }
      }
      
      // Ottieni informazioni di stage
      let stageData = null;
      if (dealData.stageId) {
        const stageResult = await pool.query(`
          SELECT * FROM pipeline_stages WHERE id = $1
        `, [dealData.stageId]);
        
        if (stageResult.rows.length > 0) {
          const stage = stageResult.rows[0];
          // Convertiamo in camelCase
          stageData = {
            id: stage.id,
            name: stage.name,
            order: stage.order
          };
          console.log(`[DEAL DEBUG] Stage data found:`, JSON.stringify(stageData));
        }
      }
      
      // Assembla l'oggetto finale
      const responseData = {
        ...dealData,
        contact: contactData,
        company: companyData,
        stage: stageData
      };
      
      console.log(`[DEAL DEBUG] Sending final response:`, JSON.stringify(responseData));
      console.log('=====================================================');
      
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('[DEAL DEBUG] Error fetching deal:', error);
      console.log('=====================================================');
      return res.status(500).json({ message: 'Errore durante il recupero del deal', error: error.message });
    }
  });
  
  // Ottieni sinergie per un deal specifico (rotta alternativa per compatibilità frontend)
  app.get('/api/deals/:id/synergies', authenticate, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: 'ID opportunità non valido' });
      }
      
      const synergies = await storage.getSynergiesByDealId(dealId);
      res.json(synergies);
    } catch (error) {
      console.error('Error fetching synergies for deal:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle sinergie per l\'opportunità' });
    }
  });
  
  // Crea un nuovo deal
  app.post('/api/deals', authenticate, async (req, res) => {
    try {
      // Validazione dello schema
      const validatedData = insertDealSchema.parse(req.body);
      
      // Crea il deal
      const newDeal = await storage.createDeal({
        ...validatedData,
        status: validatedData.status || 'active'
      });
      
      res.status(201).json(newDeal);
    } catch (error) {
      console.error('Error creating deal:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Errore durante la creazione del deal' });
      }
    }
  });
  
  // Aggiorna un deal - Endpoint PUT (mantenuto per retrocompatibilità)
  app.put('/api/deals/:id', authenticate, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      
      // Verifica se il deal esiste
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: 'Deal non trovato' });
      }
      
      // Aggiorna il deal
      const updatedDeal = await storage.updateDeal(dealId, req.body);
      
      res.json(updatedDeal);
    } catch (error) {
      console.error('Error updating deal:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento del deal' });
    }
  });
  
  // Aggiorna un deal - Endpoint PATCH (implementazione moderna)
  app.patch('/api/deals/:id', authenticate, async (req, res) => {
    try {
      console.log(`PATCH /api/deals/${req.params.id} - Aggiornamento opportunità`, req.body);
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ 
          message: 'ID opportunità non valido',
          code: 'INVALID_ID' 
        });
      }
      
      // Verifica se l'opportunità esiste
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        console.log(`Opportunità con ID ${dealId} non trovata`);
        return res.status(404).json({ 
          message: 'Opportunità non trovata',
          code: 'NOT_FOUND' 
        });
      }
      
      try {
        // Validazione dei dati con Zod (schema parziale per consentire aggiornamenti parziali)
        const patchDealSchema = z.object({
          name: z.string().optional(),
          value: z.preprocess(
            (val) => {
              if (typeof val === 'string') {
                const parsed = Number(val);
                if (isNaN(parsed)) {
                  // Non è possibile gestire l'errore qui, quindi manteniamo la stringa originale
                  // che poi verrà intercettata dal validatore successivo
                  return val;
                }
                return parsed;
              }
              return val;
            },
            z.number().optional()
          ),
          stageId: z.number().optional(),
          companyId: z.number().nullable().optional(),
          contactId: z.number().nullable().optional(),
          expectedCloseDate: z.string().optional().nullable(),
          tags: z.array(z.string()).optional().nullable(),
          notes: z.string().optional().nullable(),
          status: z.string().optional()
        });
        
        // Validazione dei dati ricevuti con safeParse che non genera eccezioni
        const parseResult = patchDealSchema.safeParse(req.body);
        
        // Se la validazione fallisce, restituisce un errore dettagliato
        if (!parseResult.success) {
          console.error('Errore di validazione dati:', parseResult.error);
          return res.status(400).json({ 
            message: 'Dati non validi per l\'opportunità',
            errors: parseResult.error.errors,
            code: 'VALIDATION_ERROR'
          });
        }
        
        const validatedData = parseResult.data;
        
        // Prepara i dati per l'aggiornamento
        const updateData = { ...validatedData };
        
        // Converte il campo value in stringa se necessario (formato richiesto dal DB)
        if (updateData.value !== undefined && typeof updateData.value !== 'string') {
          updateData.value = updateData.value.toString();
        }
        
        // Aggiorna l'opportunità
        console.log(`Aggiornamento opportunità ${dealId} con dati:`, updateData);
        const updatedDeal = await storage.updateDeal(dealId, updateData);
        
        if (!updatedDeal) {
          return res.status(500).json({ 
            message: 'Impossibile aggiornare l\'opportunità',
            code: 'UPDATE_FAILED' 
          });
        }
        
        console.log(`Opportunità ${dealId} aggiornata con successo`);
        res.json({
          success: true,
          data: updatedDeal,
          message: 'Opportunità aggiornata con successo'
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('Errore di validazione dati:', validationError.errors);
          return res.status(400).json({ 
            message: 'Dati non validi per l\'opportunità', 
            errors: validationError.errors,
            code: 'VALIDATION_ERROR'
          });
        }
        throw validationError; // rilancia altri errori
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'opportunità via PATCH:', error);
      res.status(500).json({ 
        message: 'Errore durante l\'aggiornamento dell\'opportunità',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  // Elimina un deal
  app.delete('/api/deals/:id', authenticate, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      
      // Verifica se il deal esiste
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: 'Deal non trovato' });
      }
      
      // Elimina il deal
      await storage.deleteDeal(dealId);
      
      res.json({ message: 'Deal eliminato con successo' });
    } catch (error) {
      console.error('Error deleting deal:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione del deal' });
    }
  });
  
  // --- PIPELINE STAGES ROUTES ---
  
  // Ottieni tutte le fasi della pipeline
  app.get('/api/pipeline-stages', authenticate, async (req, res) => {
    try {
      const stages = await storage.getAllPipelineStages();
      res.json(stages);
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle fasi della pipeline' });
    }
  });
  
  // Ottieni una singola fase della pipeline
  app.get('/api/pipeline-stages/:id', authenticate, async (req, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const stage = await storage.getPipelineStage(stageId);
      
      if (!stage) {
        return res.status(404).json({ message: 'Fase della pipeline non trovata' });
      }
      
      res.json(stage);
    } catch (error) {
      console.error('Error fetching pipeline stage:', error);
      res.status(500).json({ message: 'Errore durante il recupero della fase della pipeline' });
    }
  });
  
  // Crea una nuova fase della pipeline (solo admin)
  app.post('/api/pipeline-stages', authenticate, isAdmin, async (req, res) => {
    try {
      // Validazione dello schema
      const validatedData = insertPipelineStageSchema.parse(req.body);
      
      // Crea la fase della pipeline
      const newStage = await storage.createPipelineStage({
        ...validatedData,
        description: validatedData.description || null,
        color: validatedData.color || null
      });
      
      res.status(201).json(newStage);
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Errore durante la creazione della fase della pipeline' });
      }
    }
  });
  
  // Aggiorna una fase della pipeline (solo admin)
  app.put('/api/pipeline-stages/:id', authenticate, isAdmin, async (req, res) => {
    try {
      const stageId = parseInt(req.params.id);
      
      // Verifica se la fase esiste
      const stage = await storage.getPipelineStage(stageId);
      if (!stage) {
        return res.status(404).json({ message: 'Fase della pipeline non trovata' });
      }
      
      // Aggiorna la fase
      const updatedStage = await storage.updatePipelineStage(stageId, req.body);
      
      res.json(updatedStage);
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento della fase della pipeline' });
    }
  });
  
  // Elimina una fase della pipeline (solo admin)
  app.delete('/api/pipeline-stages/:id', authenticate, isAdmin, async (req, res) => {
    try {
      const stageId = parseInt(req.params.id);
      
      // Verifica se la fase esiste
      const stage = await storage.getPipelineStage(stageId);
      if (!stage) {
        return res.status(404).json({ message: 'Fase della pipeline non trovata' });
      }
      
      // Verifica se ci sono deal associati a questa fase
      const dealsInStage = await storage.getDealsByStageId(stageId);
      if (dealsInStage.length > 0) {
        return res.status(400).json({
          message: 'Impossibile eliminare la fase perché ci sono deal associati ad essa',
          dealsCount: dealsInStage.length
        });
      }
      
      // Elimina la fase
      await storage.deletePipelineStage(stageId);
      
      res.json({ message: 'Fase della pipeline eliminata con successo' });
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione della fase della pipeline' });
    }
  });
  
  // --- AREAS OF ACTIVITY ROUTES (Relazioni Contatto-Azienda) ---
  
  // Ottieni tutte le aree di attività per un contatto
  app.get('/api/contacts/:id/areas-of-activity', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      // Ottieni le aree di attività
      const areas = await storage.getAreasOfActivityByContactId(contactId);
      
      res.json(areas);
    } catch (error) {
      console.error('Error fetching areas of activity:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle aree di attività' });
    }
  });
  
  // Crea una nuova area di attività (relazione contatto-azienda)
  app.post('/api/contacts/:id/areas-of-activity', authenticate, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      // Validazione dei dati
      const { companyId, role, isPrimary } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ message: 'ID azienda richiesto' });
      }
      
      // Verifica se l'azienda esiste
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      // Se questa è la relazione primaria, resetta tutte le altre a non primarie
      if (isPrimary) {
        await storage.resetPrimaryAreasOfActivity(contactId);
      }
      
      // Crea la relazione
      const areaOfActivity = await storage.createAreaOfActivity({
        contactId,
        companyId,
        companyName: company.name,
        role,
        jobDescription: req.body.jobDescription || null,
        isPrimary: isPrimary || false
      });
      
      res.status(201).json(areaOfActivity);
    } catch (error) {
      console.error('Error creating area of activity:', error);
      res.status(500).json({ message: 'Errore durante la creazione dell\'area di attività' });
    }
  });
  
  // Aggiorna un'area di attività
  app.put('/api/areas-of-activity/:id', authenticate, async (req, res) => {
    try {
      const areaId = parseInt(req.params.id);
      
      // Verifica se l'area esiste
      const area = await storage.getAreaOfActivity(areaId);
      if (!area) {
        return res.status(404).json({ message: 'Area di attività non trovata' });
      }
      
      // Se questa diventa la relazione primaria, resetta tutte le altre a non primarie
      if (req.body.isPrimary) {
        await storage.resetPrimaryAreasOfActivity(area.contactId);
      }
      
      // Aggiorna l'area
      const updatedArea = await storage.updateAreaOfActivity(areaId, req.body);
      
      res.json(updatedArea);
    } catch (error) {
      console.error('Error updating area of activity:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'area di attività' });
    }
  });
  
  // Elimina un'area di attività
  app.delete('/api/areas-of-activity/:id', authenticate, async (req, res) => {
    try {
      const areaId = parseInt(req.params.id);
      
      // Verifica se l'area esiste
      const area = await storage.getAreaOfActivity(areaId);
      if (!area) {
        return res.status(404).json({ message: 'Area di attività non trovata' });
      }
      
      // Elimina l'area
      await storage.deleteAreaOfActivity(areaId);
      
      res.json({ message: 'Area di attività eliminata con successo' });
    } catch (error) {
      console.error('Error deleting area of activity:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'area di attività' });
    }
  });
  
  // Crea una nuova area di attività (endpoint generico)
  app.post('/api/areas-of-activity', authenticate, async (req, res) => {
    try {
      console.log('Creazione area di attività con dati:', req.body);
      
      // Verifica che ci siano tutti i dati necessari
      const { contactId, companyId, companyName, role, jobDescription, isPrimary } = req.body;
      
      if (!contactId) {
        console.error('Errore: contactId mancante');
        return res.status(400).json({ message: 'ID contatto richiesto' });
      }
      
      // Verifica se il contatto esiste
      const contact = await storage.getContact(contactId);
      if (!contact) {
        console.error(`Errore: contatto ${contactId} non trovato`);
        return res.status(404).json({ message: 'Contatto non trovato' });
      }
      
      // Verifica se l'azienda esiste (se è stato fornito un companyId)
      if (companyId) {
        const company = await storage.getCompany(companyId);
        if (!company) {
          console.error(`Errore: azienda ${companyId} non trovata`);
          return res.status(404).json({ message: 'Azienda non trovata' });
        }
      }
      
      // Se questa è la relazione primaria, resetta tutte le altre a non primarie
      if (isPrimary) {
        await storage.resetPrimaryAreasOfActivity(contactId);
      }
      
      // Crea la relazione
      const areaOfActivity = await storage.createAreaOfActivity(req.body);
      
      console.log('Area di attività creata con successo:', areaOfActivity);
      res.status(201).json(areaOfActivity);
    } catch (error) {
      console.error('Error creating area of activity:', error);
      res.status(500).json({ message: 'Errore durante la creazione dell\'area di attività' });
    }
  });
  
  // --- SYNERGY ROUTES ---
  
  // Ottieni tutte le sinergie
  app.get('/api/synergies', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const synergies = await storage.getAllSynergies();
      res.json(synergies);
    } catch (error) {
      console.error('Error fetching synergies:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle sinergie' });
    }
  });
  
  // Ottieni sinergie per un contatto specifico
  app.get('/api/synergies/contact/:contactId', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: 'ID contatto non valido' });
      }
      
      const synergies = await storage.getSynergiesByContactId(contactId);
      res.json(synergies);
    } catch (error) {
      console.error('Error fetching synergies for contact:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle sinergie per il contatto' });
    }
  });
  
  // Ottieni sinergie per un'azienda specifica
  app.get('/api/synergies/company/:companyId', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'ID azienda non valido' });
      }
      
      const synergies = await storage.getSynergiesByCompanyId(companyId);
      res.json(synergies);
    } catch (error) {
      console.error('Error fetching synergies for company:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle sinergie per l\'azienda' });
    }
  });
  
  // Ottieni sinergie per un deal specifico
  app.get('/api/synergies/deal/:dealId', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: 'ID opportunità non valido' });
      }
      
      const synergies = await storage.getSynergiesByDealId(dealId);
      res.json(synergies);
    } catch (error) {
      console.error('Error fetching synergies for deal:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle sinergie per l\'opportunità' });
    }
  });
  
  // Crea una nuova sinergia
  app.post('/api/synergies', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const synergyData = req.body;
      
      // Validazione base dei dati
      if (!synergyData.contactId || !synergyData.companyId || !synergyData.type) {
        return res.status(400).json({ message: 'Dati sinergia incompleti' });
      }
      
      // NUOVA REGOLA DI BUSINESS: Le sinergie possono essere create solo nel contesto di un Deal
      if (!synergyData.dealId) {
        return res.status(403).json({ 
          message: 'Creazione sinergia non autorizzata. Le sinergie possono essere create solo nel contesto di un Deal.',
          errorCode: 'SYNERGY_CREATION_REQUIRES_DEAL'
        });
      }
      
      // Aggiunta di isActive di default a true
      synergyData.isActive = true;
      
      const newSynergy = await storage.createSynergy(synergyData);
      res.status(201).json(newSynergy);
    } catch (error) {
      console.error('Error creating synergy:', error);
      res.status(500).json({ message: 'Errore durante la creazione della sinergia' });
    }
  });
  
  // Aggiorna una sinergia esistente
  app.patch('/api/synergies/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const synergyId = parseInt(req.params.id);
      if (isNaN(synergyId)) {
        return res.status(400).json({ message: 'ID sinergia non valido' });
      }
      
      const synergyData = req.body;
      
      // Verifica che la sinergia esista
      const existingSynergy = await storage.getSynergyById(synergyId);
      if (!existingSynergy) {
        return res.status(404).json({ message: 'Sinergia non trovata' });
      }
      
      const updatedSynergy = await storage.updateSynergy(synergyId, synergyData);
      res.json(updatedSynergy);
    } catch (error) {
      console.error('Error updating synergy:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento della sinergia' });
    }
  });
  
  // Elimina una sinergia
  app.delete('/api/synergies/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const synergyId = parseInt(req.params.id);
      if (isNaN(synergyId)) {
        return res.status(400).json({ message: 'ID sinergia non valido' });
      }
      
      // Verifica che la sinergia esista
      const existingSynergy = await storage.getSynergyById(synergyId);
      if (!existingSynergy) {
        return res.status(404).json({ message: 'Sinergia non trovata' });
      }
      
      await storage.deleteSynergy(synergyId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting synergy:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione della sinergia' });
    }
  });
  
  // --- DASHBOARD ROUTES ---
  
  // Endpoint principale dashboard
  app.get('/api/dashboard', authenticate, async (req: Request, res: Response) => {
    try {
      // Ottieni conteggi utilizzando i metodi di conteggio specifici
      const contactsCount = await storage.getContactsCount();
      const companiesCount = await storage.getCompaniesCount();
      const dealsCount = await storage.getDealsCount({ status: 'active' });
      const leadsCount = await storage.getLeadsCount();
      
      // Per altre funzionalità, continua a ottenere tutti i dati
      const contacts = await storage.getAllContacts();
      const companies = await storage.getAllCompanies();
      const activeDeals = await storage.getDealsWithFilters({ status: 'active' });
      const leads = await storage.getAllLeads();
      const emails = await storage.getEmails();
      const stages = await storage.getPipelineStages();
      
      // Ottieni le attività recenti
      const activities = await storage.getActivities();
      const sortedActivities = Array.isArray(activities) ? 
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5) : 
        [];
      
      // Ottieni i prossimi meeting
      const meetings = await storage.getMeetings();
      const upcomingMeetings = Array.isArray(meetings) ? 
        meetings.filter(m => new Date(m.startTime) > new Date()).sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ).slice(0, 5) : 
        [];
      
      // Ottieni contatti recenti
      const recentContacts = contacts
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);
      
      // Raggruppa deals per pipeline stage
      const dealsByStage = stages.map(stage => {
        const stageDeals = activeDeals.filter(deal => deal.stageId === stage.id);
        const totalValue = stageDeals.reduce((sum, deal) => sum + (parseFloat(deal.value || '0') || 0), 0);
        
        return {
          stageId: stage.id,
          stageName: stage.name,
          count: stageDeals.length,
          value: totalValue,
          deals: stageDeals.slice(0, 3) // Solo 3 per evitare payload troppo grandi
        };
      });
      
      // Ottieni le tasks
      const tasks = await storage.getTasks();
      
      // Calcola le attività imminenti e in ritardo
      const currentDate = new Date();
      const upcomingTasks = Array.isArray(tasks) ? 
        tasks.filter(task => 
          !task.completed && 
          task.dueDate && 
          new Date(task.dueDate) >= currentDate
        ) : [];
      
      const overdueTasks = Array.isArray(tasks) ? 
        tasks.filter(task => 
          !task.completed && 
          task.dueDate && 
          new Date(task.dueDate) < currentDate
        ) : [];

      // Crea oggetto dashboard con il formato che il frontend si aspetta
      const dashboardData = {
        summary: {
          // Adattiamo i dati al formato che il componente SummaryCards si aspetta
          openDeals: dealsCount,
          totalDealValue: activeDeals.reduce((sum, deal) => sum + (parseFloat(deal.value || '0') || 0), 0),
          activeContacts: contactsCount,
          totalCompanies: companiesCount,
          tasks: {
            upcomingCount: upcomingTasks.length,
            overdueCount: overdueTasks.length
          },
          // Manteniamo anche il vecchio formato per retrocompatibilità
          upcomingTasksCount: upcomingTasks.length,
          overdueTasksCount: overdueTasks.length
        },
        dealsByStage,
        recentActivities: sortedActivities,
        upcomingMeetings,
        upcomingTasks: upcomingTasks.slice(0, 5),
        recentContacts
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei dati della dashboard' });
    }
  });
  
  // Statistiche dashboard
  app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
      // Utilizza i metodi di conteggio diretto
      const contactsCount = await storage.getContactsCount();
      const companiesCount = await storage.getCompaniesCount();
      const dealsCount = await storage.getDealsCount({ status: 'active' });
      const leadsCount = await storage.getLeadsCount();
      // Aggiunto conteggio delle sinergie
      const synergiesCount = await storage.getSynergiesCount();
      // Aggiunto conteggio delle filiali
      const branchesCount = await storage.getBranchesCount();
      
      // Recupera tutte le email e conta quelle non lette
      const emails = await storage.getEmails();
      const unreadEmails = emails.filter(email => !email.isRead).length;
      
      res.json({
        contacts: contactsCount,
        companies: companiesCount,
        deals: dealsCount,
        leads: leadsCount,
        synergies: synergiesCount,
        branches: branchesCount,
        emails: emails.length,
        unreadEmails: unreadEmails
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle statistiche della dashboard' });
    }
  });
  
  // Deal recenti per la dashboard
  app.get('/api/dashboard/deals', authenticate, async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      
      // Ordina per data di creazione (i più recenti prima)
      const sortedDeals = deals.sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      
      // Limita a 5 deal
      const recentDeals = sortedDeals.slice(0, 5);
      
      res.json(recentDeals);
    } catch (error) {
      console.error('Error fetching recent deals:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei deal recenti' });
    }
  });
  
  // Attività recenti per la dashboard
  app.get('/api/dashboard/recent-activities', authenticate, async (req, res) => {
    try {
      // Questa è una versione semplificata in attesa dell'implementazione delle attività reali
      res.json([
        {
          id: 1,
          type: 'contact_created',
          title: 'Nuovo contatto',
          description: 'È stato creato un nuovo contatto',
          createdAt: new Date(),
          entityId: 1,
          entityType: 'contact'
        },
        {
          id: 2,
          type: 'deal_updated',
          title: 'Deal aggiornato',
          description: 'Un deal è stato aggiornato',
          createdAt: new Date(Date.now() - 3600000), // 1 ora fa
          entityId: 1,
          entityType: 'deal'
        }
      ]);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Errore durante il recupero delle attività recenti' });
    }
  });
  
  // =====================================
  // TASK ROUTES
  // =====================================
  
  // Ottieni tutti i task
  app.get('/api/tasks', authenticate, async (req: Request, res: Response) => {
    try {
      console.log('GET /api/tasks - Recupero di tutti i task');
      
      // Ottieni i task con eventuali filtri
      let tasks = await storage.getTasks();
      
      // Filtra in base ai parametri di query
      const { contactId, companyId, dealId, leadId } = req.query;
      
      if (contactId) {
        tasks = tasks.filter(task => task.contactId === parseInt(contactId as string));
      }
      
      if (companyId) {
        tasks = tasks.filter(task => task.companyId === parseInt(companyId as string));
      }
      
      if (dealId) {
        tasks = tasks.filter(task => task.dealId === parseInt(dealId as string));
      }
      
      if (leadId) {
        tasks = tasks.filter(task => task.leadId === parseInt(leadId as string));
      }
      
      console.log(`GET /api/tasks - Trovati ${tasks.length} task`);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei task' });
    }
  });
  
  // Ottieni un task specifico
  app.get('/api/tasks/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Cerca il task
      const tasks = await storage.getTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task non trovato' });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ message: 'Errore durante il recupero del task' });
    }
  });
  
  // Crea un nuovo task
  app.post('/api/tasks', authenticate, async (req: Request, res: Response) => {
    try {
      console.log('POST /api/tasks - Creazione di un nuovo task', req.body);
      
      // Prepara i dati del task convertendo le date in oggetti Date
      // e includendo solo i campi che esistono nella tabella
      const taskData = {
        title: req.body.title,
        description: req.body.description || null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        completed: req.body.completed === true,
        contactId: req.body.contactId || null,
        companyId: req.body.companyId || null,
        dealId: req.body.dealId || null,
        leadId: req.body.leadId || null,
        assignedToId: req.body.assignedToId || null,
        isCalendarEvent: req.body.isCalendarEvent === true,
        taskValue: req.body.taskValue || 0,
        startDateTime: req.body.startDateTime ? new Date(req.body.startDateTime) : null,
        endDateTime: req.body.endDateTime ? new Date(req.body.endDateTime) : null
      };
      
      console.log('Dati del task formattati:', taskData);
      
      // Crea il task
      const newTask = await storage.createTask(taskData);
      
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Errore durante la creazione del task' });
    }
  });
  
  // Aggiorna un task esistente
  app.patch('/api/tasks/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      console.log(`PATCH /api/tasks/${taskId} - Aggiornamento task`, req.body);
      
      // Verifica che il task esista
      const tasks = await storage.getTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task non trovato' });
      }
      
      // Aggiorna il task
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento del task' });
    }
  });
  
  // Elimina un task
  app.delete('/api/tasks/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      console.log(`DELETE /api/tasks/${taskId} - Eliminazione task`);
      
      // Elimina il task
      const success = await storage.deleteTask(taskId);
      
      if (!success) {
        return res.status(404).json({ message: 'Task non trovato' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione del task' });
    }
  });
  
  // =====================================
  // EMAIL ROUTES
  // =====================================
  app.get('/api/emails', authenticate, async (req, res) => {
    try {
      const emails = await storage.getEmails();
      res.json(Array.isArray(emails) ? emails : []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  });

  // Recupera email filtrate per tipo di entità e ID
  app.get('/api/email/filter/:entityType/:entityId', authenticate, async (req, res) => {
    try {
      console.log(`[DEBUG EMAIL] Ricevuta richiesta per email di ${req.params.entityType} con ID ${req.params.entityId}`);
      const { entityType, entityId } = req.params;
      
      // Assicuriamoci che entityType sia valido
      const validEntityTypes = ['contact', 'company', 'lead', 'deal', 'branch'];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({ error: 'Tipo di entità non valido' });
      }
      
      // Assicuriamoci che entityId sia un numero valido
      const parsedEntityId = parseInt(entityId);
      if (isNaN(parsedEntityId)) {
        return res.status(400).json({ error: 'ID entità non valido' });
      }
      
      // Recupera le email associate all'entità specifica
      // In un'implementazione completa, questo utilizzerebbe emailEntityAssociations
      // Per ora, creiamo alcune email di test per mostrare l'interfaccia
      const currentDate = new Date();
      
      // Genera email di test per dimostrare l'interfaccia
      const testEmails = [
        {
          id: 10000 + parsedEntityId,
          subject: `Richiesta informazioni su ${entityType} #${parsedEntityId}`,
          from: 'cliente@example.com',
          to: ['info@azienda.com'],
          date: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Ieri
          read: false,
          hasAttachments: false,
          body: `<p>Buongiorno, vorrei avere maggiori informazioni su ${entityType} #${parsedEntityId}.</p><p>Cordiali saluti,<br>Cliente Esempio</p>`,
          folder: 'inbox',
          account_email: 'info@azienda.com',
          account_display_name: 'Info Azienda'
        },
        {
          id: 20000 + parsedEntityId,
          subject: `Conferma appuntamento per ${entityType}`,
          from: 'staff@azienda.com',
          to: ['cliente@example.com'],
          date: new Date(currentDate.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 2 giorni fa
          read: true,
          hasAttachments: true,
          body: `<p>Gentile Cliente,</p><p>confermiamo l'appuntamento per il giorno 25/05/2025 alle ore 15:00.</p><p>Cordiali saluti,<br>Staff Azienda</p>`,
          folder: 'sent',
          account_email: 'info@azienda.com',
          account_display_name: 'Info Azienda'
        }
      ];
      
      // In futuro, implementare il filtraggio dal database usando la tabella email_entity_associations
      
      // Restituisci le email di test generate per questa entità
      res.json(testEmails);
    } catch (error) {
      console.error('Error fetching filtered emails:', error);
      res.status(500).json({ error: 'Errore nel recupero delle email filtrate' });
    }
  });

  // Invia una nuova email
  app.post('/api/email/send', authenticate, async (req, res) => {
    try {
      const { accountId, to, cc, bcc, subject, body, entityId, entityType, inReplyTo } = req.body;
      
      if (!accountId || !to || !Array.isArray(to) || !subject || !body) {
        return res.status(400).json({ error: 'Dati email mancanti o non validi' });
      }
      
      // Recupera l'account email
      const account = await storage.getEmailAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account email non trovato' });
      }

      // Utilizziamo SendGrid per l'invio delle email se è configurato
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const emailData = {
          from: account.email,
          to: to,
          subject: subject,
          text: body.replace(/<[^>]*>/g, ""), // Versione testuale
          html: body, // Versione HTML
        };
        
        // Aggiungi CC e BCC se presenti
        if (cc && Array.isArray(cc) && cc.length > 0) {
          emailData.cc = cc;
        }
        
        if (bcc && Array.isArray(bcc) && bcc.length > 0) {
          emailData.bcc = bcc;
        }
        
        // Se è una risposta, aggiungi l'intestazione In-Reply-To
        if (inReplyTo) {
          emailData.headers = {
            'In-Reply-To': `<email-${inReplyTo}@expervisercrm.com>`,
            'References': `<email-${inReplyTo}@expervisercrm.com>`
          };
        }
        
        await sgMail.send(emailData);
        
        // Salva l'email inviata nel database
        const newEmail = {
          accountId,
          from: account.email,
          to,
          cc: cc || [],
          bcc: bcc || [],
          subject,
          body,
          date: new Date().toISOString(),
          read: true,
          hasAttachments: false,
          folder: 'SENT',
          inReplyTo: inReplyTo || null,
          entityId: entityId || null,
          entityType: entityType || null
        };
        
        const savedEmail = await storage.createEmail(newEmail);
        
        res.json({ success: true, email: savedEmail });
      } else {
        // Se non c'è SendGrid, simula l'invio e registra comunque l'email
        console.log('SENDGRID_API_KEY non configurata, simulo invio email:', {
          from: account.email,
          to,
          subject,
          body: body.substring(0, 100) + '...' // Log solo una parte del corpo per brevità
        });
        
        // Salva comunque l'email nel database come se fosse stata inviata
        const newEmail = {
          accountId,
          from: account.email,
          to,
          cc: cc || [],
          bcc: bcc || [],
          subject,
          body,
          date: new Date().toISOString(),
          read: true,
          hasAttachments: false,
          folder: 'SENT',
          inReplyTo: inReplyTo || null,
          entityId: entityId || null,
          entityType: entityType || null
        };
        
        const savedEmail = await storage.createEmail(newEmail);
        
        res.json({ 
          success: true, 
          email: savedEmail,
          warning: 'Email registrata ma non inviata realmente (SENDGRID_API_KEY non configurata)'
        });
      }
    } catch (error) {
      console.error('Errore nell\'invio dell\'email:', error);
      res.status(500).json({ error: 'Errore nell\'invio dell\'email' });
    }
  });

  // Endpoint per generare risposte alle email con AI
  app.post('/api/ai/generate-email-response', authenticate, async (req, res) => {
    try {
      const { originalEmail, entityType, entityId } = req.body;
      
      // Verifica che OpenAI API key sia configurata
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key non configurata', 
          message: 'Per utilizzare la generazione AI, configura la variabile d\'ambiente OPENAI_API_KEY'
        });
      }
      
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Recupera informazioni sull'entità se disponibili
      let entityInfo = null;
      if (entityId && entityType) {
        try {
          if (entityType === 'contact') {
            entityInfo = await storage.getContact(entityId);
          } else if (entityType === 'company') {
            entityInfo = await storage.getCompany(entityId);
          } else if (entityType === 'lead') {
            entityInfo = await storage.getLead(entityId);
          } else if (entityType === 'deal') {
            entityInfo = await storage.getDeal(entityId);
          } else if (entityType === 'branch') {
            entityInfo = await storage.getBranch(entityId);
          }
        } catch (entityError) {
          console.error(`Error fetching ${entityType} with ID ${entityId}:`, entityError);
        }
      }
      
      // Prepara il prompt per OpenAI
      const systemPrompt = `Sei un assistente professionale che aiuta a scrivere risposte a email nel contesto di un CRM. 
      Scrivi risposte cortesi, concise e professionali. Non includere saluti iniziali come "Gentile [Nome]" o finali come "Cordiali saluti".
      Limita la risposta a massimo 150 parole e mantieni un tono professionale.`;
      
      const userPrompt = `Genera una risposta professionale alla seguente email:
      
      Email originale da: ${originalEmail.from}
      Oggetto: ${originalEmail.subject}
      Corpo: ${originalEmail.body}
      
      ${entityInfo ? `Informazioni aggiuntive sulla ${entityType}:
      ${JSON.stringify(entityInfo)}` : ''}
      
      Rispondi in italiano. Sii conciso e professionale.`;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      
      const generatedResponse = response.choices[0].message.content;
      
      res.json({ 
        success: true, 
        generatedResponse,
        tokens: {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens
        }
      });
    } catch (error) {
      console.error('Error generating AI email response:', error);
      res.status(500).json({ error: 'Errore nella generazione della risposta AI' });
    }
  });

  app.patch('/api/emails/:id/read', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Qui dovrebbe esserci una chiamata alla funzione markEmailAsRead nello storage
      // Per ora, poiché non esistono email, restituiamo un successo fittizio
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking email as read:', error);
      res.status(500).json({ error: 'Failed to mark email as read' });
    }
  });
  
  // =====================================
  // API CONFIGURATION ROUTES
  // =====================================
  app.get('/api/config', (req, res) => {
    try {
      // Espone solo le chiavi API che possono essere utilizzate in modo sicuro sul client
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || null;
      
      // Verifica se la chiave è vuota o null
      if (!googleMapsApiKey) {
        console.error('GOOGLE_MAPS_API_KEY non è impostata o è vuota nell\'ambiente');
        return res.status(500).json({ 
          error: 'Chiave API di Google Maps non configurata', 
          googleMapsApiKey: null 
        });
      }
      
      // Verifica che la chiave API non sia troppo corta (senza controllo restrittivo sul prefisso)
      if (googleMapsApiKey.length < 10) {
        console.error('GOOGLE_MAPS_API_KEY non sembra valida (troppo corta).');
        return res.status(500).json({ 
          error: 'Formato della chiave API di Google Maps non valido', 
          googleMapsApiKey: null 
        });
      }
      
      // Log la chiave API per debug (solo i primi caratteri per sicurezza)
      console.log('Sending Google Maps API key (starts with):', googleMapsApiKey.substring(0, 6) + '...');
      
      // Cache-busting header per evitare che il browser memorizzi nella cache questa risposta
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Invia la risposta
      res.json({
        googleMapsApiKey,
        timestamp: Date.now() // Aggiunge timestamp per ulteriore sicurezza contro la cache
      });
    } catch (error) {
      console.error('Error fetching API configuration:', error);
      res.status(500).json({ error: 'Failed to fetch API configuration' });
    }
  });
  
  // Integrazione API filiali/sedi (Branch)
  app.use('/api/branches', branchRoutes);
  
  // Integrazione API Email
  // Vecchio sistema email (legacy)
  // Commentato temporaneamente
  // app.use('/api/email-legacy', authenticate, emailRoutes);
  
  // Nuovo sistema email con supporto per l'associazione alle entità
  // Utilizza un mock temporaneo integrato direttamente qui
  const emailEntityRouter = express.Router();
  
  // Ottieni le email associate a un'entità
  emailEntityRouter.get('/entity/:entityType/:entityId', (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      if (!['contact', 'company', 'deal', 'lead'].includes(entityType)) {
        return res.status(400).json({ error: 'Tipo di entità non valido' });
      }
      
      console.log(`Cercando email per ${entityType} con ID ${entityId}`);
      
      // Email di esempio
      const mockEmails = [
        {
          id: "1",
          fromEmail: 'cliente@esempio.com',
          fromName: 'Mario Rossi',
          toEmail: 'me@azienda.com',
          toName: 'Il Mio CRM',
          subject: 'Richiesta informazioni',
          body: 'Buongiorno,\n\nVorrei sapere di più sui vostri servizi. Potreste inviarmi un preventivo per il pacchetto completo?\n\nCordiali saluti,\nMario Rossi',
          bodyType: 'text',
          isRead: false,
          receivedAt: new Date().toISOString(),
          attachments: [],
          entityId: entityId,
          entityType: entityType,
          starred: false
        },
        {
          id: "2",
          fromEmail: 'me@azienda.com',
          fromName: 'Il Mio CRM',
          toEmail: 'cliente@esempio.com',
          toName: 'Mario Rossi',
          subject: 'Re: Richiesta informazioni',
          body: 'Gentile Mario,\n\nGrazie per il suo interesse nei nostri servizi. Allego il preventivo richiesto.\n\nRestiamo a disposizione per qualsiasi chiarimento.\n\nCordiali saluti,\nIl Mio CRM',
          bodyType: 'text',
          isRead: true,
          receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          attachments: [
            {
              id: "att1",
              filename: "preventivo.pdf",
              contentType: "application/pdf",
              size: 1024 * 1024 * 1.5 // 1.5 MB
            }
          ],
          entityId: entityId,
          entityType: entityType,
          starred: true
        },
        {
          id: "3",
          fromEmail: 'fornitore@esempio.com',
          fromName: 'Fornitore Spa',
          toEmail: 'me@azienda.com',
          toName: 'Il Mio CRM',
          subject: 'Offerta commerciale',
          body: '<p>Gentile cliente,</p><p>Vi inviamo la nostra <strong>migliore offerta</strong> per i prodotti richiesti.</p><p>Sono disponibili sconti speciali per ordini superiori a €5000.</p><p>Cordiali saluti,<br/>Fornitore Spa</p>',
          bodyType: 'html',
          isRead: false,
          receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          attachments: [
            {
              id: "att2",
              filename: "catalogo_2025.pdf",
              contentType: "application/pdf",
              size: 1024 * 1024 * 3.2 // 3.2 MB
            },
            {
              id: "att3",
              filename: "listino_prezzi.xlsx",
              contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              size: 1024 * 512 // 512 KB
            }
          ],
          entityId: entityId,
          entityType: entityType,
          starred: false
        }
      ];
      
      return res.json(mockEmails);
    } catch (error) {
      console.error('Errore nel recupero delle email dell\'entità:', error);
      return res.status(500).json({ error: 'Errore nel recupero delle email dell\'entità' });
    }
  });
  
  // Conteggio email non lette
  emailEntityRouter.get('/unread-count', (req, res) => {
    return res.json({ count: 4 }); // Mock count
  });
  
  // Segna un'email come letta
  emailEntityRouter.patch('/:emailId/read', (req, res) => {
    try {
      const { emailId } = req.params;
      console.log(`Segnando email ${emailId} come letta`);
      
      // In produzione, questo codice salverebbe le modifiche nel database
      return res.json({ 
        success: true, 
        message: 'Email segnata come letta con successo' 
      });
    } catch (error) {
      console.error('Errore nel segnare l\'email come letta:', error);
      return res.status(500).json({ 
        error: 'Errore nel segnare l\'email come letta' 
      });
    }
  });
  
  // Invia una risposta a un'email
  emailEntityRouter.post('/:emailId/reply', (req, res) => {
    try {
      const { emailId } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ 
          error: 'Il contenuto della risposta non può essere vuoto' 
        });
      }
      
      console.log(`Inviando risposta all'email ${emailId}:`, content.substring(0, 50) + '...');
      
      // In produzione, questo codice invierebbe effettivamente la risposta
      return res.json({ 
        success: true, 
        message: 'Risposta inviata con successo' 
      });
    } catch (error) {
      console.error('Errore nell\'invio della risposta:', error);
      return res.status(500).json({ 
        error: 'Errore nell\'invio della risposta' 
      });
    }
  });
  
  // Invia una nuova email
  emailEntityRouter.post('/send', (req, res) => {
    try {
      const { to, subject, body, entityId, entityType } = req.body;
      
      // Validazione dei dati richiesti
      if (!to || !subject || !body) {
        return res.status(400).json({ 
          error: 'Destinatario, oggetto e corpo dell\'email sono obbligatori' 
        });
      }
      
      console.log(`Inviando nuova email a ${to}:`, subject);
      
      // In produzione, questo codice invierebbe effettivamente l'email
      return res.json({ 
        success: true, 
        message: 'Email inviata con successo' 
      });
    } catch (error) {
      console.error('Errore nell\'invio dell\'email:', error);
      return res.status(500).json({ 
        error: 'Errore nell\'invio dell\'email' 
      });
    }
  });
  
  // Gestisce il download degli allegati
  emailEntityRouter.get('/attachment/:attachmentId', (req, res) => {
    try {
      const { attachmentId } = req.params;
      
      console.log(`Richiesta di download dell'allegato ${attachmentId}`);
      
      // Per ora, restituiamo un messaggio informativo
      res.set('Content-Type', 'text/plain');
      return res.send(`Questa è una simulazione di download dell'allegato con ID ${attachmentId}`);
    } catch (error) {
      console.error('Errore nel download dell\'allegato:', error);
      return res.status(500).json({ 
        error: 'Errore nel download dell\'allegato' 
      });
    }
  });
  
  app.use('/api/email', authenticate, emailEntityRouter);
  
  // Integrazione API Importazione/Esportazione
  app.use('/api/import-export', authenticate, importExportRoutes);
  
  // Integrazione API Email di test
  app.use('/api', authenticate, mockEmailRoutes);
  
  // API per gestire le email reali
  app.post('/api/email/accounts/test-connection', authenticate, async (req, res) => {
    try {
      const { username, password, server, port, tls } = req.body;
      
      if (!username || !password || !server || !port) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parametri di connessione incompleti' 
        });
      }
      
      // Importa la funzione per testare la connessione IMAP
      const { testImapConnection } = require('./modules/email/emailListener');
      
      // Testa la connessione
      const result = await testImapConnection({
        username,
        password,
        server,
        port: parseInt(port),
        tls: tls !== false
      });
      
      res.json({
        success: result,
        message: result 
          ? 'Connessione al server email riuscita' 
          : 'Impossibile connettersi al server email'
      });
    } catch (error) {
      console.error('Error testing email connection:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante il test di connessione',
        error: error.message
      });
    }
  });
  
  // API per avviare manualmente il listener IMAP per un account
  app.post('/api/email/accounts/:id/start-listener', authenticate, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Importa le funzioni necessarie
      const { getEmailAccounts, startEmailListener } = require('./modules/email/emailListener');
      
      // Ottieni tutti gli account
      const accounts = await getEmailAccounts();
      
      // Trova l'account specifico
      const account = accounts.find(acc => acc.id === accountId);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account email non trovato'
        });
      }
      
      // Avvia il listener
      const result = await startEmailListener(account);
      
      res.json({
        success: result,
        message: result 
          ? `Listener IMAP avviato per l'account ${account.email}` 
          : `Impossibile avviare il listener per l'account ${account.email}`
      });
    } catch (error) {
      console.error('Error starting email listener:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante l\'avvio del listener email',
        error: error.message
      });
    }
  });
  
  // --- ROTTE PER SETTORI, SOTTOSETTORI E JOB TITLES ---
  
  // Ottieni tutti i settori
  app.get('/api/sectors', authenticate, getSectors);
  
  // Crea un nuovo settore
  app.post('/api/sectors', authenticate, isAdmin, createSector);
  
  // Ottieni sottosettori per un settore
  app.get('/api/sectors/:sectorId/subsectors', authenticate, getSubSectors);
  
  // Crea un nuovo sottosettore
  app.post('/api/sectors/:sectorId/subsectors', authenticate, isAdmin, createSubSector);
  
  // Ottieni job titles per un sottosettore
  app.get('/api/subsectors/:subSectorId/jobtitles', authenticate, getJobTitles);
  
  // Crea un nuovo job title
  app.post('/api/subsectors/:subSectorId/jobtitles', authenticate, isAdmin, createJobTitle);
  
  // Ottieni singolo job title per ID
  app.get('/api/subsectors/:subSectorId/jobtitles/:id', authenticate, getJobTitle);
  
  // Aggiorna un job title esistente
  app.patch('/api/subsectors/:subSectorId/jobtitles/:id', authenticate, isAdmin, updateJobTitle);
  
  // Elimina un job title
  app.delete('/api/subsectors/:subSectorId/jobtitles/:id', authenticate, isAdmin, deleteJobTitle);
  
  // Registra le rotte email per l'integrazione con le pagine di dettaglio
  // Temporaneamente commentato in attesa di integrazione
  // app.use('/', emailRoutes);
  
  // Registra le rotte per importazione/esportazione dati
  app.use('/api/import-export', importExportRoutes);
  
  // Crea il server HTTP
  const httpServer = createServer(app);
  
  // Restituisci il server per permettere a setupVite di collegarsi
  return httpServer;
}