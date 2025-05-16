import {
  users, User, InsertUser,
  contacts, Contact, InsertContact,
  companies, Company, InsertCompany,
  deals, Deal, InsertDeal,
  leads, Lead, InsertLead,
  pipelineStages, PipelineStage, InsertPipelineStage,
  areasOfActivity, AreaOfActivity, InsertAreaOfActivity,
  synergies, Synergy, InsertSynergy,
  contactEmails, ContactEmail, InsertContactEmail,
  branches, Branch, InsertBranch,
} from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

/**
 * Interfaccia per le operazioni di storage
 * Questa interfaccia definisce tutte le operazioni CRUD per le entità del CRM
 */
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Contact operations
  getContact(id: number): Promise<Contact | null>;
  getAllContacts(): Promise<Contact[]>;
  getContacts(): Promise<Contact[]>; // Aggiunto per compatibilità
  createContact(contactData: InsertContact): Promise<Contact>;
  updateContact(id: number, contactData: Partial<Contact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  getContactsCount(): Promise<number>;
  getRecentContacts(limit?: number): Promise<Contact[]>;

  // Company operations
  getCompany(id: number): Promise<Company | null>;
  getAllCompanies(): Promise<Company[]>;
  getCompanies(): Promise<Company[]>; // Aggiunto per compatibilità
  createCompany(companyData: InsertCompany): Promise<Company>;
  updateCompany(id: number, companyData: Partial<Company>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  getCompaniesCount(): Promise<number>;

  // Deal operations
  getDeal(id: number): Promise<Deal | null>;
  getAllDeals(): Promise<Deal[]>;
  getDealsWithFilters(filters: { status?: string; companyId?: number; contactId?: number }): Promise<Deal[]>;
  createDeal(dealData: InsertDeal): Promise<Deal>;
  updateDeal(id: number, dealData: Partial<Deal>): Promise<Deal>;
  deleteDeal(id: number): Promise<void>;
  getDealsByStageId(stageId: number): Promise<Deal[]>;
  getDealsCount(options?: { status?: string }): Promise<number>;
  getRecentDeals(limit?: number): Promise<Deal[]>;

  // Lead operations
  getLead(id: number): Promise<Lead | null>;
  getAllLeads(): Promise<Lead[]>;
  getLeads(): Promise<Lead[]>; // Aggiunto per compatibilità
  createLead(leadData: InsertLead): Promise<Lead>;
  updateLead(id: number, leadData: Partial<Lead>): Promise<Lead>;
  deleteLead(id: number): Promise<void>;
  getLeadsCount(): Promise<number>;

  // Pipeline Stage operations
  getPipelineStage(id: number): Promise<PipelineStage | null>;
  getAllPipelineStages(): Promise<PipelineStage[]>;
  createPipelineStage(stageData: InsertPipelineStage): Promise<PipelineStage>;
  updatePipelineStage(id: number, stageData: Partial<PipelineStage>): Promise<PipelineStage>;
  deletePipelineStage(id: number): Promise<void>;

  // Area of Activity operations (relazioni tra contatti e aziende)
  getAreaOfActivity(id: number): Promise<AreaOfActivity | null>;
  getAreasOfActivityByContactId(contactId: number): Promise<AreaOfActivity[]>;
  getAreasOfActivityByCompanyId(companyId: number): Promise<AreaOfActivity[]>;
  createAreaOfActivity(areaData: InsertAreaOfActivity): Promise<AreaOfActivity>;
  updateAreaOfActivity(id: number, areaData: Partial<AreaOfActivity>): Promise<AreaOfActivity>;
  deleteAreaOfActivity(id: number): Promise<void>;
  resetPrimaryAreasOfActivity(contactId: number): Promise<void>;
  
  // Synergy operations
  getSynergyById(id: number): Promise<Synergy | null>;
  getAllSynergies(): Promise<Synergy[]>;
  getSynergiesByContactId(contactId: number): Promise<Synergy[]>;
  getSynergiesByCompanyId(companyId: number): Promise<Synergy[]>;
  getSynergiesByDealId(dealId: number): Promise<Synergy[]>;
  createSynergy(synergyData: InsertSynergy): Promise<Synergy>;
  updateSynergy(id: number, synergyData: Partial<Synergy>): Promise<Synergy>;
  deleteSynergy(id: number): Promise<void>;

  // Contact Email operations
  getContactEmail(id: number): Promise<ContactEmail | null>;
  getContactEmails(contactId: number): Promise<ContactEmail[]>;
  getPrimaryContactEmail(contactId: number): Promise<ContactEmail | null>;
  createContactEmail(contactEmailData: InsertContactEmail): Promise<ContactEmail>;
  updateContactEmail(id: number, contactEmailData: Partial<ContactEmail>): Promise<ContactEmail>;
  deleteContactEmail(id: number): Promise<boolean>;
  setContactEmailAsPrimary(id: number): Promise<ContactEmail>;

  // Branch operations
  getBranch(id: number): Promise<Branch | null>;
  getBranches(): Promise<Branch[]>;
  getBranchesByCompanyId(companyId: number): Promise<Branch[]>;
  createBranch(branchData: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branchData: Partial<Branch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;
}

/**
 * Implementazione di storage in memoria
 * Questa classe implementa tutte le operazioni definite nell'interfaccia IStorage
 * utilizzando storage temporaneo in memoria
 */
export class MemStorage implements IStorage {
  private users: User[] = [];
  private contacts: Contact[] = [];
  private companies: Company[] = [];
  private deals: Deal[] = [];
  private leads: Lead[] = [];
  private pipelineStages: PipelineStage[] = [];
  private areasOfActivity: AreaOfActivity[] = [];
  private synergies: Synergy[] = [];
  private contactEmails: ContactEmail[] = [];
  private branches: Branch[] = [];

  private nextIds = {
    users: 1,
    contacts: 1,
    companies: 1,
    deals: 1,
    leads: 1,
    pipelineStages: 1,
    areasOfActivity: 1,
    synergies: 1,
    contactEmails: 1,
    branches: 1,
  };
  
  // Funzioni di conteggio
  async getContactsCount(): Promise<number> {
    return this.contacts.length;
  }
  
  async getCompaniesCount(): Promise<number> {
    return this.companies.length;
  }
  
  async getDealsWithFilters(filters: { status?: string; companyId?: number; contactId?: number }): Promise<Deal[]> {
    let filteredDeals = [...this.deals];
    
    if (filters.status) {
      filteredDeals = filteredDeals.filter(deal => deal.status === filters.status);
    }
    
    if (filters.companyId) {
      filteredDeals = filteredDeals.filter(deal => deal.companyId === filters.companyId);
    }
    
    if (filters.contactId) {
      filteredDeals = filteredDeals.filter(deal => deal.contactId === filters.contactId);
    }
    
    return filteredDeals;
  }
  
  async getDealsCount(options?: { status?: string }): Promise<number> {
    if (options?.status) {
      return this.deals.filter(deal => deal.status === options.status).length;
    }
    return this.deals.length;
  }
  
  async getLeadsCount(): Promise<number> {
    return this.leads.length;
  }
  
  // Funzioni per ottenere elementi recenti
  async getRecentDeals(limit: number = 5): Promise<Deal[]> {
    return [...this.deals]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }
  
  async getRecentContacts(limit: number = 5): Promise<Contact[]> {
    return [...this.contacts]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  constructor() {
    // Inizializza con dati di esempio se richiesto
    
    // Aggiungi utente amministratore di default
    if (this.users.length === 0) {
      this.users.push({
        id: this.nextIds.users++,
        username: 'michele',
        password: '$2b$10$xP/0vn6gaY5DmxjgfOp.WejfD4WuO1h80RUMQqHwPPRoKqc1dpmcK', // admin_admin_69
        email: 'michele@experviser.com',
        fullName: 'Michele Amministratore',
        role: 'super_admin',
        status: 'active',
        avatar: null,
        backupEmail: null,
        emailVerified: true,
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      });
      
      // Utente di debug per sviluppo
      this.users.push({
        id: this.nextIds.users++,
        username: 'debug',
        password: '$2b$10$xP/0vn6gaY5DmxjgfOp.WejfD4WuO1h80RUMQqHwPPRoKqc1dpmcK', // admin_admin_69
        email: 'debug@example.com',
        fullName: 'Utente Debug',
        role: 'super_admin',
        status: 'active',
        avatar: null,
        backupEmail: null,
        emailVerified: true,
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      });
      
      console.log('Utenti predefiniti aggiunti al sistema');
    }
  }

  // USER OPERATIONS

  async getUser(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const newUser: User = {
      id: this.nextIds.users++,
      ...userData,
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
      avatar: null,
      preferences: null
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };

    this.users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  // CONTACT OPERATIONS

  async getContact(id: number): Promise<Contact | null> {
    return this.contacts.find(contact => contact.id === id) || null;
  }

  async getAllContacts(): Promise<Contact[]> {
    return [...this.contacts];
  }
  
  async getContacts(): Promise<Contact[]> {
    return this.getAllContacts();
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    const now = new Date();
    const newContact: Contact = {
      id: this.nextIds.contacts++,
      ...contactData,
      createdAt: now,
      updatedAt: now,
      // Assegna valori di default per i campi opzionali
      address: contactData.address || null,
      city: contactData.city || null,
      region: contactData.region || null,
      country: contactData.country || null,
      postalCode: contactData.postalCode || null,
      phone: contactData.phone || null,
      mobile: contactData.mobile || null,
      email: contactData.email || null,
      website: contactData.website || null,
      birthday: contactData.birthday || null,
      notes: contactData.notes || null,
      source: contactData.source || null,
      tags: contactData.tags || null,
      avatar: contactData.avatar || null,
      customFields: contactData.customFields || null
    };
    this.contacts.push(newContact);
    return newContact;
  }

  async updateContact(id: number, contactData: Partial<Contact>): Promise<Contact> {
    const index = this.contacts.findIndex(contact => contact.id === id);
    if (index === -1) {
      throw new Error(`Contact with id ${id} not found`);
    }

    const updatedContact = {
      ...this.contacts[index],
      ...contactData,
      updatedAt: new Date()
    };

    this.contacts[index] = updatedContact;
    return updatedContact;
  }

  async deleteContact(id: number): Promise<void> {
    const index = this.contacts.findIndex(contact => contact.id === id);
    if (index !== -1) {
      this.contacts.splice(index, 1);
    }

    // Elimina anche le aree di attività collegate
    this.areasOfActivity = this.areasOfActivity.filter(area => area.contactId !== id);
    
    // Aggiorna i deal che fanno riferimento a questo contatto
    this.deals = this.deals.map(deal => {
      if (deal.contactId === id) {
        return { ...deal, contactId: null };
      }
      return deal;
    });
  }

  // COMPANY OPERATIONS

  async getCompany(id: number): Promise<Company | null> {
    return this.companies.find(company => company.id === id) || null;
  }

  async getAllCompanies(): Promise<Company[]> {
    return [...this.companies];
  }
  
  async getCompanies(): Promise<Company[]> {
    return this.getAllCompanies();
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const now = new Date();
    const newCompany: Company = {
      id: this.nextIds.companies++,
      ...companyData,
      createdAt: now,
      updatedAt: now,
      // Assegna valori di default per i campi opzionali
      email: companyData.email || null,
      phone: companyData.phone || null,
      address: companyData.address || null,
      city: companyData.city || null,
      region: companyData.region || null,
      country: companyData.country || null,
      postalCode: companyData.postalCode || null,
      website: companyData.website || null,
      industry: companyData.industry || null,
      description: companyData.description || null,
      employeeCount: companyData.employeeCount || null,
      annualRevenue: companyData.annualRevenue || null,
      foundedYear: companyData.foundedYear || null,
      logo: companyData.logo || null,
      tags: companyData.tags || null,
      notes: companyData.notes || null,
      customFields: companyData.customFields || null,
      parentCompanyId: companyData.parentCompanyId || null,
      linkedinUrl: companyData.linkedinUrl || null,
      locationTypes: companyData.locationTypes || null
    };
    this.companies.push(newCompany);
    return newCompany;
  }

  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company> {
    const index = this.companies.findIndex(company => company.id === id);
    if (index === -1) {
      throw new Error(`Company with id ${id} not found`);
    }

    const updatedCompany = {
      ...this.companies[index],
      ...companyData,
      updatedAt: new Date()
    };

    this.companies[index] = updatedCompany;
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    const index = this.companies.findIndex(company => company.id === id);
    if (index !== -1) {
      this.companies.splice(index, 1);
    }

    // Elimina anche le aree di attività collegate
    this.areasOfActivity = this.areasOfActivity.filter(area => area.companyId !== id);
    
    // Aggiorna i deal che fanno riferimento a questa azienda
    this.deals = this.deals.map(deal => {
      if (deal.companyId === id) {
        return { ...deal, companyId: null };
      }
      return deal;
    });
  }

  // DEAL OPERATIONS

  async getDeal(id: number): Promise<Deal | null> {
    return this.deals.find(deal => deal.id === id) || null;
  }

  async getAllDeals(): Promise<Deal[]> {
    return [...this.deals];
  }

  async createDeal(dealData: InsertDeal): Promise<Deal> {
    const now = new Date();
    const newDeal: Deal = {
      id: this.nextIds.deals++,
      ...dealData,
      createdAt: now,
      updatedAt: now,
      // Assegna valori di default per i campi opzionali
      contactId: dealData.contactId || null,
      companyId: dealData.companyId || null,
      value: dealData.value || null,
      notes: dealData.notes || null,
      tags: dealData.tags || null,
      lastContactedAt: dealData.lastContactedAt || null,
      expectedCloseDate: dealData.expectedCloseDate || null,
      actualCloseDate: dealData.actualCloseDate || null,
      nextFollowUpAt: dealData.nextFollowUpAt || null,
      description: dealData.description || null,
      probability: dealData.probability || null,
      stageId: dealData.stageId || null
    };
    this.deals.push(newDeal);
    return newDeal;
  }

  async updateDeal(id: number, dealData: Partial<Deal>): Promise<Deal> {
    const index = this.deals.findIndex(deal => deal.id === id);
    if (index === -1) {
      throw new Error(`Deal with id ${id} not found`);
    }

    const updatedDeal = {
      ...this.deals[index],
      ...dealData,
      updatedAt: new Date()
    };

    this.deals[index] = updatedDeal;
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<void> {
    const index = this.deals.findIndex(deal => deal.id === id);
    if (index !== -1) {
      this.deals.splice(index, 1);
    }
  }

  async getDealsByStageId(stageId: number): Promise<Deal[]> {
    return this.deals.filter(deal => deal.stageId === stageId);
  }

  // LEAD OPERATIONS

  async getLead(id: number): Promise<Lead | null> {
    return this.leads.find(lead => lead.id === id) || null;
  }

  async getAllLeads(): Promise<Lead[]> {
    return [...this.leads];
  }
  
  async getLeads(): Promise<Lead[]> {
    return this.getAllLeads();
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const now = new Date();
    const newLead: Lead = {
      id: this.nextIds.leads++,
      ...leadData,
      createdAt: now,
      updatedAt: now,
      // Assegna valori di default per i campi opzionali
      email: leadData.email || null,
      role: leadData.role || null,
      status: leadData.status || null,
      phone: leadData.phone || null,
      address: leadData.address || null,
      city: leadData.city || null,
      region: leadData.region || null,
      country: leadData.country || null,
      postalCode: leadData.postalCode || null,
      company: leadData.company || null,
      website: leadData.website || null,
      source: leadData.source || null,
      notes: leadData.notes || null,
      customFields: leadData.customFields || null,
      assignedToId: leadData.assignedToId || null
    };
    this.leads.push(newLead);
    return newLead;
  }

  async updateLead(id: number, leadData: Partial<Lead>): Promise<Lead> {
    const index = this.leads.findIndex(lead => lead.id === id);
    if (index === -1) {
      throw new Error(`Lead with id ${id} not found`);
    }

    const updatedLead = {
      ...this.leads[index],
      ...leadData,
      updatedAt: new Date()
    };

    this.leads[index] = updatedLead;
    return updatedLead;
  }

  async deleteLead(id: number): Promise<void> {
    const index = this.leads.findIndex(lead => lead.id === id);
    if (index !== -1) {
      this.leads.splice(index, 1);
    }
  }

  // PIPELINE STAGE OPERATIONS

  async getPipelineStage(id: number): Promise<PipelineStage | null> {
    return this.pipelineStages.find(stage => stage.id === id) || null;
  }

  async getAllPipelineStages(): Promise<PipelineStage[]> {
    return [...this.pipelineStages].sort((a, b) => a.position - b.position);
  }

  async createPipelineStage(stageData: InsertPipelineStage): Promise<PipelineStage> {
    const now = new Date();
    const newStage: PipelineStage = {
      id: this.nextIds.pipelineStages++,
      ...stageData,
      createdAt: now,
      updatedAt: now,
      // Assegna valori di default per i campi opzionali
      description: stageData.description || null,
      color: stageData.color || null
    };
    this.pipelineStages.push(newStage);
    return newStage;
  }

  async updatePipelineStage(id: number, stageData: Partial<PipelineStage>): Promise<PipelineStage> {
    const index = this.pipelineStages.findIndex(stage => stage.id === id);
    if (index === -1) {
      throw new Error(`Pipeline stage with id ${id} not found`);
    }

    const updatedStage = {
      ...this.pipelineStages[index],
      ...stageData,
      updatedAt: new Date()
    };

    this.pipelineStages[index] = updatedStage;
    return updatedStage;
  }

  async deletePipelineStage(id: number): Promise<void> {
    const index = this.pipelineStages.findIndex(stage => stage.id === id);
    if (index !== -1) {
      this.pipelineStages.splice(index, 1);
    }
  }

  // AREA OF ACTIVITY OPERATIONS

  async getAreaOfActivity(id: number): Promise<AreaOfActivity | null> {
    return this.areasOfActivity.find(area => area.id === id) || null;
  }

  async getAreasOfActivityByContactId(contactId: number): Promise<AreaOfActivity[]> {
    return this.areasOfActivity.filter(area => area.contactId === contactId);
  }

  async getAreasOfActivityByCompanyId(companyId: number): Promise<AreaOfActivity[]> {
    return this.areasOfActivity.filter(area => area.companyId === companyId);
  }

  async createAreaOfActivity(areaData: InsertAreaOfActivity): Promise<AreaOfActivity> {
    const now = new Date();
    const newArea: AreaOfActivity = {
      id: this.nextIds.areasOfActivity++,
      ...areaData,
      createdAt: now,
      updatedAt: now,
      // Assegna valori di default per i campi opzionali
      role: areaData.role || null,
      companyId: areaData.companyId || null,
      companyName: areaData.companyName || null,
      jobDescription: areaData.jobDescription || null,
      isPrimary: areaData.isPrimary !== undefined ? areaData.isPrimary : null
    };
    this.areasOfActivity.push(newArea);
    return newArea;
  }

  async updateAreaOfActivity(id: number, areaData: Partial<AreaOfActivity>): Promise<AreaOfActivity> {
    const index = this.areasOfActivity.findIndex(area => area.id === id);
    if (index === -1) {
      throw new Error(`Area of activity with id ${id} not found`);
    }

    const updatedArea = {
      ...this.areasOfActivity[index],
      ...areaData,
      updatedAt: new Date()
    };

    this.areasOfActivity[index] = updatedArea;
    return updatedArea;
  }

  async deleteAreaOfActivity(id: number): Promise<void> {
    const index = this.areasOfActivity.findIndex(area => area.id === id);
    if (index !== -1) {
      this.areasOfActivity.splice(index, 1);
    }
  }

  async resetPrimaryAreasOfActivity(contactId: number): Promise<void> {
    this.areasOfActivity = this.areasOfActivity.map(area => {
      if (area.contactId === contactId) {
        return { ...area, isPrimary: false };
      }
      return area;
    });
  }

  // Implementazione delle operazioni sulle sinergie
  async getSynergyById(id: number): Promise<Synergy | null> {
    const synergy = this.synergies.find(s => s.id === id);
    return synergy || null;
  }

  async getAllSynergies(): Promise<Synergy[]> {
    return [...this.synergies];
  }

  async getSynergiesByContactId(contactId: number): Promise<Synergy[]> {
    return this.synergies.filter(s => s.contactId === contactId);
  }

  async getSynergiesByCompanyId(companyId: number): Promise<Synergy[]> {
    return this.synergies.filter(s => s.companyId === companyId);
  }

  async getSynergiesByDealId(dealId: number): Promise<Synergy[]> {
    return this.synergies.filter(s => s.dealId === dealId);
  }

  async createSynergy(synergyData: InsertSynergy): Promise<Synergy> {
    const newSynergy: Synergy = {
      id: this.nextIds.synergies++,
      ...synergyData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.synergies.push(newSynergy);
    return newSynergy;
  }

  async updateSynergy(id: number, synergyData: Partial<Synergy>): Promise<Synergy> {
    const index = this.synergies.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Synergy with id ${id} not found`);
    }

    const updatedSynergy = {
      ...this.synergies[index],
      ...synergyData,
      updatedAt: new Date()
    };

    this.synergies[index] = updatedSynergy;
    return updatedSynergy;
  }

  async deleteSynergy(id: number): Promise<void> {
    const index = this.synergies.findIndex(s => s.id === id);
    if (index !== -1) {
      this.synergies.splice(index, 1);
    }
  }

  /**
   * Implementazione delle operazioni per ContactEmail
   */
  async getContactEmail(id: number): Promise<ContactEmail | null> {
    const contactEmail = this.contactEmails.find(ce => ce.id === id);
    return contactEmail || null;
  }

  async getContactEmails(contactId: number): Promise<ContactEmail[]> {
    return this.contactEmails.filter(ce => ce.contactId === contactId);
  }

  async getPrimaryContactEmail(contactId: number): Promise<ContactEmail | null> {
    const primaryEmail = this.contactEmails.find(ce => ce.contactId === contactId && ce.isPrimary);
    return primaryEmail || null;
  }

  async createContactEmail(contactEmailData: InsertContactEmail): Promise<ContactEmail> {
    const id = this.nextIds.contactEmails++;
    
    // If this is the first email for this contact, make it primary by default
    const isFirstEmail = !this.contactEmails.some(ce => ce.contactId === contactEmailData.contactId);
    const isPrimary = contactEmailData.isPrimary !== undefined ? contactEmailData.isPrimary : isFirstEmail;
    
    // If setting this email as primary, reset other emails to non-primary
    if (isPrimary) {
      this.contactEmails
        .filter(ce => ce.contactId === contactEmailData.contactId)
        .forEach(ce => ce.isPrimary = false);
    }
    
    const newContactEmail: ContactEmail = {
      id,
      ...contactEmailData,
      isPrimary,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.contactEmails.push(newContactEmail);
    return newContactEmail;
  }

  async updateContactEmail(id: number, contactEmailData: Partial<ContactEmail>): Promise<ContactEmail> {
    const index = this.contactEmails.findIndex(ce => ce.id === id);
    if (index === -1) {
      throw new Error(`ContactEmail with id ${id} not found`);
    }
    
    // If setting this email as primary, reset other emails to non-primary
    if (contactEmailData.isPrimary) {
      const contactId = this.contactEmails[index].contactId;
      this.contactEmails
        .filter(ce => ce.contactId === contactId && ce.id !== id)
        .forEach(ce => ce.isPrimary = false);
    }
    
    const updatedContactEmail = {
      ...this.contactEmails[index],
      ...contactEmailData,
      updatedAt: new Date()
    };
    
    this.contactEmails[index] = updatedContactEmail;
    return updatedContactEmail;
  }

  async deleteContactEmail(id: number): Promise<boolean> {
    const index = this.contactEmails.findIndex(ce => ce.id === id);
    if (index === -1) {
      return false;
    }
    
    const deletedEmail = this.contactEmails[index];
    this.contactEmails.splice(index, 1);
    
    // If we deleted a primary email, set another one as primary if available
    if (deletedEmail.isPrimary) {
      const anotherEmail = this.contactEmails.find(ce => ce.contactId === deletedEmail.contactId);
      if (anotherEmail) {
        anotherEmail.isPrimary = true;
      }
    }
    
    return true;
  }

  async setContactEmailAsPrimary(id: number): Promise<ContactEmail> {
    const emailIndex = this.contactEmails.findIndex(ce => ce.id === id);
    if (emailIndex === -1) {
      throw new Error(`ContactEmail with id ${id} not found`);
    }
    
    const contactId = this.contactEmails[emailIndex].contactId;
    
    // Reset all emails for this contact to non-primary
    this.contactEmails
      .filter(ce => ce.contactId === contactId)
      .forEach(ce => ce.isPrimary = false);
    
    // Set the selected email as primary
    this.contactEmails[emailIndex].isPrimary = true;
    this.contactEmails[emailIndex].updatedAt = new Date();
    
    return this.contactEmails[emailIndex];
  }
  
  // BRANCH OPERATIONS

  async getBranch(id: number): Promise<Branch | null> {
    return this.branches.find(branch => branch.id === id) || null;
  }

  async getBranches(): Promise<Branch[]> {
    return [...this.branches];
  }

  async getBranchesByCompanyId(companyId: number): Promise<Branch[]> {
    return this.branches.filter(branch => branch.companyId === companyId);
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    const now = new Date();
    const newBranch: Branch = {
      id: this.nextIds.branches++,
      ...branchData,
      createdAt: now,
      updatedAt: now,
    };
    this.branches.push(newBranch);
    return newBranch;
  }

  async updateBranch(id: number, branchData: Partial<Branch>): Promise<Branch> {
    const index = this.branches.findIndex(branch => branch.id === id);
    if (index === -1) {
      throw new Error(`Branch with id ${id} not found`);
    }

    const updatedBranch = {
      ...this.branches[index],
      ...branchData,
      updatedAt: new Date()
    };

    this.branches[index] = updatedBranch;
    return updatedBranch;
  }

  async deleteBranch(id: number): Promise<void> {
    const index = this.branches.findIndex(branch => branch.id === id);
    if (index !== -1) {
      this.branches.splice(index, 1);
    }
  }

  // Metodi aggiuntivi per compatibilità con l'API dashboard
  async getEmails(): Promise<Email[]> {
    return []; // Implementazione mock vuota per MemStorage
  }
  
  async getPipelineStages(): Promise<PipelineStage[]> {
    return this.pipelineStages; // Restituisci gli stage esistenti
  }
  
  async getActivities(): Promise<Activity[]> {
    return []; // Implementazione mock vuota per MemStorage
  }
  
  async getMeetings(): Promise<Meeting[]> {
    return []; // Implementazione mock vuota per MemStorage
  }
}

// Esporta un'istanza singleton dell'implementazione di storage
// Importiamo PostgresStorage dal file postgresStorage.ts
import { PostgresStorage } from './postgresStorage';

// Utilizziamo PostgresStorage invece di MemStorage per connetterci al database reale
export const storage = new PostgresStorage();