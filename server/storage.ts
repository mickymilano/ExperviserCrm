import {
  users, type User, type InsertUser,
  leads, type Lead, type InsertLead,
  contacts, type Contact, type InsertContact,
  areasOfActivity, type AreaOfActivity, type InsertAreaOfActivity,
  companies, type Company, type InsertCompany,
  pipelineStages, type PipelineStage, type InsertPipelineStage,
  deals, type Deal, type InsertDeal,
  tasks, type Task, type InsertTask,
  emailAccounts, type EmailAccount, type InsertEmailAccount,
  emails, type Email, type InsertEmail,
  activities, type Activity, type InsertActivity,
  meetings, type Meeting, type InsertMeeting,
  signatures, type Signature, type InsertSignature,
  accountSignatures, type AccountSignature, type InsertAccountSignature,
  userSessions, type UserSession, type InsertUserSession,
  securityLogs, type SecurityLog, type InsertSecurityLog,
  synergies, type Synergy, type InsertSynergy
} from "@shared/schema";
import { PostgresStorage } from "./postgresStorage";

// Storage interface
export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // User Sessions
  getUserSessionByToken(token: string): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(token: string, sessionData: Partial<InsertUserSession>): Promise<UserSession | undefined>;
  deleteUserSession(token: string): Promise<boolean>;
  deleteAllUserSessions(userId: number): Promise<boolean>;
  
  // Security Logs
  getSecurityLogs(userId?: number): Promise<SecurityLog[]>;
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;
  
  // Areas of Activity
  getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]>;
  getAreaOfActivity(id: number): Promise<AreaOfActivity | undefined>;
  createAreaOfActivity(area: InsertAreaOfActivity): Promise<AreaOfActivity>;
  updateAreaOfActivity(id: number, area: Partial<InsertAreaOfActivity>): Promise<AreaOfActivity | undefined>;
  deleteAreaOfActivity(id: number): Promise<boolean>;
  setPrimaryAreaOfActivity(id: number): Promise<boolean>;
  
  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | null>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | null>;
  deleteLead(id: number): Promise<boolean>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  
  // Pipeline Stages
  getPipelineStages(): Promise<PipelineStage[]>;
  getPipelineStage(id: number): Promise<PipelineStage | undefined>;
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  
  // Deals
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Email Accounts
  getEmailAccounts(): Promise<EmailAccount[]>;
  getEmailAccount(id: number): Promise<EmailAccount | undefined>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: number, account: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined>;
  deleteEmailAccount(id: number): Promise<boolean>;
  setPrimaryEmailAccount(id: number): Promise<boolean>;
  toggleEmailAccountActive(id: number, isActive: boolean): Promise<EmailAccount | undefined>;
  updateEmailAccountStatus(id: number, status: string, error?: string): Promise<EmailAccount | undefined>;
  
  // Emails
  getEmails(): Promise<Email[]>;
  getEmail(id: number): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  markEmailRead(id: number): Promise<Email | undefined>;
  
  // Email Signatures
  getSignatures(): Promise<Signature[]>;
  getSignature(id: number): Promise<Signature | undefined>;
  createSignature(signature: InsertSignature): Promise<Signature>;
  updateSignature(id: number, signature: Partial<InsertSignature>): Promise<Signature | undefined>;
  deleteSignature(id: number): Promise<boolean>;
  setDefaultSignature(id: number): Promise<boolean>;
  
  // Account Signatures (many-to-many)
  getAccountSignatures(accountId: number): Promise<Signature[]>;
  assignSignatureToAccount(accountId: number, signatureId: number): Promise<AccountSignature>;
  removeSignatureFromAccount(accountId: number, signatureId: number): Promise<boolean>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Meetings
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;
  
  // Synergies operations
  getSynergies(): Promise<Synergy[]>;
  getSynergiesByContact(contactId: number): Promise<Synergy[]>;
  getSynergiesByCompany(companyId: number): Promise<Synergy[]>;
  getSynergy(id: number): Promise<Synergy | undefined>;
  createSynergy(synergy: InsertSynergy): Promise<Synergy>;
  updateSynergy(id: number, synergyData: Partial<InsertSynergy>): Promise<Synergy | undefined>;
  deleteSynergy(id: number): Promise<boolean>;
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private contacts: Map<number, Contact>;
  private companies: Map<number, Company>;
  private areasOfActivity: Map<number, AreaOfActivity>;
  private pipelineStages: Map<number, PipelineStage>;
  private deals: Map<number, Deal>;
  private tasks: Map<number, Task>;
  private emailAccounts: Map<number, EmailAccount>;
  private emails: Map<number, Email>;
  private activities: Map<number, Activity>;
  private meetings: Map<number, Meeting>;
  private signatures: Map<number, Signature>;
  private accountSignatures: Map<number, AccountSignature>;
  private userSessions: Map<string, UserSession>;
  private securityLogs: Map<number, SecurityLog>;
  private synergies: Map<number, Synergy>;

  private userCurrentId: number;
  private leadCurrentId: number;
  private contactCurrentId: number;
  private companyCurrentId: number;
  private areaOfActivityCurrentId: number;
  private stageCurrentId: number;
  private dealCurrentId: number;
  private taskCurrentId: number;
  private accountCurrentId: number;
  private emailCurrentId: number;
  private activityCurrentId: number;
  private meetingCurrentId: number;
  private signatureCurrentId: number;
  private accountSignatureCurrentId: number;
  private securityLogCurrentId: number;
  private synergyCurrentId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.contacts = new Map();
    this.companies = new Map();
    this.areasOfActivity = new Map();
    this.pipelineStages = new Map();
    this.deals = new Map();
    this.tasks = new Map();
    this.emailAccounts = new Map();
    this.emails = new Map();
    this.activities = new Map();
    this.meetings = new Map();
    this.signatures = new Map();
    this.accountSignatures = new Map();
    this.userSessions = new Map();
    this.securityLogs = new Map();
    this.synergies = new Map();

    this.userCurrentId = 1;
    this.leadCurrentId = 1;
    this.contactCurrentId = 1;
    this.companyCurrentId = 1;
    this.areaOfActivityCurrentId = 1;
    this.stageCurrentId = 1;
    this.dealCurrentId = 1;
    this.taskCurrentId = 1;
    this.accountCurrentId = 1;
    this.emailCurrentId = 1;
    this.activityCurrentId = 1;
    this.meetingCurrentId = 1;
    this.signatureCurrentId = 1;
    this.accountSignatureCurrentId = 1;
    this.securityLogCurrentId = 1;
    this.synergyCurrentId = 1;

    // Initialize with demo data
    this.initializeDemoData();
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email || user.backupEmail === email,
    );
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetPasswordToken === token,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    
    const user: User = { 
      ...insertUser, 
      id,
      backupEmail: insertUser.backupEmail || null,
      lastLoginAt: null,
      loginAttempts: 0,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: now,
      updatedAt: now,
      // Ensure role and status are properly set with defaults if not provided
      role: insertUser.role || "user",
      status: insertUser.status || "active"
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // User Sessions
  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    return this.userSessions.get(token);
  }
  
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const now = new Date();
    const userSession: UserSession = {
      ...session,
      id: this.userCurrentId++,
      createdAt: now,
      lastActiveAt: now
    };
    
    this.userSessions.set(session.token, userSession);
    return userSession;
  }
  
  async updateUserSession(token: string, data: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const session = this.userSessions.get(token);
    if (!session) return undefined;
    
    const updatedSession: UserSession = {
      ...session,
      ...data,
      lastActiveAt: new Date()
    };
    
    this.userSessions.set(token, updatedSession);
    return updatedSession;
  }
  
  async deleteUserSession(token: string): Promise<boolean> {
    return this.userSessions.delete(token);
  }
  
  async deleteAllUserSessions(userId: number): Promise<boolean> {
    let success = true;
    
    for (const [token, session] of this.userSessions.entries()) {
      if (session.userId === userId) {
        const deleted = this.userSessions.delete(token);
        if (!deleted) success = false;
      }
    }
    
    return success;
  }
  
  // Security Logs
  async getSecurityLogs(userId?: number): Promise<SecurityLog[]> {
    const logs = Array.from(this.securityLogs.values());
    
    if (userId) {
      return logs.filter(log => log.userId === userId);
    }
    
    return logs;
  }
  
  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    const id = this.securityLogCurrentId++;
    const now = new Date();
    
    const securityLog: SecurityLog = {
      ...log,
      id,
      createdAt: now
    };
    
    this.securityLogs.set(id, securityLog);
    return securityLog;
  }
  
  // Leads
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLead(id: number): Promise<Lead | null> {
    return this.leads.get(id) || null;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadCurrentId++;
    const now = new Date();
    
    // Corretta mappatura dei campi in base allo schema
    const lead: Lead = {
      id,
      createdAt: now,
      updatedAt: now,
      firstName: insertLead.firstName || null,
      lastName: insertLead.lastName || null,
      middleName: insertLead.middleName || null,
      companyName: insertLead.companyName || null,
      role: insertLead.role || null,
      
      // Contact information
      mobilePhone: insertLead.mobilePhone || null,
      companyEmail: insertLead.companyEmail || null,
      privateEmail: insertLead.privateEmail || null,
      officePhone: insertLead.officePhone || null,
      privatePhone: insertLead.privatePhone || null,
      
      // Social profiles
      linkedin: insertLead.linkedin || null,
      facebook: insertLead.facebook || null,
      instagram: insertLead.instagram || null,
      tiktok: insertLead.tiktok || null,
      
      // Other fields
      website: insertLead.website || null,
      source: insertLead.source || null,
      status: insertLead.status || "new",
      tags: insertLead.tags || [],
      notes: insertLead.notes || null,
      assignedToId: insertLead.assignedToId || null,
      customFields: insertLead.customFields || null,
    };
    
    this.leads.set(id, lead);
    
    // Create activity for new lead
    try {
      await this.createActivity({
        type: 'lead',
        description: `New lead created: ${lead.firstName || ''} ${lead.lastName || ''} ${lead.companyName ? 'from ' + lead.companyName : ''}`.trim(),
        date: now,
        userId: 1,
      });
    } catch (error) {
      console.error("Failed to create activity for lead:", error);
      // Non interrompiamo il processo di creazione del lead se l'attività fallisce
    }
    
    return lead;
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | null> {
    const lead = this.leads.get(id);
    if (!lead) return null;
    
    const updatedLead: Lead = {
      ...lead,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactCompanies(contactId: number): Promise<Company[]> {
    // Trova tutte le aree di attività per questo contatto
    const areas = Array.from(this.areasOfActivity.values())
      .filter(area => area.contactId === contactId && area.companyId !== null);
    
    // Ottieni le aziende uniche
    const companyIds = new Set(areas.map(area => area.companyId).filter(Boolean));
    const companies: Company[] = [];
    
    for (const companyId of companyIds) {
      if (companyId) {
        const company = this.companies.get(companyId);
        if (company) {
          // Aggiungi le informazioni sull'area di attività per questo contatto e questa azienda
          const area = areas.find(a => a.companyId === companyId);
          
          // Crea una copia dell'azienda con l'area di attività associata
          const companyWithArea = {
            ...company,
            areaOfActivity: area
          };
          
          companies.push(companyWithArea as Company);
        }
      }
    }
    
    return companies;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.contactCurrentId++;
    const now = new Date();
    
    // Creiamo un oggetto Contact esplicito per evitare campi non riconosciuti
    const contact: Contact = { 
      id,
      firstName: insertContact.firstName || "",
      lastName: insertContact.lastName || "",
      middleName: insertContact.middleName || null,
      
      // Campi di contatto
      mobilePhone: insertContact.mobilePhone || null,
      companyEmail: insertContact.companyEmail || null,
      privateEmail: insertContact.privateEmail || null,
      officePhone: insertContact.officePhone || null,
      privatePhone: insertContact.privatePhone || null,
      
      // Profili social
      linkedin: insertContact.linkedin || null,
      facebook: insertContact.facebook || null,
      instagram: insertContact.instagram || null,
      tiktok: insertContact.tiktok || null,
      
      // Altri campi
      tags: insertContact.tags || null,
      notes: insertContact.notes || null,
      customFields: insertContact.customFields || null,
      
      // Campi di timestamp
      createdAt: now,
      updatedAt: now
    };
    
    this.contacts.set(id, contact);
    
    // Create activity for new contact
    await this.createActivity({
      type: 'contact',
      description: `New contact ${contact.firstName} ${contact.lastName} created`,
      date: now,
      contactId: id,
      userId: 1,
    });
    
    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact: Contact = {
      ...contact,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }
  
  // Areas of Activity methods
  async getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]> {
    const result: AreaOfActivity[] = [];
    for (const area of this.areasOfActivity.values()) {
      if (area.contactId === contactId) {
        result.push(area);
      }
    }
    return result;
  }

  async getAreaOfActivity(id: number): Promise<AreaOfActivity | undefined> {
    return this.areasOfActivity.get(id);
  }

  async createAreaOfActivity(insertArea: InsertAreaOfActivity): Promise<AreaOfActivity> {
    const id = this.areaOfActivityCurrentId++;
    const now = new Date();
    const area: AreaOfActivity = {
      id,
      createdAt: now,
      updatedAt: now,
      ...insertArea
    };
    this.areasOfActivity.set(id, area);
    return area;
  }

  async updateAreaOfActivity(id: number, updateData: Partial<InsertAreaOfActivity>): Promise<AreaOfActivity | undefined> {
    const area = this.areasOfActivity.get(id);
    if (!area) return undefined;

    const updatedArea: AreaOfActivity = {
      ...area,
      ...updateData,
      updatedAt: new Date()
    };

    this.areasOfActivity.set(id, updatedArea);
    return updatedArea;
  }

  async deleteAreaOfActivity(id: number): Promise<boolean> {
    return this.areasOfActivity.delete(id);
  }

  async setPrimaryAreaOfActivity(id: number): Promise<boolean> {
    const area = this.areasOfActivity.get(id);
    if (!area) return false;

    // Get all areas for this contact
    const contactAreas = await this.getAreasOfActivity(area.contactId);
    
    // Set all to non-primary
    for (const relatedArea of contactAreas) {
      if (relatedArea.id !== id) {
        await this.updateAreaOfActivity(relatedArea.id, { isPrimary: false });
      }
    }

    // Set the requested one to primary
    await this.updateAreaOfActivity(id, { isPrimary: true });
    return true;
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyContacts(companyId: number): Promise<Contact[]> {
    // Trova tutti i contatti associati a questa azienda tramite aree di attività
    const areas = Array.from(this.areasOfActivity.values())
      .filter(area => area.companyId === companyId);
    
    // Ottieni i contatti unici
    const contactIds = new Set(areas.map(area => area.contactId));
    const contacts: Contact[] = [];
    
    for (const contactId of contactIds) {
      const contact = this.contacts.get(contactId);
      if (contact) {
        // Per ogni contatto, recupera tutte le sue aree di attività
        const contactAreas = await this.getAreasOfActivity(contactId);
        
        // Crea una copia del contatto con le aree di attività associate
        const contactWithAreas = {
          ...contact,
          areasOfActivity: contactAreas
        };
        
        contacts.push(contactWithAreas as Contact);
      }
    }
    
    return contacts;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.companyCurrentId++;
    const now = new Date();
    const company: Company = { 
      ...insertCompany, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.companies.set(id, company);
    
    // Create activity for new company
    await this.createActivity({
      type: 'company',
      description: `New company ${company.name} created`,
      date: now,
      companyId: id,
      userId: 1,
    });
    
    return company;
  }

  async updateCompany(id: number, updateData: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updatedCompany: Company = {
      ...company,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
  }

  // Pipeline Stages
  async getPipelineStages(): Promise<PipelineStage[]> {
    return Array.from(this.pipelineStages.values())
      .sort((a, b) => a.order - b.order);
  }
  
  async getPipelineStage(id: number): Promise<PipelineStage | undefined> {
    return this.pipelineStages.get(id);
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const id = this.stageCurrentId++;
    const stage: PipelineStage = { ...insertStage, id };
    this.pipelineStages.set(id, stage);
    return stage;
  }

  // Deals
  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.dealCurrentId++;
    const now = new Date();
    const deal: Deal = { 
      ...insertDeal, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.deals.set(id, deal);
    
    // Create activity for new deal
    await this.createActivity({
      type: 'deal',
      description: `New deal ${deal.name} created (${deal.value})`,
      date: now,
      dealId: id,
      userId: 1,
      companyId: deal.companyId,
      contactId: deal.contactId,
    });
    
    return deal;
  }

  async updateDeal(id: number, updateData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal: Deal = {
      ...deal,
      ...updateData,
      updatedAt: new Date()
    };
    
    // If stage has changed, log an activity
    if (updateData.stageId && updateData.stageId !== deal.stageId) {
      const newStage = this.pipelineStages.get(updateData.stageId);
      if (newStage) {
        await this.createActivity({
          type: 'deal_stage_change',
          description: `Deal ${deal.name} moved to ${newStage.name} stage`,
          date: new Date(),
          dealId: id,
          userId: 1,
          companyId: deal.companyId,
          contactId: deal.contactId,
        });
      }
    }
    
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.tasks.set(id, task);
    
    // Create activity for new task
    await this.createActivity({
      type: 'task',
      description: `New task created: ${task.title}`,
      date: now,
      taskId: id,
      userId: 1,
      dealId: task.dealId,
      companyId: task.companyId,
      contactId: task.contactId,
    });
    
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = {
      ...task,
      ...updateData,
      updatedAt: new Date()
    };
    
    // If task completed status changed to true, log an activity
    if (updateData.completed === true && !task.completed) {
      await this.createActivity({
        type: 'task_completed',
        description: `Task completed: ${task.title}`,
        date: new Date(),
        taskId: id,
        userId: 1,
        dealId: task.dealId,
        companyId: task.companyId,
        contactId: task.contactId,
      });
    }
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Email Accounts
  async getEmailAccounts(): Promise<EmailAccount[]> {
    return Array.from(this.emailAccounts.values());
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    return this.emailAccounts.get(id);
  }

  async createEmailAccount(insertAccount: InsertEmailAccount): Promise<EmailAccount> {
    const id = this.accountCurrentId++;
    const account: EmailAccount = { ...insertAccount, id };
    this.emailAccounts.set(id, account);
    return account;
  }

  async deleteEmailAccount(id: number): Promise<boolean> {
    return this.emailAccounts.delete(id);
  }
  
  async updateEmailAccount(id: number, updateData: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined> {
    const account = this.emailAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount: EmailAccount = {
      ...account,
      ...updateData,
    };
    
    this.emailAccounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async setPrimaryEmailAccount(id: number): Promise<boolean> {
    const account = this.emailAccounts.get(id);
    if (!account) return false;
    
    // First, set all accounts to non-primary
    for (const [accountId, existingAccount] of this.emailAccounts.entries()) {
      this.emailAccounts.set(accountId, {
        ...existingAccount,
        isPrimary: false
      });
    }
    
    // Then set the requested account as primary
    this.emailAccounts.set(id, {
      ...account,
      isPrimary: true
    });
    
    return true;
  }
  
  async toggleEmailAccountActive(id: number, isActive: boolean): Promise<EmailAccount | undefined> {
    const account = this.emailAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount: EmailAccount = {
      ...account,
      isActive
    };
    
    this.emailAccounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async updateEmailAccountStatus(id: number, status: string, error?: string): Promise<EmailAccount | undefined> {
    const account = this.emailAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount: EmailAccount = {
      ...account,
      status,
      lastSyncTime: new Date(),
      lastError: error || null
    };
    
    this.emailAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  // Emails
  async getEmails(): Promise<Email[]> {
    return Array.from(this.emails.values());
  }

  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.emailCurrentId++;
    const email: Email = { ...insertEmail, id };
    this.emails.set(id, email);
    
    // Create activity for email
    await this.createActivity({
      type: 'email',
      description: `Email: ${email.subject}`,
      date: email.date,
      emailId: id,
      userId: 1,
      dealId: email.dealId,
      companyId: email.companyId,
      contactId: email.contactId,
    });
    
    return email;
  }

  async markEmailRead(id: number): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (!email) return undefined;
    
    const updatedEmail: Email = {
      ...email,
      read: true
    };
    
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }
  
  // Email Signatures
  async getSignatures(): Promise<Signature[]> {
    return Array.from(this.signatures.values());
  }
  
  async getSignature(id: number): Promise<Signature | undefined> {
    return this.signatures.get(id);
  }
  
  async createSignature(insertSignature: InsertSignature): Promise<Signature> {
    const id = this.signatureCurrentId++;
    const now = new Date();
    const signature: Signature = {
      ...insertSignature,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.signatures.set(id, signature);
    
    // If this is marked as default and it's the first signature, make it the default
    if (signature.isDefault) {
      await this.setDefaultSignature(id);
    }
    
    return signature;
  }
  
  async updateSignature(id: number, updateData: Partial<InsertSignature>): Promise<Signature | undefined> {
    const signature = this.signatures.get(id);
    if (!signature) return undefined;
    
    const updatedSignature: Signature = {
      ...signature,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.signatures.set(id, updatedSignature);
    
    // If this signature was set as default, update other signatures
    if (updateData.isDefault) {
      await this.setDefaultSignature(id);
    }
    
    return updatedSignature;
  }
  
  async deleteSignature(id: number): Promise<boolean> {
    // First remove any account associations
    for (const [accountSignatureId, accountSignature] of this.accountSignatures.entries()) {
      if (accountSignature.signatureId === id) {
        this.accountSignatures.delete(accountSignatureId);
      }
    }
    
    // Then delete the signature
    return this.signatures.delete(id);
  }
  
  async setDefaultSignature(id: number): Promise<boolean> {
    const signature = this.signatures.get(id);
    if (!signature) return false;
    
    // Set all other signatures to non-default
    for (const [signatureId, existingSignature] of this.signatures.entries()) {
      if (signatureId !== id) {
        this.signatures.set(signatureId, {
          ...existingSignature,
          isDefault: false
        });
      }
    }
    
    // Set this signature as default
    this.signatures.set(id, {
      ...signature,
      isDefault: true
    });
    
    return true;
  }
  
  // Account Signatures (many-to-many)
  async getAccountSignatures(accountId: number): Promise<Signature[]> {
    const accountSignatureEntries = Array.from(this.accountSignatures.values())
      .filter(as => as.accountId === accountId);
    
    // Get the actual signatures
    return accountSignatureEntries.map(as => {
      const signature = this.signatures.get(as.signatureId);
      return signature!;
    }).filter(Boolean);
  }
  
  async assignSignatureToAccount(accountId: number, signatureId: number): Promise<AccountSignature> {
    // Check if the account and signature exist
    const account = this.emailAccounts.get(accountId);
    const signature = this.signatures.get(signatureId);
    
    if (!account || !signature) {
      throw new Error('Account or signature not found');
    }
    
    // Check if this association already exists
    const existingAssociation = Array.from(this.accountSignatures.values())
      .find(as => as.accountId === accountId && as.signatureId === signatureId);
    
    if (existingAssociation) {
      return existingAssociation; // Association already exists
    }
    
    // Create a new association
    const id = this.accountSignatureCurrentId++;
    const now = new Date();
    const accountSignature: AccountSignature = {
      id,
      accountId,
      signatureId,
      isActive: true,
      createdAt: now
    };
    
    this.accountSignatures.set(id, accountSignature);
    return accountSignature;
  }
  
  async removeSignatureFromAccount(accountId: number, signatureId: number): Promise<boolean> {
    // Find the association to remove
    const associationToRemove = Array.from(this.accountSignatures.entries())
      .find(([_, as]) => as.accountId === accountId && as.signatureId === signatureId);
    
    if (!associationToRemove) {
      return false; // Association doesn't exist
    }
    
    // Remove the association
    return this.accountSignatures.delete(associationToRemove[0]);
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: now 
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values());
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.meetingCurrentId++;
    const now = new Date();
    const meeting: Meeting = { 
      ...insertMeeting, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.meetings.set(id, meeting);
    
    // Create activity for new meeting
    await this.createActivity({
      type: 'meeting',
      description: `Meeting scheduled: ${meeting.title}`,
      date: now,
      userId: 1,
      dealId: meeting.dealId,
      companyId: meeting.companyId,
      contactId: meeting.contactId,
    });
    
    return meeting;
  }

  async updateMeeting(id: number, updateData: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const updatedMeeting: Meeting = {
      ...meeting,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    return this.meetings.delete(id);
  }

  // Initialize demo data
  private async initializeDemoData() {
    // Create super admin user
    await this.createUser({
      username: "michele",
      password: "admin_admin_69", // In a real app, this would be properly hashed
      fullName: "Michele Ardoni",
      email: "michele@experviser.com",
      backupEmail: "michele.ardoni@gmail.com",
      role: "super_admin",
      status: "active"
    });
    
    // Create demo user
    await this.createUser({
      username: "john",
      password: "password", // In a real app, this would be hashed
      fullName: "John Smith",
      email: "john@experviser.com",
      role: "admin"
    });

    // Create pipeline stages
    const qualificationStage = await this.createPipelineStage({ name: "Qualification", order: 1 });
    const meetingStage = await this.createPipelineStage({ name: "Meeting", order: 2 });
    const proposalStage = await this.createPipelineStage({ name: "Proposal", order: 3 });
    const negotiationStage = await this.createPipelineStage({ name: "Negotiation", order: 4 });
    const closedWonStage = await this.createPipelineStage({ name: "Closed Won", order: 5 });
    const closedLostStage = await this.createPipelineStage({ name: "Closed Lost", order: 6 });

    // Initial dataset - 3 companies
    const urbanEats = await this.createCompany({
      name: "Urban Eats",
      industry: "Foodservice",
      website: "https://www.urbaneats.com",
      email: "info@urbaneats.com",
      phone: "555-123-4567",
      address: "123 Main St, Anytown, USA",
      tags: ["foodservice", "client"],
      notes: "Urban Eats is a growing foodservice company."
    });

    const qsrFranchise = await this.createCompany({
      name: "QSR Franchise",
      industry: "QSR",
      website: "https://www.qsrfranchise.com",
      email: "info@qsrfranchise.com",
      phone: "555-987-6543",
      address: "456 Market St, Anytown, USA",
      tags: ["QSR", "franchise", "prospect"],
      notes: "QSR Franchise is looking to expand operations."
    });

    const techSolutions = await this.createCompany({
      name: "Tech Solutions Inc",
      industry: "Technology",
      website: "https://www.techsolutions.com",
      email: "info@techsolutions.com",
      phone: "555-789-0123",
      address: "789 Tech Blvd, Anytown, USA",
      tags: ["technology", "client", "IT"],
      notes: "Tech Solutions provides software for the foodservice industry."
    });

    // Additional dataset - 7 more companies
    const techInnovate = await this.createCompany({
      name: "TechInnovate Srl",
      industry: "Technology",
      website: "https://www.techinnovate.it",
      email: "info@techinnovate.it",
      phone: "02-123-4567",
      address: "Via Milano 25, Milano, Italia",
      tags: ["technology", "startup"],
      notes: "Innovativa azienda tech con focus su soluzioni mobili."
    });

    const modaElegante = await this.createCompany({
      name: "Moda Elegante SpA",
      industry: "Fashion",
      website: "https://www.modaelegante.it",
      email: "info@modaelegante.it",
      phone: "06-765-4321",
      address: "Via della Moda 10, Roma, Italia",
      tags: ["fashion", "luxury"],
      notes: "Marchio di lusso nel settore moda italiano."
    });

    const gustoItaliano = await this.createCompany({
      name: "Gusto Italiano Ristoranti",
      industry: "Foodservice",
      website: "https://www.gustoitaliano.it",
      email: "info@gustoitaliano.it",
      phone: "041-123-7890",
      address: "Piazza San Marco 5, Venezia, Italia",
      tags: ["restaurant", "food"],
      notes: "Catena di ristoranti di cucina italiana tradizionale."
    });

    const costruzioniModerne = await this.createCompany({
      name: "Costruzioni Moderne SRL",
      industry: "Construction",
      website: "https://www.costruzionimoderne.it",
      email: "info@costruzionimoderne.it",
      phone: "011-987-6543",
      address: "Corso Vittorio Emanuele 45, Torino, Italia",
      tags: ["construction", "architecture"],
      notes: "Azienda specializzata in progetti edilizi innovativi."
    });

    const saluteBenessere = await this.createCompany({
      name: "Salute e Benessere SpA",
      industry: "Healthcare",
      website: "https://www.salutebenessere.it",
      email: "info@salutebenessere.it",
      phone: "081-456-7890",
      address: "Viale della Salute 30, Napoli, Italia",
      tags: ["healthcare", "wellness"],
      notes: "Rete di centri benessere e cliniche specializzate."
    });

    const energiaVerde = await this.createCompany({
      name: "Energia Verde Italia",
      industry: "Energy",
      website: "https://www.energiaverde.it",
      email: "info@energiaverde.it",
      phone: "055-234-5678",
      address: "Via dell'Energia 15, Firenze, Italia",
      tags: ["energy", "renewable"],
      notes: "Leader nel settore delle energie rinnovabili."
    });

    const educazioneFutura = await this.createCompany({
      name: "Educazione Futura",
      industry: "Education",
      website: "https://www.educazionefutura.it",
      email: "info@educazionefutura.it",
      phone: "051-876-5432",
      address: "Via dell'Università 20, Bologna, Italia",
      tags: ["education", "training"],
      notes: "Istituto formativo specializzato in tecnologie digitali."
    });

    // Initial dataset - 3 contacts
    const sarahJohnson = await this.createContact({
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@urbaneats.com",
      phone: "555-111-2222",
      jobTitle: "Operations Director",
      companyId: urbanEats.id,
      tags: ["decision-maker", "foodservice"],
      notes: "Key decision maker at Urban Eats."
    });

    const alexChen = await this.createContact({
      firstName: "Alex",
      lastName: "Chen",
      email: "alex@qsrfranchise.com",
      phone: "555-333-4444",
      jobTitle: "Business Developer",
      companyId: qsrFranchise.id,
      tags: ["decision-maker", "QSR"],
      notes: "Looking to expand QSR franchise operations."
    });

    const michaelRodriguez = await this.createContact({
      firstName: "Michael",
      lastName: "Rodriguez",
      email: "mrodriguez@techsolutions.com",
      phone: "555-555-6666",
      jobTitle: "Technical Director",
      companyId: techSolutions.id,
      tags: ["technical", "IT"],
      notes: "Technical point of contact at Tech Solutions."
    });

    // Additional dataset - 7 more contacts
    const marcoRossi = await this.createContact({
      firstName: "Marco",
      lastName: "Rossi",
      email: "m.rossi@techinnovate.it",
      phone: "347-111-2222",
      jobTitle: "CEO",
      companyId: techInnovate.id,
      tags: ["decision-maker", "tech"],
      notes: "Fondatore e CEO di TechInnovate."
    });

    const giuliaBianchi = await this.createContact({
      firstName: "Giulia",
      lastName: "Bianchi",
      email: "g.bianchi@modaelegante.it",
      phone: "348-222-3333",
      jobTitle: "Marketing Director",
      companyId: modaElegante.id,
      tags: ["marketing", "fashion"],
      notes: "Responsabile marketing per Moda Elegante."
    });

    const alessandroVerdi = await this.createContact({
      firstName: "Alessandro",
      lastName: "Verdi",
      email: "a.verdi@gustoitaliano.it",
      phone: "349-333-4444",
      jobTitle: "Head Chef",
      companyId: gustoItaliano.id,
      tags: ["foodservice", "chef"],
      notes: "Chef principale per Gusto Italiano Ristoranti."
    });

    const francescaNeri = await this.createContact({
      firstName: "Francesca",
      lastName: "Neri",
      email: "f.neri@costruzionimoderne.it",
      phone: "350-444-5555",
      jobTitle: "Project Manager",
      companyId: costruzioniModerne.id,
      tags: ["construction", "project-manager"],
      notes: "Coordina i progetti principali per Costruzioni Moderne."
    });

    const robertoMarini = await this.createContact({
      firstName: "Roberto",
      lastName: "Marini",
      email: "r.marini@salutebenessere.it",
      phone: "351-555-6666",
      jobTitle: "Medical Director",
      companyId: saluteBenessere.id,
      tags: ["healthcare", "doctor"],
      notes: "Direttore sanitario di Salute e Benessere."
    });

    const valentinaMoretti = await this.createContact({
      firstName: "Valentina",
      lastName: "Moretti",
      email: "v.moretti@energiaverde.it",
      phone: "352-666-7777",
      jobTitle: "Research Engineer",
      companyId: energiaVerde.id,
      tags: ["energy", "research"],
      notes: "Ingegnere responsabile della ricerca e sviluppo."
    });

    const lucaFerrari = await this.createContact({
      firstName: "Luca",
      lastName: "Ferrari",
      email: "l.ferrari@educazionefutura.it",
      phone: "353-777-8888",
      jobTitle: "Program Director",
      companyId: educazioneFutura.id,
      tags: ["education", "program-director"],
      notes: "Direttore dei programmi formativi."
    });

    // Initial dataset - 3 deals
    await this.createDeal({
      name: "Urban Eats Consultation",
      value: 15000,
      stageId: proposalStage.id,
      contactId: sarahJohnson.id,
      companyId: urbanEats.id,
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      notes: "Foodservice operations consultation for Urban Eats.",
      tags: ["consultation", "foodservice"]
    });

    await this.createDeal({
      name: "QSR Franchise Expansion",
      value: 25000,
      stageId: meetingStage.id,
      contactId: alexChen.id,
      companyId: qsrFranchise.id,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: "Expansion strategy for QSR franchise locations.",
      tags: ["expansion", "QSR", "franchise"]
    });

    await this.createDeal({
      name: "Tech Solutions Software",
      value: 18000,
      stageId: negotiationStage.id,
      contactId: michaelRodriguez.id,
      companyId: techSolutions.id,
      expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      notes: "Software implementation for Tech Solutions clients.",
      tags: ["software", "technology", "implementation"]
    });

    // Additional dataset - 7 more deals
    await this.createDeal({
      name: "Implementazione sistema CRM",
      value: 45000,
      stageId: negotiationStage.id,
      contactId: marcoRossi.id,
      companyId: techInnovate.id,
      expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      notes: "Sviluppo e implementazione di un sistema CRM personalizzato.",
      tags: ["tech", "crm", "development"]
    });

    await this.createDeal({
      name: "Consulenza marketing digitale",
      value: 12000,
      stageId: proposalStage.id,
      contactId: giuliaBianchi.id,
      companyId: modaElegante.id,
      expectedCloseDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      notes: "Strategia di marketing digitale per il lancio della nuova collezione.",
      tags: ["marketing", "digital", "fashion"]
    });

    await this.createDeal({
      name: "Ristrutturazione sede centrale",
      value: 80000,
      stageId: qualificationStage.id,
      contactId: alessandroVerdi.id,
      companyId: gustoItaliano.id,
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      notes: "Ristrutturazione completa della sede principale di Roma.",
      tags: ["construction", "renovation"]
    });

    await this.createDeal({
      name: "Progetto di espansione aziendale",
      value: 65000,
      stageId: meetingStage.id,
      contactId: francescaNeri.id,
      companyId: costruzioniModerne.id,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "Consulenza per l'espansione nel mercato del centro Italia.",
      tags: ["expansion", "strategy"]
    });

    await this.createDeal({
      name: "Sviluppo sito web e-commerce",
      value: 22000,
      stageId: closedWonStage.id,
      contactId: robertoMarini.id,
      companyId: saluteBenessere.id,
      expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: "Sviluppo di un nuovo sito e-commerce per prodotti wellness.",
      tags: ["web", "ecommerce", "development"]
    });

    await this.createDeal({
      name: "Consulenza strategica",
      value: 35000,
      stageId: closedLostStage.id,
      contactId: valentinaMoretti.id,
      companyId: energiaVerde.id,
      expectedCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      notes: "Consulenza strategica per l'espansione nel mercato europeo. Cliente ha scelto un altro fornitore.",
      tags: ["strategy", "international"]
    });

    await this.createDeal({
      name: "Programma di formazione aziendale",
      value: 28000,
      stageId: negotiationStage.id,
      contactId: lucaFerrari.id,
      companyId: educazioneFutura.id,
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notes: "Programma di formazione digital marketing per 50 dipendenti.",
      tags: ["training", "education", "digital"]
    });

    // Create areas of activity
    await this.createAreaOfActivity({
      contactId: marcoRossi.id,
      companyId: techInnovate.id,
      role: "CEO",
      jobDescription: "Fondatore e responsabile strategia aziendale",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: giuliaBianchi.id,
      companyId: modaElegante.id,
      role: "Marketing Director",
      jobDescription: "Direzione marketing e comunicazione",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: alessandroVerdi.id,
      companyId: gustoItaliano.id,
      role: "Head Chef",
      jobDescription: "Responsabile cucina e menu",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: francescaNeri.id,
      companyId: costruzioniModerne.id,
      role: "Project Manager",
      jobDescription: "Gestione progetti edilizi",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: robertoMarini.id,
      companyId: saluteBenessere.id,
      role: "Medical Director",
      jobDescription: "Supervisione protocolli sanitari",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: valentinaMoretti.id,
      companyId: energiaVerde.id,
      role: "Research Engineer",
      jobDescription: "Ricerca e sviluppo soluzioni energetiche",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: lucaFerrari.id,
      companyId: educazioneFutura.id,
      role: "Program Director",
      jobDescription: "Sviluppo programmi formativi",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: sarahJohnson.id,
      companyId: urbanEats.id,
      role: "Operations Director",
      jobDescription: "Gestione operativa e logistica",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: alexChen.id,
      companyId: qsrFranchise.id,
      role: "Business Developer",
      jobDescription: "Sviluppo business e franchising",
      isPrimary: true
    });

    await this.createAreaOfActivity({
      contactId: michaelRodriguez.id,
      companyId: techSolutions.id,
      role: "Technical Director",
      jobDescription: "Direzione tecnica e implementazione",
      isPrimary: true
    });

    // Create email account
    const emailAccount = await this.createEmailAccount({
      email: "john@experviser.com",
      displayName: "John Smith",
      imapHost: "imap.example.com",
      imapPort: 993,
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      username: "john@experviser.com",
      password: "password", // In a real app, this would be encrypted
      userId: 1
    });

    // Create emails
    const now = new Date();
    
    await this.createEmail({
      subject: "Proposal Follow-up",
      body: "Hi Sarah, I'm following up on our meeting about the foodservice operations proposal. Let me know if you have any questions.",
      from: "john@experviser.com",
      to: ["sarah@urbaneats.com"],
      cc: [],
      bcc: [],
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      accountId: emailAccount.id,
      contactId: sarahJohnson.id,
      companyId: urbanEats.id,
      messageId: "email1"
    });

    await this.createEmail({
      subject: "Meeting Confirmation",
      body: "Hello Alex, I'm looking forward to our meeting tomorrow to discuss the QSR franchise expansion.",
      from: "john@experviser.com",
      to: ["alex@qsrfranchise.com"],
      cc: [],
      bcc: [],
      date: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: true,
      accountId: emailAccount.id,
      contactId: alexChen.id,
      companyId: qsrFranchise.id,
      messageId: "email2"
    });

    await this.createEmail({
      subject: "Software Integration Details",
      body: "Hi Michael, I've attached the details about the software integration we discussed. Let me know what you think.",
      from: "mrodriguez@techsolutions.com",
      to: ["john@experviser.com"],
      cc: [],
      bcc: [],
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
      accountId: emailAccount.id,
      contactId: michaelRodriguez.id,
      companyId: techSolutions.id,
      messageId: "email3"
    });

    // Create tasks
    await this.createTask({
      title: "Follow up with Sarah about proposal",
      description: "Call Sarah to discuss the details of our proposal.",
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      completed: false,
      assignedToId: 1,
      contactId: sarahJohnson.id,
      companyId: urbanEats.id
    });

    await this.createTask({
      title: "Prepare presentation for QSR meeting",
      description: "Create slides for the QSR franchise expansion meeting.",
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      completed: false,
      assignedToId: 1,
      contactId: alexChen.id,
      companyId: qsrFranchise.id
    });

    await this.createTask({
      title: "Review Tech Solutions contract",
      description: "Go through the contract with the legal team and prepare comments.",
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
      completed: false,
      assignedToId: 1,
      contactId: michaelRodriguez.id,
      companyId: techSolutions.id
    });

    // Create meetings
    await this.createMeeting({
      title: "QSR Franchise Discussion",
      description: "Discuss franchise expansion opportunities in the West region.",
      startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
      endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
      location: "Phone Call",
      meetingType: "Call",
      contactId: alexChen.id,
      companyId: qsrFranchise.id,
      attendees: { internal: [1], external: [alexChen.id] }
    });

    await this.createMeeting({
      title: "Foodservice Proposal Review",
      description: "Review the operational proposal with Sarah and team.",
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(now.getTime() + 25.5 * 60 * 60 * 1000), // Tomorrow + 1.5 hours
      location: "Urban Eats HQ",
      meetingType: "In-Person",
      contactId: sarahJohnson.id,
      companyId: urbanEats.id,
      attendees: { internal: [1], external: [sarahJohnson.id] }
    });

    await this.createMeeting({
      title: "Tech Solutions Follow-up",
      description: "Follow up on software integration project progress.",
      startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 4 days + 1 hour
      location: "Zoom",
      meetingType: "Virtual",
      contactId: michaelRodriguez.id,
      companyId: techSolutions.id,
      attendees: { internal: [1], external: [michaelRodriguez.id] }
    });
  }
}

export const storage = new PostgresStorage();
