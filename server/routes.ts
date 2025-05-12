import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db-simple";
import { emailService } from "./services/email";
import { authService } from "./services/authService";
import { aiService } from "./services/aiService";
import { initializeSuperAdmin } from "./seedData";
import { fixContactsRelationships } from "./fix-contacts-relationships";
import { contacts, companies, areasOfActivity } from "@shared/schema";
import { eq, and, isNotNull, inArray } from "drizzle-orm";
import {
  insertLeadSchema,
  insertContactSchema,
  insertCompanySchema,
  insertDealSchema,
  insertTaskSchema,
  insertEmailAccountSchema,
  insertMeetingSchema,
  insertSignatureSchema,
  insertAccountSignatureSchema,
  insertAreaOfActivitySchema,
  insertUserSchema,
  insertSynergySchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);
  
  // Authentication middleware
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Try to get token from the Authorization header
      let token = "";
      const authHeader = req.headers.authorization;
      
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log("Authentication attempt with token from header:", token.substring(0, 10) + "...");
      } 
      // Try to get token from query parameter (for debugging only)
      else if (req.query.auth_token) {
        token = req.query.auth_token as string;
        console.log("Authentication attempt with token from query:", token.substring(0, 10) + "...");
      }
      
      if (!token) {
        console.log("Authentication failed: No token found");
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = await authService.getUserByToken(token);
      
      if (!user) {
        console.log("Authentication failed: Invalid or expired token");
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      console.log("Authentication successful for user:", user.username, ", ID:", user.id);
      
      // Attach user to request object
      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
  
  // Authorization middleware
  const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user;
        
        if (!user) {
          return res.status(401).json({ error: 'User not authenticated' });
        }
        
        if (!roles.includes(user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
      } catch (error) {
        res.status(500).json({ error: 'Authorization failed' });
      }
    };
  };
  
  // Authentication routes
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { emailOrUsername, password } = req.body;
      
      // Debug log
      console.log("Login attempt:", { emailOrUsername });
      
      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'Email/username and password are required' });
      }
      
      const ip = req.ip;
      const userAgent = req.headers['user-agent'] || '';
      
      // Check if user exists by email/username first
      const userByUsername = await storage.getUserByUsername(emailOrUsername);
      const userByEmail = await storage.getUserByEmail(emailOrUsername);
      console.log("User lookup results:", { 
        userByUsernameExists: !!userByUsername, 
        userByEmailExists: !!userByEmail 
      });
      
      const result = await authService.login(emailOrUsername, password, ip, userAgent);
      
      if (!result) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Remove sensitive data
      const { password: _, ...safeUserData } = result.user;
      
      console.log("Login successful:", { userId: safeUserData.id, username: safeUserData.username });
      
      res.json({
        user: safeUserData,
        token: result.token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  apiRouter.post("/auth/logout", async (req: Request, res: Response) => {
    try {
      // Tentativo di ottenere il token anche senza autenticazione riuscita
      let token = "";
      const authHeader = req.headers.authorization;
      
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.body.token) {
        token = req.body.token;
      } else if (req.query.auth_token) {
        token = req.query.auth_token as string;
      }
      
      if (!token) {
        console.log("Logout without token - assumed already logged out");
        return res.status(200).json({ message: 'Already logged out' });
      }
      
      const ip = req.ip;
      const userAgent = req.headers['user-agent'] || null;
      
      // Trova l'utente associato al token (anche se la sessione è già scaduta)
      const session = await storage.getUserSessionByToken(token);
      const userId = session?.userId || 0;
      
      // Tenta di eseguire il logout e ignorare i fallimenti
      try {
        await authService.logout(token, userId, ip, userAgent);
        console.log(`Logout successful for token: ${token.substring(0, 10)}...`);
      } catch (err) {
        console.warn(`Failed to process logout, but continuing:`, err);
      }
      
      // Elimina comunque la sessione se esiste
      if (session) {
        await storage.deleteUserSession(token);
      }
      
      // Sempre restituisci successo per il client
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error("Logout error:", error);
      // Consideriamo il logout come successo anche se fallisce sul server
      res.status(200).json({ message: 'Logged out successfully' });
    }
  });
  
  apiRouter.post("/auth/request-password-reset", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      await authService.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      res.status(500).json({ error: 'Password reset request failed' });
    }
  });
  
  apiRouter.post("/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }
      
      const success = await authService.resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ error: 'Password reset failed' });
    }
  });
  
  // Current user
  apiRouter.get("/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      // Remove sensitive data
      const { password, ...safeUserData } = user;
      
      console.log("GET /auth/me - Sending user data:", { 
        id: safeUserData.id, 
        username: safeUserData.username,
        role: safeUserData.role
      });
      
      res.json(safeUserData);
    } catch (error) {
      console.error("GET /auth/me - Error:", error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });
  
  // Update current user profile
  apiRouter.patch("/auth/profile", authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      const { fullName, email, phone, jobTitle, timezone, language } = req.body;
      
      console.log("PATCH /auth/profile - Updating user profile:", { 
        userId,
        updateData: req.body 
      });
      
      // Update user data
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        timezone,
        language,
        phone,
        jobTitle
        // updatedAt viene gestito automaticamente dal database
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive data
      const { password, ...safeUserData } = updatedUser;
      
      res.json(safeUserData);
    } catch (error) {
      console.error("PATCH /auth/profile - Error:", error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });
  
  // Update current user password
  apiRouter.patch("/auth/password", authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      // Verify current password
      const isValid = await authService.verifyPassword(userId, currentPassword);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Update password
      const success = await authService.updatePassword(userId, newPassword);
      if (!success) {
        return res.status(500).json({ error: 'Failed to update password' });
      }
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error("PATCH /auth/password - Error:", error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });
  
  // User Management (Super Admin only)
  apiRouter.get("/users", authenticate, authorize(['super_admin']), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Remove sensitive data
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  apiRouter.post("/users", authenticate, authorize(['super_admin']), async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingByUsername = await storage.getUserByUsername(userData.username);
      const existingByEmail = await storage.getUserByEmail(userData.email);
      
      if (existingByUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      if (existingByEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      const user = await authService.registerUser(userData);
      
      // Remove sensitive data
      const { password, ...safeUserData } = user;
      
      res.status(201).json(safeUserData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Leads
  apiRouter.get("/leads", async (req: Request, res: Response) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  apiRouter.get("/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  apiRouter.post("/leads", async (req: Request, res: Response) => {
    try {
      // Validate that at least company name OR first/last name is provided
      if (!req.body.companyName && !(req.body.firstName || req.body.lastName)) {
        return res.status(400).json({ 
          error: "Either company name or contact name (first or last name) is required" 
        });
      }
      
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  apiRouter.patch("/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const leadData = req.body;
      const lead = await storage.updateLead(id, leadData);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  apiRouter.delete("/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLead(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });
  
  // Convert Lead to Contact
  apiRouter.post("/leads/:id/convert", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the lead
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Create a contact from the lead data
      const contactData = {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        tags: lead.tags,
        notes: lead.notes,
        source: lead.source,
        jobTitle: lead.jobTitle,
        ...req.body // Allow overriding with request body
      };
      
      // Create the contact
      const contact = await storage.createContact(contactData);
      
      // Create an area of activity if the lead has a company
      if (lead.companyName) {
        const companies = await storage.getCompanies();
        // Check if company exists
        let company = companies.find(c => c.name === lead.companyName);
        
        if (!company) {
          // Create a new company
          company = await storage.createCompany({
            name: lead.companyName,
            industry: lead.industry || null,
          });
        }
        
        // Create area of activity
        await storage.createAreaOfActivity({
          contactId: contact.id,
          companyId: company.id,
          jobTitle: lead.jobTitle || null,
          jobDescription: null,
          isPrimary: true
        });
      }
      
      // Delete the lead
      await storage.deleteLead(id);
      
      res.status(201).json({ contact });
    } catch (error) {
      console.error("Failed to convert lead:", error);
      res.status(500).json({ error: "Failed to convert lead to contact" });
    }
  });

  // Areas of Activity
  apiRouter.get("/contacts/:contactId/areas-of-activity", async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const areas = await storage.getAreasOfActivity(contactId);
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch areas of activity", error: error.message });
    }
  });

  apiRouter.post("/contacts/:contactId/areas-of-activity", async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      // Check if we need to create a new company
      let companyId = req.body.companyId;
      const companyName = req.body.companyName;
      
      // Se abbiamo un nome azienda ma nessun ID azienda, significa che dobbiamo crearla
      if (companyName && !companyId) {
        console.log(`Creating new company: ${companyName}`);
        
        // Crea una nuova azienda
        try {
          const newCompany = await storage.createCompany({
            name: companyName
          });
          
          companyId = newCompany.id;
          console.log(`Created new company with ID ${companyId}`);
        } catch (err) {
          console.error("Failed to create new company:", err);
          // Continua comunque, anche se la creazione dell'azienda fallisce
        }
      }
      
      // Include contactId in the request body
      const data = {
        ...req.body,
        contactId,
        companyId  // Utilizza il nuovo ID azienda se è stato creato
      };
      
      const validated = insertAreaOfActivitySchema.parse(data);
      const newArea = await storage.createAreaOfActivity(validated);
      
      // Log success
      console.log(`Created new area of activity: contact ${contactId} with company ${validated.companyId || 'unknown'} (${companyName || 'no name'})`);
      
      res.status(201).json(newArea);
    } catch (error) {
      console.error("Error creating area of activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create area of activity", error: error.message });
    }
  });

  apiRouter.get("/areas-of-activity/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const area = await storage.getAreaOfActivity(id);
      
      if (!area) {
        return res.status(404).json({ message: "Area of activity not found" });
      }
      
      res.json(area);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch area of activity", error: error.message });
    }
  });

  apiRouter.post("/areas-of-activity", async (req: Request, res: Response) => {
    try {
      console.log("POST /areas-of-activity - Creating new area of activity:", req.body);
      
      // Check if we need to create a new company
      let companyId = req.body.companyId;
      const companyName = req.body.companyName;
      
      // If we have a company name but no company ID, we need to create the company
      if (companyName && !companyId) {
        console.log(`Creating new company for area of activity: ${companyName}`);
        
        try {
          const newCompany = await storage.createCompany({
            name: companyName
          });
          
          companyId = newCompany.id;
          console.log(`Created new company with ID ${companyId}`);
          
          // Update the request body with the new company ID
          req.body.companyId = companyId;
        } catch (err) {
          console.error("Failed to create new company during area creation:", err);
          // Continue anyway, even if company creation fails
        }
      }
      
      const validated = insertAreaOfActivitySchema.parse(req.body);
      const newArea = await storage.createAreaOfActivity(validated);
      
      console.log(`Successfully created area of activity with ID ${newArea.id}`);
      console.log(`Area details: contactId=${newArea.contactId}, companyId=${newArea.companyId}, role=${newArea.role}, isPrimary=${newArea.isPrimary}`);
      
      res.status(201).json(newArea);
    } catch (error) {
      console.error("Error creating area of activity:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          details: error.errors
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create area of activity", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  apiRouter.patch("/areas-of-activity/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if we need to create a new company
      let companyId = req.body.companyId;
      const companyName = req.body.companyName;
      
      // Se abbiamo un nome azienda ma nessun ID azienda, significa che dobbiamo crearla
      if (companyName && !companyId) {
        console.log(`Creating new company during area update: ${companyName}`);
        
        // Crea una nuova azienda
        try {
          const newCompany = await storage.createCompany({
            name: companyName
          });
          
          companyId = newCompany.id;
          console.log(`Created new company with ID ${companyId}`);
          
          // Aggiorna il payload con l'ID della nuova azienda
          req.body.companyId = companyId;
        } catch (err) {
          console.error("Failed to create new company during area update:", err);
          // Continua comunque, anche se la creazione dell'azienda fallisce
        }
      }
      
      const validated = insertAreaOfActivitySchema.partial().parse(req.body);
      const updatedArea = await storage.updateAreaOfActivity(id, validated);
      
      if (!updatedArea) {
        return res.status(404).json({ message: "Area of activity not found" });
      }
      
      res.json(updatedArea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ message: "Failed to update area of activity", error: error.message });
    }
  });

  apiRouter.delete("/areas-of-activity/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAreaOfActivity(id);
      
      if (!success) {
        return res.status(404).json({ message: "Area of activity not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete area of activity", error: error.message });
    }
  });

  apiRouter.post("/areas-of-activity/:id/set-primary", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.setPrimaryAreaOfActivity(id);
      
      if (!success) {
        return res.status(404).json({ message: "Area of activity not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to set primary area of activity", error: error.message });
    }
  });

  // Contacts
  apiRouter.get("/contacts", async (req: Request, res: Response) => {
    try {
      const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;
      const includeAreas = req.query.includeAreas === 'true';
      const searchTerm = req.query.search as string | undefined;
      const excludeCompanyId = req.query.excludeCompanyId ? 
        parseInt(req.query.excludeCompanyId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let contacts;
      if (companyId) {
        // If companyId is provided, filter contacts by company
        contacts = await storage.getCompanyContacts(companyId);
      } else {
        // Otherwise, get all contacts
        contacts = await storage.getContacts();
      }
      
      // Apply search filter if provided
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        contacts = contacts.filter(contact => {
          const firstName = (contact.firstName || '').toLowerCase();
          const middleName = (contact.middleName || '').toLowerCase();
          const lastName = (contact.lastName || '').toLowerCase();
          const companyEmail = (contact.companyEmail || '').toLowerCase();
          const privateEmail = (contact.privateEmail || '').toLowerCase();
          
          const fullName = `${firstName} ${middleName} ${lastName}`.trim();
          
          return fullName.includes(lowerSearch) || 
                 firstName.includes(lowerSearch) || 
                 lastName.includes(lowerSearch) || 
                 companyEmail.includes(lowerSearch) || 
                 privateEmail.includes(lowerSearch);
        });
        
        console.log(`Filtered ${contacts.length} contacts matching search term "${searchTerm}"`);
      }
      
      // If includeAreas flag is set, add areas of activity data to each contact
      if ((includeAreas || excludeCompanyId) && contacts && contacts.length > 0) {
        // Fetch areas of activity for all contacts in a single batch
        const contactsWithAreas = await Promise.all(
          contacts.map(async (contact) => {
            const areasOfActivity = await storage.getAreasOfActivity(contact.id);
            return {
              ...contact,
              areasOfActivity,
            };
          })
        );
        
        // If excludeCompanyId is provided, filter out contacts that have this company as primary
        if (excludeCompanyId) {
          const filteredContacts = contactsWithAreas.filter(contact => {
            // Include contacts that don't have this company as primary
            if (!contact.areasOfActivity || !Array.isArray(contact.areasOfActivity)) {
              return true;
            }
            return !contact.areasOfActivity.some(area => 
              area.companyId === excludeCompanyId && area.isPrimary
            );
          });
          return res.json(filteredContacts);
        }
        
        return res.json(contactsWithAreas);
      }
      // Applico la limitazione dei risultati se specificata
      if (limit && limit > 0 && contacts.length > limit) {
        contacts = contacts.slice(0, limit);
      }
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get contacts", error: error.message });
    }
  });

  apiRouter.get("/contacts/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Otteniamo le aree di attività per questo contatto
      const areasOfActivity = await storage.getAreasOfActivity(id);
      
      // Restituiamo il contatto con le sue aree di attività
      res.json({
        ...contact,
        areasOfActivity
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get contact", error: error.message });
    }
  });
  
  // Get companies associated with a contact
  apiRouter.get("/contacts/:id/companies", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      console.log(`GET /contacts/${id}/companies - Retrieving linked companies`);
      
      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const companies = await storage.getContactCompanies(id);
      console.log(`Found ${companies.length} companies linked to contact ${id}`);
      
      res.json(companies);
    } catch (error) {
      console.error(`Error fetching contact companies:`, error);
      res.status(500).json({ 
        message: "Failed to get contact companies", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // New endpoint to directly link a contact to a company
  apiRouter.post("/contacts/:contactId/companies/:companyId", async (req: Request, res: Response) => {
    try {
      const contactId = Number(req.params.contactId);
      const companyId = Number(req.params.companyId);
      
      console.log(`POST /contacts/${contactId}/companies/${companyId} - Linking contact to company`);
      
      // First check if the contact and company exist
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if this contact is already linked to this company
      const existingAreas = await storage.getAreasOfActivity(contactId);
      const alreadyLinked = existingAreas.some(area => area.companyId === companyId);
      
      if (alreadyLinked) {
        console.log(`Contact ${contactId} is already linked to company ${companyId}`);
        return res.status(200).json({ message: "Contact is already linked to this company" });
      }
      
      // If not already linked, create a new area of activity
      const isPrimary = existingAreas.length === 0; // Make it primary if it's the first
      
      const newArea = await storage.createAreaOfActivity({
        contactId,
        companyId,
        companyName: company.name,
        role: req.body.role || null,
        jobDescription: req.body.jobDescription || null,
        isPrimary
      });
      
      console.log(`Successfully linked contact ${contactId} to company ${companyId} with area of activity ${newArea.id}`);
      
      res.status(201).json(newArea);
    } catch (error) {
      console.error(`Error linking contact to company:`, error);
      res.status(500).json({ 
        message: "Failed to link contact to company", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get deals associated with a contact
  apiRouter.get("/contacts/:id/deals", async (req: Request, res: Response) => {
    try {
      const contactId = Number(req.params.id);
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Otteniamo tutti i deal e filtriamo per contactId
      const allDeals = await storage.getDeals();
      const contactDeals = allDeals.filter(deal => deal.contactId === contactId);
      
      // Otteniamo informazioni sugli stage per ogni deal
      const dealsWithInfo = await Promise.all(contactDeals.map(async deal => {
        const stage = await storage.getPipelineStage(deal.stageId);
        
        // Aggiungiamo i dettagli dell'azienda se presente
        let company = null;
        if (deal.companyId) {
          company = await storage.getCompany(deal.companyId);
        }
        
        return {
          ...deal,
          stage,
          company
        };
      }));
      
      res.json(dealsWithInfo);
    } catch (error) {
      console.error("Error fetching contact deals:", error);
      res.status(500).json({ message: "Failed to get contact deals", error: error.message });
    }
  });

  apiRouter.post("/contacts", async (req: Request, res: Response) => {
    try {
      // Separiamo i dati principali del contatto dalle relazioni
      const { areasOfActivity, ...requestData } = req.body;
      
      // Utilizziamo safe parse per avere più informazioni sull'errore
      const result = insertContactSchema.safeParse(requestData);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Validation error",
          details: result.error.format()
        });
      }
      
      // Creiamo il contatto
      const contact = await storage.createContact(result.data);
      
      // Se sono presenti aree di attività, le creiamo
      if (areasOfActivity && Array.isArray(areasOfActivity)) {
        // Creiamo le aree di attività per il contatto
        for (const area of areasOfActivity) {
          // Verifica se dobbiamo creare un'azienda per quest'area
          let companyId = area.companyId;
          const companyName = area.companyName;
          
          // Se abbiamo un nome azienda ma nessun ID azienda, dobbiamo creare l'azienda
          if (companyName && !companyId) {
            console.log(`Creating new company during contact creation: ${companyName}`);
            
            try {
              const newCompany = await storage.createCompany({
                name: companyName
              });
              
              companyId = newCompany.id;
              console.log(`Created new company with ID ${companyId}`);
            } catch (err) {
              console.error("Failed to create new company during contact creation:", err);
              // Continua comunque, anche se la creazione dell'azienda fallisce
            }
          }
          
          await storage.createAreaOfActivity({
            ...area,
            contactId: contact.id,
            companyId: companyId // Usa l'ID dell'azienda appena creata, se disponibile
          });
        }
        
        // Otteniamo le aree di attività create
        const createdAreas = await storage.getAreasOfActivity(contact.id);
        
        // Restituiamo il contatto con le aree di attività
        return res.status(201).json({
          ...contact,
          areasOfActivity: createdAreas
        });
      }
      
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact", error: error.message });
    }
  });

  apiRouter.patch("/contacts/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Separiamo i dati principali del contatto dalle relazioni
      const { areasOfActivity, ...contactData } = req.body;
      
      // Validiamo i dati del contatto
      const validContactData = insertContactSchema.partial().parse(contactData);
      
      // Aggiorniamo prima il contatto base
      const contact = await storage.updateContact(id, validContactData);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Se sono presenti aree di attività, le gestiamo
      if (areasOfActivity && Array.isArray(areasOfActivity)) {
        // Prima otteniamo le aree di attività attuali
        const currentAreas = await storage.getAreasOfActivity(id);
        
        // Registriamo quali aziende erano già associate per eventuali verifiche post-aggiornamento
        const previousCompanyIds = currentAreas
          .filter(area => area.companyId !== null)
          .map(area => area.companyId);
        
        // Eliminiamo tutte le aree di attività esistenti
        for (const area of currentAreas) {
          await storage.deleteAreaOfActivity(area.id);
        }
        
        // Creiamo le nuove aree di attività
        for (const area of areasOfActivity) {
          // Verifica se dobbiamo creare un'azienda per quest'area
          let companyId = area.companyId;
          const companyName = area.companyName;
          
          // Se abbiamo un nome azienda ma nessun ID azienda, dobbiamo creare l'azienda
          if (companyName && !companyId) {
            console.log(`Creating new company during contact update: ${companyName}`);
            
            try {
              const newCompany = await storage.createCompany({
                name: companyName
              });
              
              companyId = newCompany.id;
              console.log(`Created new company with ID ${companyId}`);
            } catch (err) {
              console.error("Failed to create new company during contact update:", err);
              // Continua comunque, anche se la creazione dell'azienda fallisce
            }
          }
          
          await storage.createAreaOfActivity({
            ...area,
            contactId: id,
            companyId: companyId // Usa l'ID dell'azienda appena creata, se disponibile
          });
        }
        
        // Ricarichiamo il contatto con le nuove aree di attività
        const updatedContact = await storage.getContact(id);
        // Otteniamo le aree di attività aggiornate
        const updatedAreas = await storage.getAreasOfActivity(id);
        
        // Otteniamo i nuovi ID delle aziende associate
        const newCompanyIds = updatedAreas
          .filter(area => area.companyId !== null)
          .map(area => area.companyId);
        
        // Log per il debug delle relazioni
        console.log(`Contact ${id} updated. Previous companies: ${previousCompanyIds.join(', ')}. New companies: ${newCompanyIds.join(', ')}`);
        
        // Restituiamo il contatto con le aree di attività
        return res.json({
          ...updatedContact,
          areasOfActivity: updatedAreas
        });
      }
      
      // Se non ci sono aree di attività nella richiesta, ritorniamo solo il contatto senza aree
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(400).json({ message: "Invalid contact data", error: error.message });
    }
  });

  apiRouter.delete("/contacts/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteContact(id);
    if (!success) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(204).send();
  });

  // Companies
  apiRouter.get("/companies", async (req: Request, res: Response) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  apiRouter.get("/companies/:id", async (req: Request, res: Response) => {
    const company = await storage.getCompany(Number(req.params.id));
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  });
  
  apiRouter.get("/companies/:id/contacts", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const company = await storage.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const contacts = await storage.getCompanyContacts(id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get company contacts", error: error.message });
    }
  });
  
  // Get deals associated with a company
  apiRouter.get("/companies/:id/deals", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Otteniamo tutti i deal e filtriamo per companyId
      const allDeals = await storage.getDeals();
      const companyDeals = allDeals.filter(deal => deal.companyId === companyId);
      
      // Otteniamo informazioni sugli stage e contatti per ogni deal
      const dealsWithInfo = await Promise.all(companyDeals.map(async deal => {
        const stage = await storage.getPipelineStage(deal.stageId);
        
        // Aggiungiamo i dettagli del contatto se presente
        let contact = null;
        if (deal.contactId) {
          contact = await storage.getContact(deal.contactId);
        }
        
        return {
          ...deal,
          stage,
          contact
        };
      }));
      
      res.json(dealsWithInfo);
    } catch (error) {
      console.error("Error fetching company deals:", error);
      res.status(500).json({ message: "Failed to get company deals", error: error.message });
    }
  });

  apiRouter.post("/companies", async (req: Request, res: Response) => {
    try {
      console.log("Creating new company from request:", req.body);
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      console.log(`Successfully created company: ${company.name} with ID ${company.id}`);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(400).json({ 
        message: "Invalid company data", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  apiRouter.patch("/companies/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(400).json({ message: "Invalid company data", error: error.message });
    }
  });

  apiRouter.delete("/companies/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteCompany(id);
    if (!success) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(204).send();
  });
  
  // Creazione di un contatto direttamente per un'azienda
  apiRouter.post("/companies/:companyId/contacts", async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      // Verifica che l'azienda esista
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Crea il contatto
      const contactData = req.body;
      
      // Utilizziamo safe parse per avere più informazioni sull'errore
      const result = insertContactSchema.safeParse(contactData);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Validation error",
          details: result.error.format()
        });
      }
      
      // Creiamo il contatto
      const contact = await storage.createContact(result.data);
      
      // Creiamo automaticamente un'area di attività per collegare il contatto all'azienda
      const role = contactData.role || 'Employee'; // Usa il ruolo dal body o un default
      const jobDescription = contactData.jobDescription || `Works at ${company.name}`;
      
      await storage.createAreaOfActivity({
        contactId: contact.id,
        companyId: companyId,
        companyName: company.name,
        role: role,
        jobDescription: jobDescription,
        isPrimary: true
      });
      
      // Otteniamo le aree di attività create
      const createdAreas = await storage.getAreasOfActivity(contact.id);
      
      // Restituiamo il contatto con le aree di attività
      res.status(201).json({
        ...contact,
        areasOfActivity: createdAreas
      });
    } catch (error) {
      console.error("Error creating contact for company:", error);
      res.status(500).json({ message: "Failed to create contact for company", error: error.message });
    }
  });

  // Pipeline Stages
  apiRouter.get("/pipeline-stages", async (req: Request, res: Response) => {
    const stages = await storage.getPipelineStages();
    res.json(stages);
  });

  // Deals
  apiRouter.get("/deals", async (req: Request, res: Response) => {
    const deals = await storage.getDeals();
    res.json(deals);
  });

  apiRouter.get("/deals/:id", async (req: Request, res: Response) => {
    const deal = await storage.getDeal(Number(req.params.id));
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    res.json(deal);
  });

  apiRouter.post("/deals", async (req: Request, res: Response) => {
    try {
      console.log("Received new deal:", req.body);
      
      // Create a custom schema for deals that properly handles nullable fields
      const createDealSchema = z.object({
        name: z.string(),
        value: z.number(),
        stageId: z.number(),
        companyId: z.number().nullable().optional(),
        contactId: z.number().nullable().optional(),
        expectedCloseDate: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
        notes: z.string().nullable().optional(),
      });
      
      const dealData = createDealSchema.parse(req.body);
      
      // If expectedCloseDate is provided as a string, convert it to a Date object
      if (dealData.expectedCloseDate) {
        dealData.expectedCloseDate = new Date(dealData.expectedCloseDate);
      }
      
      console.log("Validated new deal data:", dealData);
      
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(400).json({ message: "Invalid deal data", error: error.message });
    }
  });

  apiRouter.patch("/deals/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      console.log("Received update for deal:", id, req.body);
      
      // Create a custom update schema for deals that properly handles nullable fields
      const updateDealSchema = z.object({
        name: z.string().optional(),
        value: z.number().optional(),
        stageId: z.number().optional(),
        companyId: z.number().nullable().optional(),
        contactId: z.number().nullable().optional(),
        expectedCloseDate: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
        notes: z.string().nullable().optional(),
      });
      
      const dealData = updateDealSchema.parse(req.body);
      
      // If expectedCloseDate is provided as a string, convert it to a Date object
      if (dealData.expectedCloseDate) {
        dealData.expectedCloseDate = new Date(dealData.expectedCloseDate);
      }
      
      console.log("Validated deal data:", dealData);
      
      const deal = await storage.updateDeal(id, dealData);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(400).json({ message: "Invalid deal data", error: error.message });
    }
  });

  apiRouter.delete("/deals/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteDeal(id);
    if (!success) {
      return res.status(404).json({ message: "Deal not found" });
    }
    res.status(204).send();
  });

  // Tasks
  apiRouter.get("/tasks", async (req: Request, res: Response) => {
    const { contactId, companyId, leadId, dealId } = req.query;

    // Ottieni tutti i task
    const allTasks = await storage.getTasks();
    
    // Filtra in base ai parametri di query
    let filteredTasks = allTasks;
    
    if (contactId) {
      const contactIdNum = Number(contactId);
      filteredTasks = filteredTasks.filter(task => task.contactId === contactIdNum);
    }
    
    if (companyId) {
      const companyIdNum = Number(companyId);
      filteredTasks = filteredTasks.filter(task => task.companyId === companyIdNum);
    }
    
    if (leadId) {
      const leadIdNum = Number(leadId);
      filteredTasks = filteredTasks.filter(task => task.leadId === leadIdNum);
    }
    
    if (dealId) {
      const dealIdNum = Number(dealId);
      filteredTasks = filteredTasks.filter(task => task.dealId === dealIdNum);
    }
    
    res.json(filteredTasks);
  });

  apiRouter.get("/tasks/:id", async (req: Request, res: Response) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  apiRouter.post("/tasks", async (req: Request, res: Response) => {
    try {
      // Converti i campi data da stringhe ISO a oggetti Date
      const body = { ...req.body };
      
      // Converti le date se presenti
      if (body.startDateTime) {
        body.startDateTime = new Date(body.startDateTime);
      }
      if (body.endDateTime) {
        body.endDateTime = new Date(body.endDateTime);
      }
      if (body.dueDate) {
        body.dueDate = new Date(body.dueDate);
      }
      
      const taskData = insertTaskSchema.parse(body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Invalid task data", error: error.message });
    }
  });

  apiRouter.patch("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Converti i campi data da stringhe ISO a oggetti Date
      const body = { ...req.body };
      
      // Converti le date se presenti
      if (body.startDateTime) {
        body.startDateTime = new Date(body.startDateTime);
      }
      if (body.endDateTime) {
        body.endDateTime = new Date(body.endDateTime);
      }
      if (body.dueDate) {
        body.dueDate = new Date(body.dueDate);
      }
      
      const taskData = insertTaskSchema.partial().parse(body);
      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Invalid task data", error: error.message });
    }
  });

  apiRouter.delete("/tasks/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteTask(id);
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(204).send();
  });

  // Email Accounts
  apiRouter.get("/email-accounts", async (req: Request, res: Response) => {
    const accounts = await storage.getEmailAccounts();
    res.json(accounts);
  });

  apiRouter.post("/email-accounts", async (req: Request, res: Response) => {
    try {
      const accountData = insertEmailAccountSchema.parse(req.body);
      const account = await storage.createEmailAccount(accountData);
      
      // Register the account with the email service
      emailService.registerEmailAccount(account);
      
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid email account data", error: error.message });
    }
  });

  apiRouter.delete("/email-accounts/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    
    // Unregister from email service before deleting
    emailService.unregisterEmailAccount(id);
    
    const success = await storage.deleteEmailAccount(id);
    if (!success) {
      return res.status(404).json({ message: "Email account not found" });
    }
    res.status(204).send();
  });
  
  // Email account sync
  apiRouter.post("/email-accounts/:id/sync", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const account = await storage.getEmailAccount(id);
      
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      const emails = await emailService.fetchEmails(id);
      res.json({ 
        success: true, 
        message: `Synced ${emails.length} new emails`,
        count: emails.length 
      });
    } catch (error) {
      console.error("Failed to sync email account:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to sync email account", 
        error: error.message 
      });
    }
  });
  
  // Sync all email accounts
  apiRouter.post("/email-accounts/sync-all", async (req: Request, res: Response) => {
    try {
      const count = await emailService.syncAllAccounts();
      res.json({ 
        success: true, 
        message: `Synced ${count} new emails across all accounts`,
        count 
      });
    } catch (error) {
      console.error("Failed to sync email accounts:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to sync email accounts", 
        error: error.message 
      });
    }
  });
  
  // Update email account (partial update)
  apiRouter.patch("/email-accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updateData = insertEmailAccountSchema.partial().parse(req.body);
      const account = await storage.updateEmailAccount(id, updateData);
      
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid email account data", error: error.message });
    }
  });
  
  // Set primary email account
  apiRouter.post("/email-accounts/:id/set-primary", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.setPrimaryEmailAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      const accounts = await storage.getEmailAccounts();
      res.json({ 
        success: true,
        message: "Primary email account updated",
        accounts
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set primary account", error: error.message });
    }
  });
  
  // Toggle account active status
  apiRouter.post("/email-accounts/:id/toggle-active", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const account = await storage.toggleEmailAccountActive(id, isActive);
      
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      res.json({
        success: true,
        message: `Account ${isActive ? 'activated' : 'deactivated'} successfully`,
        account
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle account status", error: error.message });
    }
  });
  
  // Update account status (used internally by the email service)
  apiRouter.patch("/email-accounts/:id/status", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status, error } = req.body;
      
      const account = await storage.updateEmailAccountStatus(id, status, error);
      
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      res.json({
        success: true,
        message: "Account status updated",
        account
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update account status", error: error.message });
    }
  });

  // Emails
  apiRouter.get("/emails", async (req: Request, res: Response) => {
    const emails = await storage.getEmails();
    res.json(emails);
  });

  apiRouter.get("/emails/:id", async (req: Request, res: Response) => {
    const email = await storage.getEmail(Number(req.params.id));
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }
    res.json(email);
  });

  apiRouter.patch("/emails/:id/read", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const email = await storage.markEmailRead(id);
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }
    res.json(email);
  });
  
  // Email Signatures
  apiRouter.get("/signatures", async (req: Request, res: Response) => {
    const signatures = await storage.getSignatures();
    res.json(signatures);
  });
  
  apiRouter.get("/signatures/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const signature = await storage.getSignature(id);
    if (!signature) {
      return res.status(404).json({ message: "Signature not found" });
    }
    res.json(signature);
  });
  
  apiRouter.post("/signatures", async (req: Request, res: Response) => {
    try {
      const signatureData = insertSignatureSchema.parse(req.body);
      const signature = await storage.createSignature(signatureData);
      res.status(201).json(signature);
    } catch (error) {
      res.status(400).json({ message: "Invalid signature data", error: error.message });
    }
  });
  
  apiRouter.patch("/signatures/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const signatureData = insertSignatureSchema.partial().parse(req.body);
      const signature = await storage.updateSignature(id, signatureData);
      
      if (!signature) {
        return res.status(404).json({ message: "Signature not found" });
      }
      
      res.json(signature);
    } catch (error) {
      res.status(400).json({ message: "Invalid signature data", error: error.message });
    }
  });
  
  apiRouter.delete("/signatures/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteSignature(id);
    
    if (!success) {
      return res.status(404).json({ message: "Signature not found" });
    }
    
    res.status(204).send();
  });
  
  apiRouter.post("/signatures/:id/set-default", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.setDefaultSignature(id);
      
      if (!success) {
        return res.status(404).json({ message: "Signature not found" });
      }
      
      const signatures = await storage.getSignatures();
      res.json({
        success: true,
        message: "Default signature updated",
        signatures
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set default signature", error: error.message });
    }
  });
  
  // Account-Signature Associations
  apiRouter.get("/email-accounts/:accountId/signatures", async (req: Request, res: Response) => {
    const accountId = Number(req.params.accountId);
    const signatures = await storage.getAccountSignatures(accountId);
    res.json(signatures);
  });
  
  apiRouter.post("/email-accounts/:accountId/signatures/:signatureId", async (req: Request, res: Response) => {
    try {
      const accountId = Number(req.params.accountId);
      const signatureId = Number(req.params.signatureId);
      
      const accountSignature = await storage.assignSignatureToAccount(accountId, signatureId);
      res.status(201).json({
        success: true,
        message: "Signature assigned to account",
        accountSignature
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to assign signature", error: error.message });
    }
  });
  
  apiRouter.delete("/email-accounts/:accountId/signatures/:signatureId", async (req: Request, res: Response) => {
    const accountId = Number(req.params.accountId);
    const signatureId = Number(req.params.signatureId);
    
    const success = await storage.removeSignatureFromAccount(accountId, signatureId);
    
    if (!success) {
      return res.status(404).json({ message: "Association not found" });
    }
    
    res.status(204).send();
  });
  
  // Send an email
  apiRouter.post("/emails/send", async (req: Request, res: Response) => {
    try {
      const { accountId, to, cc, bcc, subject, body, contactId, companyId, dealId } = req.body;
      
      if (!accountId || !to || !subject || !body) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields" 
        });
      }
      
      const account = await storage.getEmailAccount(Number(accountId));
      if (!account) {
        return res.status(404).json({ 
          success: false, 
          message: "Email account not found" 
        });
      }
      
      // Prepare email data
      const emailData = {
        from: `${account.displayName} <${account.email}>`,
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        subject,
        body,
        accountId: account.id,
        contactId: contactId || null,
        companyId: companyId || null,
        dealId: dealId || null
      };
      
      // Send the email
      const sentEmail = await emailService.sendEmail(emailData);
      
      res.status(201).json({ 
        success: true, 
        message: "Email sent successfully", 
        email: sentEmail 
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send email", 
        error: error.message 
      });
    }
  });

  // Activities
  apiRouter.get("/activities", async (req: Request, res: Response) => {
    const activities = await storage.getActivities();
    res.json(activities);
  });

  // Meetings
  apiRouter.get("/meetings", async (req: Request, res: Response) => {
    const meetings = await storage.getMeetings();
    res.json(meetings);
  });

  apiRouter.get("/meetings/:id", async (req: Request, res: Response) => {
    const meeting = await storage.getMeeting(Number(req.params.id));
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.json(meeting);
  });

  apiRouter.post("/meetings", async (req: Request, res: Response) => {
    try {
      const meetingData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(meetingData);
      res.status(201).json(meeting);
    } catch (error) {
      res.status(400).json({ message: "Invalid meeting data", error: error.message });
    }
  });

  apiRouter.patch("/meetings/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const meetingData = insertMeetingSchema.partial().parse(req.body);
      const meeting = await storage.updateMeeting(id, meetingData);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ message: "Invalid meeting data", error: error.message });
    }
  });

  apiRouter.delete("/meetings/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteMeeting(id);
    if (!success) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.status(204).send();
  });

  // Dashboard Data (combined endpoint)
  apiRouter.get("/dashboard", async (req: Request, res: Response) => {
    const [contacts, companies, deals, tasks, activities, meetings] = await Promise.all([
      storage.getContacts(),
      storage.getCompanies(),
      storage.getDeals(),
      storage.getTasks(),
      storage.getActivities(),
      storage.getMeetings(),
    ]);

    // Calculate summary metrics
    const openDeals = deals.length;
    const totalDealValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const activeContacts = contacts.length;
    const totalCompanies = companies.length;
    
    // Get upcoming tasks (due in the next 7 days)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks.filter(
      task => task.dueDate && task.dueDate <= weekFromNow && !task.completed
    );
    const overdueTasks = tasks.filter(
      task => task.dueDate && task.dueDate < now && !task.completed
    );
    
    // Get upcoming meetings (in the next 7 days)
    const upcomingMeetings = meetings.filter(
      meeting => meeting.startTime <= weekFromNow && meeting.startTime >= now
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Get recent activities (last 10)
    const recentActivities = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
    
    // Organize deals by stage
    const stages = await storage.getPipelineStages();
    const dealsByStage = stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stageId === stage.id);
      return {
        stage,
        deals: stageDeals,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
      };
    });
    
    res.json({
      summary: {
        openDeals,
        totalDealValue,
        activeContacts,
        totalCompanies,
        upcomingTasksCount: upcomingTasks.length,
        overdueTasksCount: overdueTasks.length,
      },
      dealsByStage,
      recentActivities,
      upcomingMeetings: upcomingMeetings.slice(0, 3),
      upcomingTasks: upcomingTasks.slice(0, 5),
      recentContacts: contacts
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5),
    });
  });

  // AI Suggestions endpoint - no authentication required for demo purposes
  apiRouter.get("/ai/suggestions", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Default to first user for demo
      const suggestions = await aiService.generateSuggestions(userId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      res.status(500).json({ 
        error: "Failed to generate AI suggestions",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Endpoint for fixing contact-company relationships removed
  // The fixContactsRelationships function is still used at startup
  // but is no longer exposed via an API endpoint

  // Initialize super admin user on server startup
  await initializeSuperAdmin();
  
  // Execute the relationship fixing script at server startup
  try {
    console.log("Automatically running the relationship correction script at startup...");
    await fixContactsRelationships();
    console.log("Relationship correction script completed at startup.");
  } catch (error) {
    console.error("Error executing the script at startup:", error);
  }
  
  // Debug endpoints for relationship testing
  apiRouter.get("/debug/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Get related companies
      const companies = await storage.getContactCompanies(contactId);
      
      // Get related deals
      const deals = await storage.getDealsByContact(contactId);
      
      res.json({
        contact,
        companies,
        deals
      });
    } catch (error) {
      console.error("Error in debug contacts endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  apiRouter.get("/debug/companies/:id", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id, 10);
      if (isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      // Get related contacts
      const contacts = await storage.getCompanyContacts(companyId);
      
      // Get related deals
      const deals = await storage.getDealsByCompany(companyId);
      
      res.json({
        company,
        contacts,
        deals
      });
    } catch (error) {
      console.error("Error in debug companies endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  apiRouter.get("/debug/deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id, 10);
      if (isNaN(dealId)) {
        return res.status(400).json({ error: "Invalid deal ID" });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      res.json(deal);
    } catch (error) {
      console.error("Error in debug deals endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SYNERGIES API ENDPOINTS
  apiRouter.get("/synergies", async (req: Request, res: Response) => {
    try {
      const synergies = await storage.getSynergies();
      res.json(synergies);
    } catch (error) {
      console.error("Error fetching synergies:", error);
      res.status(500).json({ message: "Failed to fetch synergies" });
    }
  });
  
  // Get synergies for a specific deal
  apiRouter.get("/deals/:id/synergies", async (req: Request, res: Response) => {
    try {
      const dealId = Number(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Get all synergies and filter them for this deal
      const allSynergies = await storage.getSynergies();
      const dealSynergies = allSynergies.filter(synergy => synergy.dealId === dealId);
      
      res.json(dealSynergies);
    } catch (error) {
      console.error("Error fetching deal synergies:", error);
      res.status(500).json({ message: "Failed to fetch deal synergies" });
    }
  });
  
  // Create synergies for a deal with multiple contacts
  apiRouter.post("/deals/:id/synergies", async (req: Request, res: Response) => {
    try {
      const dealId = Number(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      if (!deal.companyId) {
        return res.status(400).json({ message: "Deal must have a company to create synergies" });
      }
      
      const { contactIds } = req.body;
      
      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ message: "Contact IDs array is required" });
      }
      
      const results = [];
      
      // First, remove any existing synergies for this deal
      const allSynergies = await storage.getSynergies();
      const dealSynergies = allSynergies.filter(synergy => synergy.dealId === dealId);
      
      // Get list of contacts that are not in the new list to delete
      for (const synergy of dealSynergies) {
        if (!contactIds.includes(synergy.contactId)) {
          await storage.deleteSynergy(synergy.id);
        }
      }
      
      // Create new synergies for each contact
      for (const contactId of contactIds) {
        // Skip if synergy already exists
        const existingSynergy = dealSynergies.find(s => s.contactId === contactId);
        if (existingSynergy) {
          results.push(existingSynergy);
          continue;
        }
        
        const synergyData = {
          contactId: contactId,
          companyId: deal.companyId,
          dealId: dealId,
          type: "business",
          status: "active",
          description: "Created from deal",
          startDate: new Date()
        };
        
        const newSynergy = await storage.createSynergy(synergyData);
        results.push(newSynergy);
      }
      
      res.status(201).json(results);
    } catch (error) {
      console.error("Error creating deal synergies:", error);
      res.status(500).json({ message: "Failed to create deal synergies", error: error.message });
    }
  });

  apiRouter.get("/synergies/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid synergy ID" });
      }
      
      const synergy = await storage.getSynergy(id);
      if (!synergy) {
        return res.status(404).json({ message: "Synergy not found" });
      }
      
      res.json(synergy);
    } catch (error) {
      console.error("Error fetching synergy:", error);
      res.status(500).json({ message: "Failed to fetch synergy" });
    }
  });

  apiRouter.get("/contacts/:id/synergies", async (req: Request, res: Response) => {
    try {
      const contactId = Number(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      const synergies = await storage.getSynergiesByContact(contactId);
      res.json(synergies);
    } catch (error) {
      console.error("Error fetching contact synergies:", error);
      res.status(500).json({ message: "Failed to fetch contact synergies" });
    }
  });

  apiRouter.get("/companies/:id/synergies", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const synergies = await storage.getSynergiesByCompany(companyId);
      res.json(synergies);
    } catch (error) {
      console.error("Error fetching company synergies:", error);
      res.status(500).json({ message: "Failed to fetch company synergies" });
    }
  });

  apiRouter.post("/synergies", async (req: Request, res: Response) => {
    try {
      // Parse and convert startDate from ISO string to Date object if it's a string
      let synergyData = { ...req.body };
      if (typeof synergyData.startDate === 'string') {
        synergyData.startDate = new Date(synergyData.startDate);
      }
      
      const validatedData = insertSynergySchema.parse(synergyData);
      const synergy = await storage.createSynergy(validatedData);
      res.status(201).json(synergy);
    } catch (error) {
      console.error("Error creating synergy:", error);
      res.status(400).json({ message: "Invalid synergy data", error: error.message });
    }
  });

  apiRouter.patch("/synergies/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid synergy ID" });
      }
      
      const synergyData = insertSynergySchema.partial().parse(req.body);
      const synergy = await storage.updateSynergy(id, synergyData);
      
      if (!synergy) {
        return res.status(404).json({ message: "Synergy not found" });
      }
      
      res.json(synergy);
    } catch (error) {
      console.error("Error updating synergy:", error);
      res.status(400).json({ message: "Invalid synergy data", error: error.message });
    }
  });

  apiRouter.delete("/synergies/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid synergy ID" });
      }
      
      const success = await storage.deleteSynergy(id);
      if (!success) {
        return res.status(404).json({ message: "Synergy not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting synergy:", error);
      res.status(500).json({ message: "Failed to delete synergy" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
