import { createServer } from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { pool } from './db'; // Importiamo il pool di connessione PostgreSQL
import { z } from 'zod';
import { insertUserSchema, insertContactSchema, insertCompanySchema, insertDealSchema, insertPipelineStageSchema, insertLeadSchema, insertAreaOfActivitySchema, insertContactEmailSchema } from '@shared/schema';

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
      
      // Crea il contatto
      const newContact = await storage.createContact({
        ...validatedData,
        status: validatedData.status || 'active'
      });
      
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
  
  // Aggiorna un'azienda
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
  
  // Ottieni i contatti associati ad un'azienda
  app.get('/api/companies/:id/contacts', authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Verifica se l'azienda esiste
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Azienda non trovata' });
      }
      
      // Ottieni i contatti associati all'azienda
      const contacts = await storage.getContactsByCompany(companyId);
      
      console.log(`Found ${contacts.length} contacts for company ${companyId}`);
      
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching company contacts:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei contatti dell\'azienda' });
    }
  });
  
  // --- LEAD ROUTES ---
  
  // Ottieni tutti i lead
  app.get('/api/leads', authenticate, async (req, res) => {
    try {
      console.log("API /api/leads: retrieving leads from storage");
      const leads = await storage.getLeads();
      console.log(`API /api/leads: found ${leads.length} leads in storage`);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei lead' });
    }
  });
  
  // Ottieni un singolo lead
  app.get('/api/leads/:id', authenticate, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: 'Lead non trovato' });
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: 'Errore durante il recupero del lead' });
    }
  });
  
  // Crea un nuovo lead
  app.post('/api/leads', authenticate, async (req, res) => {
    try {
      // Validazione dello schema
      const validatedData = insertLeadSchema.parse(req.body);
      
      // Crea il lead
      const newLead = await storage.createLead(validatedData);
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error('Error creating lead:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Errore durante la creazione del lead' });
      }
    }
  });
  
  // Aggiorna un lead
  app.put('/api/leads/:id', authenticate, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      
      // Verifica se il lead esiste
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead non trovato' });
      }
      
      // Aggiorna il lead
      const updatedLead = await storage.updateLead(leadId, req.body);
      
      res.json(updatedLead);
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento del lead' });
    }
  });
  
  // Elimina un lead
  app.delete('/api/leads/:id', authenticate, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      
      // Verifica se il lead esiste
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead non trovato' });
      }
      
      // Elimina il lead
      await storage.deleteLead(leadId);
      
      res.json({ message: 'Lead eliminato con successo' });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ message: 'Errore durante l\'eliminazione del lead' });
    }
  });
  
  // Converti un lead in contatto
  app.post('/api/leads/:id/convert', authenticate, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      
      // Verifica se il lead esiste
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead non trovato' });
      }
      
      // Crea il contatto dal lead
      const newContact = await storage.createContact({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        region: lead.region,
        country: lead.country,
        postalCode: lead.postalCode,
        notes: lead.notes,
        source: lead.source,
        status: 'active',
        customFields: lead.customFields
      });
      
      // Opzionalmente, crea un'azienda se richiesto
      let company = null;
      if (req.body.createCompany && req.body.companyName) {
        company = await storage.createCompany({
          name: req.body.companyName,
          status: 'active'
        });
        
        // Collega il contatto all'azienda
        if (company) {
          await storage.createAreaOfActivity({
            contactId: newContact.id,
            companyId: company.id,
            companyName: company.name,
            role: req.body.role || null,
            isPrimary: true
          });
        }
      }
      
      // Opzionalmente, crea un deal se richiesto
      let deal = null;
      if (req.body.createDeal && req.body.dealName) {
        deal = await storage.createDeal({
          name: req.body.dealName,
          contactId: newContact.id,
          companyId: company?.id || null,
          value: req.body.dealValue || null,
          status: 'active'
        });
      }
      
      // Elimina il lead
      await storage.deleteLead(leadId);
      
      res.json({
        message: 'Lead convertito con successo',
        contact: newContact,
        company,
        deal
      });
    } catch (error) {
      console.error('Error converting lead:', error);
      res.status(500).json({ message: 'Errore durante la conversione del lead' });
    }
  });
  
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
  
  // Ottieni un singolo deal
  app.get('/api/deals/:id', authenticate, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal non trovato' });
      }
      
      res.json(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      res.status(500).json({ message: 'Errore durante il recupero del deal' });
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
      
      // Per le email manteniamo l'approccio originale per ora
      const emails = await storage.getEmails();
      
      res.json({
        contacts: contactsCount,
        companies: companiesCount,
        deals: dealsCount,
        leads: leadsCount,
        synergies: synergiesCount,
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
      
      // Log la chiave API per debug (solo i primi caratteri per sicurezza)
      if (googleMapsApiKey) {
        console.log('Sending Google Maps API key (starts with):', googleMapsApiKey.substring(0, 6) + '...');
      } else {
        console.log('No Google Maps API key available');
      }
      
      res.json({
        googleMapsApiKey,
      });
    } catch (error) {
      console.error('Error fetching API configuration:', error);
      res.status(500).json({ error: 'Failed to fetch API configuration' });
    }
  });
  
  // Crea il server HTTP
  const httpServer = createServer(app);
  
  // Restituisci il server per permettere a setupVite di collegarsi
  return httpServer;
}