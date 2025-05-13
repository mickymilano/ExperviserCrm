import { db } from "./db";
import { IStorage } from "./storage";
import { 
  users, 
  leads, 
  contacts, 
  companies,
  areasOfActivity,
  pipelineStages,
  deals,
  synergies,
  contactEmails,
  type User,
  type InsertUser,
  type UserSession,
  type InsertUserSession, 
  type SecurityLog,
  type InsertSecurityLog, 
  type Lead,
  type InsertLead, 
  type Contact,
  type InsertContact, 
  type Company,
  type InsertCompany, 
  type AreaOfActivity,
  type InsertAreaOfActivity, 
  type PipelineStage,
  type InsertPipelineStage, 
  type Deal,
  type InsertDeal, 
  type Task,
  type InsertTask, 
  type EmailAccount,
  type InsertEmailAccount, 
  type Email,
  type InsertEmail, 
  type Signature,
  type InsertSignature, 
  type AccountSignature,
  type InsertAccountSignature, 
  type Activity,
  type InsertActivity, 
  type Meeting,
  type InsertMeeting,
  type ContactEmail,
  type InsertContactEmail
} from "@shared/schema";
import { eq, and, desc, sql, isNull, isNotNull, or, asc, inArray } from "drizzle-orm";

export class PostgresStorage implements IStorage {
  // USERS
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.fullName);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // USER SESSIONS
  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.token, token));
    return session;
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async updateUserSession(token: string, sessionData: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const [updatedSession] = await db
      .update(userSessions)
      .set(sessionData)
      .where(eq(userSessions.token, token))
      .returning();
    return updatedSession;
  }

  async deleteUserSession(token: string): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.token, token));
    return result.rowCount > 0;
  }

  async deleteAllUserSessions(userId: number): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.userId, userId));
    return result.rowCount > 0;
  }

  // SECURITY LOGS
  async getSecurityLogs(userId?: number): Promise<SecurityLog[]> {
    if (userId) {
      return await db
        .select()
        .from(securityLogs)
        .where(eq(securityLogs.userId, userId))
        .orderBy(desc(securityLogs.createdAt));
    } else {
      return await db
        .select()
        .from(securityLogs)
        .orderBy(desc(securityLogs.createdAt));
    }
  }

  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    const [newLog] = await db.insert(securityLogs).values(log).returning();
    return newLog;
  }

  // AREAS OF ACTIVITY
  async getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]> {
    return await db
      .select()
      .from(areasOfActivity)
      .where(eq(areasOfActivity.contactId, contactId))
      .orderBy(desc(areasOfActivity.isPrimary), areasOfActivity.companyName);
  }

  async getAreaOfActivity(id: number): Promise<AreaOfActivity | undefined> {
    const [area] = await db.select().from(areasOfActivity).where(eq(areasOfActivity.id, id));
    return area;
  }

  async createAreaOfActivity(area: InsertAreaOfActivity): Promise<AreaOfActivity> {
    // Se questa è la principale, rendi tutte le altre non principali
    if (area.isPrimary) {
      await db
        .update(areasOfActivity)
        .set({ isPrimary: false })
        .where(eq(areasOfActivity.contactId, area.contactId));
    }
    
    const [newArea] = await db.insert(areasOfActivity).values(area).returning();
    return newArea;
  }

  async updateAreaOfActivity(id: number, area: Partial<InsertAreaOfActivity>): Promise<AreaOfActivity | undefined> {
    // Se questa è la principale, rendi tutte le altre non principali
    if (area.isPrimary) {
      const [currentArea] = await db.select().from(areasOfActivity).where(eq(areasOfActivity.id, id));
      
      if (currentArea) {
        await db
          .update(areasOfActivity)
          .set({ isPrimary: false })
          .where(eq(areasOfActivity.contactId, currentArea.contactId));
      }
    }
    
    const [updatedArea] = await db
      .update(areasOfActivity)
      .set({ ...area, updatedAt: new Date() })
      .where(eq(areasOfActivity.id, id))
      .returning();
    
    return updatedArea;
  }

  async deleteAreaOfActivity(id: number): Promise<boolean> {
    const result = await db.delete(areasOfActivity).where(eq(areasOfActivity.id, id));
    return result.rowCount > 0;
  }
  
  // SYNERGIES
  async getAllSynergies(): Promise<Synergy[]> {
    return await db.select().from(synergies);
  }
  
  async getSynergiesByContactId(contactId: number): Promise<Synergy[]> {
    return await db.select().from(synergies).where(eq(synergies.contactId, contactId));
  }
  
  async getSynergiesByCompanyId(companyId: number): Promise<Synergy[]> {
    return await db.select().from(synergies).where(eq(synergies.companyId, companyId));
  }
  
  async getSynergiesByDealId(dealId: number): Promise<Synergy[]> {
    return await db.select().from(synergies).where(eq(synergies.dealId, dealId));
  }
  
  async getSynergyById(id: number): Promise<Synergy | undefined> {
    const [synergy] = await db.select().from(synergies).where(eq(synergies.id, id));
    return synergy;
  }
  
  async createSynergy(synergyData: InsertSynergy): Promise<Synergy> {
    const [newSynergy] = await db.insert(synergies).values(synergyData).returning();
    return newSynergy;
  }
  
  async updateSynergy(id: number, synergyData: Partial<InsertSynergy>): Promise<Synergy | undefined> {
    const [updatedSynergy] = await db
      .update(synergies)
      .set({ ...synergyData, updatedAt: new Date() })
      .where(eq(synergies.id, id))
      .returning();
    
    return updatedSynergy;
  }
  
  async deleteSynergy(id: number): Promise<boolean> {
    const result = await db.delete(synergies).where(eq(synergies.id, id));
    return result.rowCount > 0;
  }
  
  // Metodi per AreaOfActivity
  async getAreasOfActivityByContactId(contactId: number): Promise<AreaOfActivity[]> {
    return await db.select()
      .from(areasOfActivity)
      .where(eq(areasOfActivity.contactId, contactId));
  }
  
  async resetPrimaryAreasOfActivity(contactId: number): Promise<boolean> {
    const result = await db
      .update(areasOfActivity)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(areasOfActivity.contactId, contactId));
    
    return true;
  }

  async setPrimaryAreaOfActivity(id: number): Promise<boolean> {
    const [area] = await db.select().from(areasOfActivity).where(eq(areasOfActivity.id, id));
    
    if (!area) {
      return false;
    }
    
    // Rendi tutte le aree di attività per questo contatto non principali
    await db
      .update(areasOfActivity)
      .set({ isPrimary: false })
      .where(eq(areasOfActivity.contactId, area.contactId));
    
    // Imposta questa come principale
    const [updatedArea] = await db
      .update(areasOfActivity)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(areasOfActivity.id, id))
      .returning();
    
    return !!updatedArea;
  }

  // LEADS
  async getLeads(): Promise<Lead[]> {
    // I lead hanno status diversi (New, Qualified, ecc.)
    // Rimuoviamo il filtro status e restituiamo tutti
    try {
      // Seleziona esplicitamente solo le colonne che esistono nel database
      return await db.select({
        id: leads.id,
        name: leads.name,
        status: leads.status,
        source: leads.source,
        notes: leads.notes,
        companyName: leads.companyName,
        jobTitle: leads.jobTitle,
        leadOwner: leads.leadOwner,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      })
      .from(leads)
      .orderBy(leads.name);
    } catch (error) {
      console.error("Error in getLeads:", error);
      return [];
    }
  }
  
  async getAllLeads(): Promise<Lead[]> {
    // Metodo alias per compatibilità con l'interfaccia
    return this.getLeads();
  }
  
  async getLeadsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(leads);
    return result[0].count;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return result.rowCount > 0;
  }

  // CONTACTS
  async getContacts(): Promise<Contact[]> {
    // Simplified query without relational features to prevent 'map' errors
    // Rimosso filtro per status per ottenere tutti i contatti, come per leads
    console.log("PostgresStorage.getContacts: retrieving all contacts regardless of status");
    try {
      // Seleziona solo le colonne che esistono sicuramente nel database
      // La struttura della tabella è diversa da quella dello schema
      return await db.select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        status: contacts.status,
        companyEmail: contacts.companyEmail,
        privateEmail: contacts.privateEmail,
        mobilePhone: contacts.mobilePhone,
        officePhone: contacts.officePhone,
        privatePhone: contacts.privatePhone,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt
      })
      .from(contacts)
      .orderBy(contacts.firstName, contacts.lastName);
    } catch (error) {
      console.error("Error in getContacts:", error);
      return [];
    }
  }
  
  async getAllContacts(): Promise<Contact[]> {
    // Metodo alias per compatibilità con l'interfaccia
    return this.getContacts();
  }

  async getContactsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    return result[0].count;
  }

  async getRecentContacts(limit: number = 5): Promise<Contact[]> {
    try {
      console.log("PostgresStorage.getRecentContacts: retrieving recent contacts");
      // Use explicit column selection that matches the actual database schema
      return await db.select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        companyEmail: contacts.companyEmail,
        privateEmail: contacts.privateEmail,
        status: contacts.status,
        mobilePhone: contacts.mobilePhone,
        officePhone: contacts.officePhone,
        privatePhone: contacts.privatePhone,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt
      })
      .from(contacts)
      .orderBy(desc(contacts.updatedAt))
      .limit(limit);
    } catch (error) {
      console.error("Error in getRecentContacts:", error);
      return [];
    }
  }

  async getContactsByCompany(companyId: number): Promise<Contact[]> {
    try {
      console.log(`PostgresStorage.getContactsByCompany: retrieving contacts for company ${companyId}`);
      // Simplified query without relational features - find contacts by areas of activity
      const contactIds = await db
        .select({
          contactId: areasOfActivity.contactId
        })
        .from(areasOfActivity)
        .where(eq(areasOfActivity.companyId, companyId));
      
      console.log(`Found ${contactIds.length} contact IDs for company ${companyId}`);
      
      // If no contacts found, return empty array
      if (contactIds.length === 0) {
        return [];
      }
      
      // Get all contacts with these IDs - use explicit selection to avoid column not found errors
      const result = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          status: contacts.status,
          companyEmail: contacts.companyEmail,
          privateEmail: contacts.privateEmail,
          mobilePhone: contacts.mobilePhone,
          officePhone: contacts.officePhone,
          privatePhone: contacts.privatePhone,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        })
        .from(contacts)
        .where(inArray(contacts.id, contactIds.map(c => c.contactId)))
        .orderBy(contacts.firstName, contacts.lastName);
      
      console.log(`Retrieved ${result.length} contacts for company ${companyId}`);
      return result;
    } catch (error) {
      console.error(`Error in getContactsByCompany(${companyId}):`, error);
      return [];
    }
  }
  
  // Alias per compatibilità con lo script di correzione delle relazioni
  async getCompanyContacts(companyId: number): Promise<Contact[]> {
    return this.getContactsByCompany(companyId);
  }
  
  // Ottieni le aziende associate ad un contatto attraverso le aree di attività
  async getContactCompanies(contactId: number): Promise<Company[]> {
    console.log(`Getting companies for contact ID ${contactId}`);
    
    // Trova tutte le aree di attività per questo contatto
    const areas = await db
      .select()
      .from(areasOfActivity)
      .where(
        and(
          eq(areasOfActivity.contactId, contactId),
          isNotNull(areasOfActivity.companyId)
        )
      );
    
    console.log(`Found ${areas.length} areas of activity for contact ${contactId}`);
    
    if (areas.length === 0) {
      return [];
    }
    
    // Ottieni gli ID delle aziende (rimuovi i duplicati)
    const companyIds = [...new Set(areas.map(area => area.companyId).filter(Boolean))];
    console.log(`Unique company IDs for contact ${contactId}: ${companyIds.join(', ')}`);
    
    // Interroga le aziende corrispondenti
    const companiesData = await db
      .select()
      .from(companies)
      .where(inArray(companies.id, companyIds as number[]));
    
    console.log(`Retrieved ${companiesData.length} companies by ID`);
    
    // Aggiungi le informazioni delle aree di attività a ciascuna azienda
    const result = companiesData.map(company => {
      const area = areas.find(a => a.companyId === company.id);
      return {
        ...company,
        areaOfActivity: area
      };
    });
    
    console.log(`Returning ${result.length} companies for contact ${contactId}`);
    return result;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    // Simplified query without relational features
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    
    if (!contact) {
      return undefined;
    }
    
    // Separately get areas of activity
    const areas = await db.select().from(areasOfActivity).where(eq(areasOfActivity.contactId, id));
    
    // Return the contact with areas attached
    return {
      ...contact,
      areasOfActivity: areas
    };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contactData: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contactData, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    // Prima elimina tutte le aree di attività associate
    await db.delete(areasOfActivity).where(eq(areasOfActivity.contactId, id));
    
    // Poi elimina il contatto
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount > 0;
  }

  // COMPANIES
  async getCompanies(): Promise<Company[]> {
    // Simplified query without relational features
    // Rimosso filtro per status per ottenere tutte le aziende, come per contatti e leads
    console.log("PostgresStorage.getCompanies: retrieving all companies regardless of status");
    try {
      // Seleziona solo le colonne che esistono sicuramente
      return await db.select({
        id: companies.id,
        name: companies.name,
        website: companies.website,
        email: companies.email,
        status: companies.status,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt
      })
      .from(companies)
      .orderBy(companies.name);
    } catch (error) {
      console.error("Error in getCompanies:", error);
      return [];
    }
  }
  
  async getAllCompanies(): Promise<Company[]> {
    // Metodo alias per compatibilità con l'interfaccia
    return this.getCompanies();
  }
  
  async getCompaniesCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(companies);
    return result[0].count;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    // Simplified query - first get the company
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    
    if (!company) {
      return undefined;
    }
    
    // Then fetch areas of activity separately
    const areas = await db.select().from(areasOfActivity).where(eq(areasOfActivity.companyId, id));
    
    // Return the company with areas attached
    return {
      ...company,
      areasOfActivity: areas
    };
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    // Prima elimina tutte le aree di attività associate
    await db.delete(areasOfActivity).where(eq(areasOfActivity.companyId, id));
    
    // Poi elimina l'azienda
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  // PIPELINE STAGES
  async getPipelineStages(): Promise<PipelineStage[]> {
    return await db.select().from(pipelineStages).orderBy(pipelineStages.order);
  }
  
  async getAllPipelineStages(): Promise<PipelineStage[]> {
    // Metodo alias per compatibilità con l'interfaccia
    return this.getPipelineStages();
  }
  
  async updatePipelineStage(id: number, stageData: Partial<InsertPipelineStage>): Promise<PipelineStage | undefined> {
    const [updatedStage] = await db
      .update(pipelineStages)
      .set({ ...stageData, updatedAt: new Date() })
      .where(eq(pipelineStages.id, id))
      .returning();
    
    return updatedStage;
  }
  
  async deletePipelineStage(id: number): Promise<boolean> {
    const result = await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
    return result.rowCount > 0;
  }

  async getPipelineStage(id: number): Promise<PipelineStage | undefined> {
    const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, id));
    return stage;
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const [newStage] = await db.insert(pipelineStages).values(insertStage).returning();
    return newStage;
  }

  // DEALS
  async getDeals(): Promise<Deal[]> {
    // This method is kept for backward compatibility
    // Rimosso filtro per status per ottenere tutti i deal, come per contatti e aziende
    console.log("PostgresStorage.getDeals: retrieving all deals regardless of status");
    return this.getDealsWithFilters({}); // Nessun filtro per ottenere tutti i deal
  }
  
  async getAllDeals(): Promise<Deal[]> {
    // Metodo alias per compatibilità con l'interfaccia
    return this.getDeals();
  }
  
  async getDealsCount(options?: { status?: string }): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(deals);
    
    if (options?.status) {
      query = query.where(eq(deals.status, options.status));
    }
    
    const result = await query;
    return result[0].count;
  }
  
  async getRecentDeals(limit: number = 5): Promise<Deal[]> {
    try {
      // Use a basic query without problematic columns 
      const dealsResult = await db.select({
        id: deals.id,
        name: deals.name,
        value: deals.value,
        status: deals.status,
        contactId: deals.contactId,
        companyId: deals.companyId,
        stageId: deals.stageId, 
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt
      })
      .from(deals)
      .orderBy(desc(deals.updatedAt))
      .limit(limit);
        
      // Manually populate relations as needed
      const result = [];
      for (const deal of dealsResult) {
        // Get contact
        let contactData = null;
        if (deal.contactId) {
          const [contact] = await db.select().from(contacts).where(eq(contacts.id, deal.contactId));
          contactData = contact;
        }
      
      // Get company
      let companyData = null;
      if (deal.companyId) {
        const [company] = await db.select().from(companies).where(eq(companies.id, deal.companyId));
        companyData = company;
      }
      
      // Get stage
      let stageData = null;
      if (deal.stageId) {
        const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, deal.stageId));
        stageData = stage;
      }
      
      result.push({
        ...deal,
        contact: contactData,
        company: companyData,
        stage: stageData
      });
    }
    
    return result;
    } catch (error) {
      console.error("Error in getRecentDeals:", error);
      // Return empty array in case of error
      return [];
    }
  }
  
  async getDealsByStageId(stageId: number): Promise<Deal[]> {
    return this.getDealsWithFilters({ stageId });
  }
  
  async getDealsWithFilters(filters: {
    status?: string;
    companyId?: number;
    contactId?: number;
    stageId?: number;
  }): Promise<Deal[]> {
    try {
      // Build query with appropriate filters
      let query = db.select({
        id: deals.id,
        name: deals.name,
        value: deals.value,
        status: deals.status,
        contactId: deals.contactId,
        companyId: deals.companyId,
        stageId: deals.stageId,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt
      }).from(deals);
    
      // Apply filters
      if (filters.status) {
        query = query.where(eq(deals.status, filters.status));
      }
      
      if (filters.companyId) {
        query = query.where(eq(deals.companyId, filters.companyId));
      }
      
      if (filters.contactId) {
        query = query.where(eq(deals.contactId, filters.contactId));
      }
      
      if (filters.stageId) {
        query = query.where(eq(deals.stageId, filters.stageId));
      }
      
      // Order the results
      const dealsResult = await query.orderBy(asc(deals.stageId), desc(deals.value));
      
      // Manually populate relations
      const result = [];
      for (const deal of dealsResult) {
        // Get contact
        let contactData = null;
        if (deal.contactId) {
          const [contact] = await db.select({
            id: contacts.id,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
            email: contacts.email
          }).from(contacts).where(eq(contacts.id, deal.contactId));
          contactData = contact;
        }
        
        // Get company
        let companyData = null;
        if (deal.companyId) {
          const [company] = await db.select({
            id: companies.id,
            name: companies.name
          }).from(companies).where(eq(companies.id, deal.companyId));
          companyData = company;
        }
        
        // Get stage
        let stageData = null;
        if (deal.stageId) {
          const [stage] = await db.select({
            id: pipelineStages.id,
            name: pipelineStages.name,
            order: pipelineStages.order
          }).from(pipelineStages).where(eq(pipelineStages.id, deal.stageId));
          stageData = stage;
        }
        
        result.push({
          ...deal,
          contact: contactData,
          company: companyData,
          stage: stageData
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error in getDealsWithFilters:", error);
      return [];
    }
  }

  async getDealsByContact(contactId: number): Promise<Deal[]> {
    // Using a simpler approach without relational queries
    const dealsResult = await db.select().from(deals)
      .where(eq(deals.contactId, contactId))
      .orderBy(asc(deals.stageId), desc(deals.value));
    
    // Manually populate relations
    const result = [];
    for (const deal of dealsResult) {
      // Get contact
      let contactData = null;
      if (deal.contactId) {
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, deal.contactId));
        contactData = contact;
      }
      
      // Get company
      let companyData = null;
      if (deal.companyId) {
        const [company] = await db.select().from(companies).where(eq(companies.id, deal.companyId));
        companyData = company;
      }
      
      // Get stage
      let stageData = null;
      if (deal.stageId) {
        const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, deal.stageId));
        stageData = stage;
      }
      
      result.push({
        ...deal,
        contact: contactData,
        company: companyData,
        stage: stageData
      });
    }
    
    return result;
  }

  async getDealsByCompany(companyId: number): Promise<Deal[]> {
    // Using a simpler approach without relational queries
    const dealsResult = await db.select().from(deals)
      .where(eq(deals.companyId, companyId))
      .orderBy(asc(deals.stageId), desc(deals.value));
    
    // Manually populate relations
    const result = [];
    for (const deal of dealsResult) {
      // Get contact
      let contactData = null;
      if (deal.contactId) {
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, deal.contactId));
        contactData = contact;
      }
      
      // Get company
      let companyData = null;
      if (deal.companyId) {
        const [company] = await db.select().from(companies).where(eq(companies.id, deal.companyId));
        companyData = company;
      }
      
      // Get stage
      let stageData = null;
      if (deal.stageId) {
        const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, deal.stageId));
        stageData = stage;
      }
      
      result.push({
        ...deal,
        contact: contactData,
        company: companyData,
        stage: stageData
      });
    }
    
    return result;
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    // Using a simpler approach without relational queries
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    
    if (!deal) return undefined;
    
    // Manually populate relations
    // Get contact
    let contactData = null;
    if (deal.contactId) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, deal.contactId));
      contactData = contact;
    }
    
    // Get company
    let companyData = null;
    if (deal.companyId) {
      const [company] = await db.select().from(companies).where(eq(companies.id, deal.companyId));
      companyData = company;
    }
    
    // Get stage
    let stageData = null;
    if (deal.stageId) {
      const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, deal.stageId));
      stageData = stage;
    }
    
    return {
      ...deal,
      contact: contactData,
      company: companyData,
      stage: stageData
    };
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(insertDeal).returning();
    return newDeal;
  }

  async updateDeal(id: number, dealData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...dealData, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id));
    return result.rowCount > 0;
  }

  // TASKS
  async getTasks(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .orderBy(tasks.dueDate);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(insertTask).returning();
    return newTask;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  // EMAIL ACCOUNTS
  async getEmailAccounts(): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts).orderBy(emailAccounts.email);
  }

  async getEmailAccountsByUserId(userId: number): Promise<EmailAccount[]> {
    return await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId))
      .orderBy(desc(emailAccounts.isPrimary), emailAccounts.email);
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account;
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    // Se questo account è principale, rendi tutti gli altri non principali
    if (account.isPrimary) {
      await db
        .update(emailAccounts)
        .set({ isPrimary: false })
        .where(eq(emailAccounts.userId, account.userId));
    }
    
    const [newAccount] = await db.insert(emailAccounts).values(account).returning();
    return newAccount;
  }

  async updateEmailAccount(id: number, accountData: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined> {
    // Se questo account è principale, rendi tutti gli altri non principali
    if (accountData.isPrimary) {
      const [currentAccount] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
      
      if (currentAccount) {
        await db
          .update(emailAccounts)
          .set({ isPrimary: false })
          .where(eq(emailAccounts.userId, currentAccount.userId));
      }
    }
    
    const [updatedAccount] = await db
      .update(emailAccounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(emailAccounts.id, id))
      .returning();
    
    return updatedAccount;
  }

  async deleteEmailAccount(id: number): Promise<boolean> {
    const result = await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
    return result.rowCount > 0;
  }

  async setPrimaryEmailAccount(id: number): Promise<boolean> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    
    if (!account) {
      return false;
    }
    
    // Rendi tutti gli account per questo utente non principali
    await db
      .update(emailAccounts)
      .set({ isPrimary: false })
      .where(eq(emailAccounts.userId, account.userId));
    
    // Imposta questo come principale
    const [updatedAccount] = await db
      .update(emailAccounts)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(emailAccounts.id, id))
      .returning();
    
    return !!updatedAccount;
  }

  // EMAILS
  async getEmails(): Promise<Email[]> {
    return await db.select().from(emails).orderBy(desc(emails.date));
  }

  async getEmail(id: number): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const [newEmail] = await db.insert(emails).values(email).returning();
    return newEmail;
  }

  async updateEmail(id: number, emailData: Partial<InsertEmail>): Promise<Email | undefined> {
    const [updatedEmail] = await db
      .update(emails)
      .set(emailData)
      .where(eq(emails.id, id))
      .returning();
    
    return updatedEmail;
  }

  async markEmailAsRead(id: number): Promise<Email | undefined> {
    const [updatedEmail] = await db
      .update(emails)
      .set({ read: true })
      .where(eq(emails.id, id))
      .returning();
    
    return updatedEmail;
  }

  // SIGNATURES
  async getSignatures(userId: number): Promise<Signature[]> {
    return await db
      .select()
      .from(signatures)
      .where(eq(signatures.userId, userId))
      .orderBy(desc(signatures.isDefault), signatures.name);
  }

  async getSignature(id: number): Promise<Signature | undefined> {
    const [signature] = await db.select().from(signatures).where(eq(signatures.id, id));
    return signature;
  }

  async createSignature(signature: InsertSignature): Promise<Signature> {
    // Se questa firma è predefinita, rendi tutte le altre non predefinite
    if (signature.isDefault) {
      await db
        .update(signatures)
        .set({ isDefault: false })
        .where(eq(signatures.userId, signature.userId));
    }
    
    const [newSignature] = await db.insert(signatures).values(signature).returning();
    return newSignature;
  }

  async updateSignature(id: number, signatureData: Partial<InsertSignature>): Promise<Signature | undefined> {
    // Se questa firma è predefinita, rendi tutte le altre non predefinite
    if (signatureData.isDefault) {
      const [currentSignature] = await db.select().from(signatures).where(eq(signatures.id, id));
      
      if (currentSignature) {
        await db
          .update(signatures)
          .set({ isDefault: false })
          .where(eq(signatures.userId, currentSignature.userId));
      }
    }
    
    const [updatedSignature] = await db
      .update(signatures)
      .set({ ...signatureData, updatedAt: new Date() })
      .where(eq(signatures.id, id))
      .returning();
    
    return updatedSignature;
  }

  async deleteSignature(id: number): Promise<boolean> {
    // Prima elimina tutte le associazioni account-firma
    await db.delete(accountSignatures).where(eq(accountSignatures.signatureId, id));
    
    // Poi elimina la firma
    const result = await db.delete(signatures).where(eq(signatures.id, id));
    return result.rowCount > 0;
  }

  async setDefaultSignature(id: number): Promise<boolean> {
    const [signature] = await db.select().from(signatures).where(eq(signatures.id, id));
    
    if (!signature) {
      return false;
    }
    
    // Rendi tutte le firme per questo utente non predefinite
    await db
      .update(signatures)
      .set({ isDefault: false })
      .where(eq(signatures.userId, signature.userId));
    
    // Imposta questa come predefinita
    const [updatedSignature] = await db
      .update(signatures)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(signatures.id, id))
      .returning();
    
    return !!updatedSignature;
  }

  // ACCOUNT SIGNATURES
  async getEmailAccountSignatures(accountId: number): Promise<Signature[]> {
    const signatureAccounts = await db
      .select({
        signature: signatures
      })
      .from(signatures)
      .innerJoin(
        accountSignatures,
        and(
          eq(signatures.id, accountSignatures.signatureId),
          eq(accountSignatures.accountId, accountId)
        )
      )
      .orderBy(desc(signatures.isDefault), signatures.name);
    
    return signatureAccounts.map(sa => sa.signature);
  }

  async addSignatureToEmailAccount(accountId: number, signatureId: number): Promise<AccountSignature> {
    // Verifica che questa associazione non esista già
    const [existingAssociation] = await db
      .select()
      .from(accountSignatures)
      .where(
        and(
          eq(accountSignatures.accountId, accountId),
          eq(accountSignatures.signatureId, signatureId)
        )
      );
    
    if (existingAssociation) {
      return existingAssociation;
    }
    
    const [newAssociation] = await db
      .insert(accountSignatures)
      .values({
        accountId,
        signatureId,
        isActive: true
      })
      .returning();
    
    return newAssociation;
  }

  async removeSignatureFromEmailAccount(accountId: number, signatureId: number): Promise<boolean> {
    const result = await db
      .delete(accountSignatures)
      .where(
        and(
          eq(accountSignatures.accountId, accountId),
          eq(accountSignatures.signatureId, signatureId)
        )
      );
    
    return result.rowCount > 0;
  }

  // ACTIVITIES
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.date));
  }

  async getActivitiesByContact(contactId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.contactId, contactId))
      .orderBy(desc(activities.date));
  }

  async getActivitiesByCompany(companyId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.companyId, companyId))
      .orderBy(desc(activities.date));
  }

  async getActivitiesByDeal(dealId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.dealId, dealId))
      .orderBy(desc(activities.date));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // MEETINGS
  async getMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(meetings.startTime);
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    
    // Crea anche un'attività per questo meeting
    await this.createActivity({
      type: "meeting",
      date: meeting.startTime,
      description: `Meeting: ${meeting.title}`,
      userId: meeting.createdById,
      contactId: meeting.contactId || null,
      companyId: meeting.companyId || null,
      dealId: meeting.dealId || null,
      metadata: {
        meetingId: newMeeting.id,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        meetingType: meeting.meetingType
      }
    });
    
    return newMeeting;
  }

  async updateMeeting(id: number, meetingData: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ ...meetingData, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    
    return updatedMeeting;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    const result = await db.delete(meetings).where(eq(meetings.id, id));
    return result.rowCount > 0;
  }

  // SEED
  async seed() {
    // Questo metodo è necessario per l'interfaccia IStorage, ma nella versione PostgreSQL
    // il seed verrà gestito separatamente tramite migrations o script di inizializzazione
    console.log("Il metodo seed() è disabilitato nella versione PostgreSQL");
  }

  // SYNERGIES
  // Removed all synergies functionality as per requirements.

  // CONTACT EMAILS
  async getContactEmail(id: number): Promise<ContactEmail | null> {
    const [email] = await db.select().from(contactEmails).where(eq(contactEmails.id, id));
    return email || null;
  }

  async getContactEmails(contactId: number): Promise<ContactEmail[]> {
    return await db
      .select()
      .from(contactEmails)
      .where(eq(contactEmails.contactId, contactId))
      .orderBy(desc(contactEmails.isPrimary), asc(contactEmails.emailType));
  }

  async getPrimaryContactEmail(contactId: number): Promise<ContactEmail | null> {
    const [primaryEmail] = await db
      .select()
      .from(contactEmails)
      .where(and(
        eq(contactEmails.contactId, contactId),
        eq(contactEmails.isPrimary, true)
      ));
    return primaryEmail || null;
  }

  async createContactEmail(contactEmailData: InsertContactEmail): Promise<ContactEmail> {
    // If setting this email as primary, reset other emails to non-primary
    if (contactEmailData.isPrimary) {
      await db
        .update(contactEmails)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(contactEmails.contactId, contactEmailData.contactId));
    } 
    // If this is the first email for the contact, make it primary by default
    else {
      const existingEmails = await this.getContactEmails(contactEmailData.contactId);
      if (existingEmails.length === 0) {
        contactEmailData.isPrimary = true;
      }
    }

    const [newEmail] = await db
      .insert(contactEmails)
      .values({
        ...contactEmailData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return newEmail;
  }

  async updateContactEmail(id: number, contactEmailData: Partial<ContactEmail>): Promise<ContactEmail> {
    // If setting this email as primary, reset other emails to non-primary
    if (contactEmailData.isPrimary) {
      const [email] = await db.select().from(contactEmails).where(eq(contactEmails.id, id));
      if (email) {
        await db
          .update(contactEmails)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(and(
            eq(contactEmails.contactId, email.contactId),
            sql`${contactEmails.id} != ${id}`
          ));
      }
    }
    
    const [updatedEmail] = await db
      .update(contactEmails)
      .set({ ...contactEmailData, updatedAt: new Date() })
      .where(eq(contactEmails.id, id))
      .returning();
      
    return updatedEmail;
  }

  async deleteContactEmail(id: number): Promise<boolean> {
    // Check if this is a primary email
    const [email] = await db.select().from(contactEmails).where(eq(contactEmails.id, id));
    if (!email) {
      return false;
    }
    
    const result = await db.delete(contactEmails).where(eq(contactEmails.id, id));
    
    // If we deleted a primary email, set another one as primary if available
    if (email.isPrimary) {
      const [anotherEmail] = await db
        .select()
        .from(contactEmails)
        .where(eq(contactEmails.contactId, email.contactId))
        .limit(1);
        
      if (anotherEmail) {
        await db
          .update(contactEmails)
          .set({ isPrimary: true, updatedAt: new Date() })
          .where(eq(contactEmails.id, anotherEmail.id));
      }
    }
    
    return result.rowCount > 0;
  }

  async setContactEmailAsPrimary(id: number): Promise<ContactEmail> {
    const [email] = await db.select().from(contactEmails).where(eq(contactEmails.id, id));
    if (!email) {
      throw new Error(`ContactEmail with id ${id} not found`);
    }
    
    // Reset all emails for this contact to non-primary
    await db
      .update(contactEmails)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(contactEmails.contactId, email.contactId));
    
    // Set the selected email as primary
    const [updatedEmail] = await db
      .update(contactEmails)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(contactEmails.id, id))
      .returning();
      
    return updatedEmail;
  }
}