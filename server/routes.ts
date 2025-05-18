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
} from '@shared/schema';
import { 
  listLeads, 
  getLead, 
  createLead, 
  updateLead, 
  deleteLead, 
  convertLead 
} from './controllers/leadController.js';
import branchRoutes from './branchRoutes';
import { getSectors, createSector } from './controllers/sectorController';
import { getSubSectors, createSubSector } from './controllers/subSectorController';
import { getJobTitles, createJobTitle } from './controllers/jobTitleController';

// Chiave segreta per JWT
const JWT_SECRET = process.env.JWT_SECRET || 'experviser-dev-secret';

// Middleware di autenticazione
export const authenticate = (req: any, res: any, next: any) => {
  // Ottieni il token dal cookie o dall'header Authorization
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

// Middleware di autenticazione JWT specifico
export const authenticateJWT = (req: any, res: any, next: any) => {
  // Ottieni il token dal cookie o dall'header Authorization
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  // Consenti l'autenticazione come utente di debug in sviluppo
  if (process.env.NODE_ENV === 'development' && !token) {
    console.log('Using debug authentication');
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
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username e password sono richiesti' });
      }
      
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
  
  // Versione più semplice e robusta dell'endpoint per ricevere i contatti di un'azienda
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
  app.get('/api/deals/:id', async (req, res) => {
    console.log('=====================================================');
    console.log(`[DEAL DEBUG] API endpoint /api/deals/${req.params.id} è stato chiamato`);
    console.log('=====================================================');

    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        console.log(`[DEAL DEBUG] ID deal non valido: ${req.params.id}`);
        return res.status(400).json({ message: 'ID deal non valido' });
      }
      
      // Importiamo direttamente il pool dal modulo db.ts
      const { pool } = require('./db');
      
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
  
  // Aggiorna un deal
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
      
      // Per le email manteniamo l'approccio originale per ora
      const emails = await storage.getEmails();
      
      res.json({
        contacts: contactsCount,
        companies: companiesCount,
        deals: dealsCount,
        leads: leadsCount,
        synergies: synergiesCount,
        branches: branchesCount,
        emails: emails.length,
        unreadEmails: emails.filter(email => !email.read).length
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
      
      // Crea il task
      const newTask = await storage.createTask(req.body);
      
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
      
      // Verifica che la chiave API abbia un formato valido (inizia con AIza)
      if (!googleMapsApiKey.startsWith('AIza')) {
        console.error('GOOGLE_MAPS_API_KEY non ha un formato valido. Dovrebbe iniziare con "AIza".');
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
  
  // Crea il server HTTP
  const httpServer = createServer(app);
  
  // Restituisci il server per permettere a setupVite di collegarsi
  return httpServer;
}