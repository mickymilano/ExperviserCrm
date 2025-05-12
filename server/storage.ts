import { 
  User, InsertUser, 
  Contact, InsertContact, 
  Company, InsertCompany,
  Deal, InsertDeal,
  Lead, InsertLead,
  PipelineStage,
  AreaOfActivity, InsertAreaOfActivity,
  ContactEmail, InsertContactEmail
} from "@shared/schema";

/**
 * Interface for storage operations
 * Definisce tutte le operazioni CRUD per le entità del CRM
 */
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  archiveUser(id: number): Promise<boolean>;
  
  // Auth operations
  authenticateUser(username: string, password: string): Promise<User | null>;
  createSession(userId: number): Promise<{ token: string, expiresAt: Date }>;
  validateSession(token: string): Promise<{ userId: number, expiresAt: Date } | null>;
  clearSession(token: string): Promise<boolean>;
  
  // Lead operations
  getLeads(options?: {
    search?: string,
    limit?: number,
    offset?: number,
  }): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | null>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number): Promise<boolean>;
  convertLeadToContact(id: number, contactData?: Partial<InsertContact>, companyData?: Partial<InsertCompany>): Promise<{ contact: Contact, company?: Company }>;
  
  // Contact operations
  getContacts(options?: {
    search?: string,
    status?: 'active' | 'archived',
    companyId?: number,
    excludeCompanyId?: number,
    includeAreas?: boolean,
    excludeContactIds?: number[],
    limit?: number,
    offset?: number,
  }): Promise<Contact[]>;
  getContact(id: number, includeAreas?: boolean): Promise<Contact | null>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  archiveContact(id: number): Promise<boolean>;
  
  // Contact Email operations
  getContactEmails(contactId: number): Promise<ContactEmail[]>;
  getContactEmail(id: number): Promise<ContactEmail | null>;
  createContactEmail(email: InsertContactEmail): Promise<ContactEmail>;
  updateContactEmail(id: number, email: Partial<InsertContactEmail>): Promise<ContactEmail>;
  deleteContactEmail(id: number): Promise<boolean>;
  setPrimaryEmail(id: number, contactId: number): Promise<boolean>;
  
  // Area of Activity operations
  getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]>;
  getAreaOfActivity(id: number): Promise<AreaOfActivity | null>;
  createAreaOfActivity(area: InsertAreaOfActivity): Promise<AreaOfActivity>;
  updateAreaOfActivity(id: number, area: Partial<InsertAreaOfActivity>): Promise<AreaOfActivity>;
  deleteAreaOfActivity(id: number): Promise<boolean>;
  setPrimaryArea(id: number, contactId: number): Promise<boolean>;
  
  // Company operations
  getCompanies(options?: {
    search?: string,
    status?: 'active' | 'archived',
    includeActiveRep?: boolean,
    limit?: number,
    offset?: number,
  }): Promise<Company[]>;
  getCompany(id: number): Promise<Company | null>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  archiveCompany(id: number): Promise<boolean>;
  
  // Deal operations
  getDeals(options?: {
    search?: string,
    status?: 'active' | 'archived',
    companyId?: number,
    contactId?: number,
    limit?: number,
    offset?: number,
  }): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | null>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal>;
  archiveDeal(id: number): Promise<boolean>;
  
  // Pipeline Stage operations
  getPipelineStages(): Promise<PipelineStage[]>;
  
  // Dashboard operations
  getDashboardSummary(): Promise<{
    openDeals: number,
    totalDealValue: number,
    activeContacts: number,
    activeCompanies: number
  }>;
}

// Classe base per l'implementazione in memoria (da utilizzare per lo sviluppo)
export class MemStorage implements IStorage {
  // Per ora implementiamo solo gli stub dei metodi richiesti, 
  // l'implementazione effettiva avverrà in una fase successiva
  
  // User operations
  async getUser(id: number): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  
  async getUserByUsername(username: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  
  async createUser(user: InsertUser): Promise<User> {
    throw new Error("Method not implemented.");
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    throw new Error("Method not implemented.");
  }
  
  async archiveUser(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Auth operations
  async authenticateUser(username: string, password: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  
  async createSession(userId: number): Promise<{ token: string; expiresAt: Date; }> {
    throw new Error("Method not implemented.");
  }
  
  async validateSession(token: string): Promise<{ userId: number; expiresAt: Date; } | null> {
    throw new Error("Method not implemented.");
  }
  
  async clearSession(token: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Lead operations
  async getLeads(options?: { search?: string; limit?: number; offset?: number; }): Promise<Lead[]> {
    throw new Error("Method not implemented.");
  }
  
  async getLead(id: number): Promise<Lead | null> {
    throw new Error("Method not implemented.");
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    throw new Error("Method not implemented.");
  }
  
  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead> {
    throw new Error("Method not implemented.");
  }
  
  async deleteLead(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  async convertLeadToContact(id: number, contactData?: Partial<InsertContact>, companyData?: Partial<InsertCompany>): Promise<{ contact: Contact; company?: Company; }> {
    throw new Error("Method not implemented.");
  }
  
  // Contact operations
  async getContacts(options?: { search?: string; status?: "active" | "archived"; companyId?: number; excludeCompanyId?: number; includeAreas?: boolean; excludeContactIds?: number[]; limit?: number; offset?: number; }): Promise<Contact[]> {
    throw new Error("Method not implemented.");
  }
  
  async getContact(id: number, includeAreas?: boolean): Promise<Contact | null> {
    throw new Error("Method not implemented.");
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    throw new Error("Method not implemented.");
  }
  
  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact> {
    throw new Error("Method not implemented.");
  }
  
  async archiveContact(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Contact Email operations
  async getContactEmails(contactId: number): Promise<ContactEmail[]> {
    throw new Error("Method not implemented.");
  }
  
  async getContactEmail(id: number): Promise<ContactEmail | null> {
    throw new Error("Method not implemented.");
  }
  
  async createContactEmail(email: InsertContactEmail): Promise<ContactEmail> {
    throw new Error("Method not implemented.");
  }
  
  async updateContactEmail(id: number, email: Partial<InsertContactEmail>): Promise<ContactEmail> {
    throw new Error("Method not implemented.");
  }
  
  async deleteContactEmail(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  async setPrimaryEmail(id: number, contactId: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Area of Activity operations
  async getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]> {
    throw new Error("Method not implemented.");
  }
  
  async getAreaOfActivity(id: number): Promise<AreaOfActivity | null> {
    throw new Error("Method not implemented.");
  }
  
  async createAreaOfActivity(area: InsertAreaOfActivity): Promise<AreaOfActivity> {
    throw new Error("Method not implemented.");
  }
  
  async updateAreaOfActivity(id: number, area: Partial<InsertAreaOfActivity>): Promise<AreaOfActivity> {
    throw new Error("Method not implemented.");
  }
  
  async deleteAreaOfActivity(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  async setPrimaryArea(id: number, contactId: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Company operations
  async getCompanies(options?: { search?: string; status?: "active" | "archived"; includeActiveRep?: boolean; limit?: number; offset?: number; }): Promise<Company[]> {
    throw new Error("Method not implemented.");
  }
  
  async getCompany(id: number): Promise<Company | null> {
    throw new Error("Method not implemented.");
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    throw new Error("Method not implemented.");
  }
  
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    throw new Error("Method not implemented.");
  }
  
  async archiveCompany(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Deal operations
  async getDeals(options?: { search?: string; status?: "active" | "archived"; companyId?: number; contactId?: number; limit?: number; offset?: number; }): Promise<Deal[]> {
    throw new Error("Method not implemented.");
  }
  
  async getDeal(id: number): Promise<Deal | null> {
    throw new Error("Method not implemented.");
  }
  
  async createDeal(deal: InsertDeal): Promise<Deal> {
    throw new Error("Method not implemented.");
  }
  
  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal> {
    throw new Error("Method not implemented.");
  }
  
  async archiveDeal(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  
  // Pipeline Stage operations
  async getPipelineStages(): Promise<PipelineStage[]> {
    throw new Error("Method not implemented.");
  }
  
  // Dashboard operations
  async getDashboardSummary(): Promise<{ openDeals: number; totalDealValue: number; activeContacts: number; activeCompanies: number; }> {
    throw new Error("Method not implemented.");
  }
}

// Istanza predefinita per lo storage
export const storage = new MemStorage();