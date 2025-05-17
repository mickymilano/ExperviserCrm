import { db, pool } from "./db";
import {
  users,
  userSessions,
  securityLogs,
  areasOfActivity,
  synergies,
  leads,
  contacts,
  companies,
  pipelineStages,
  deals,
  activities,
  type User,
  type InsertUser,
  type UserSession,
  type InsertUserSession,
  type SecurityLog,
  type InsertSecurityLog,
  type AreaOfActivity,
  type InsertAreaOfActivity,
  type Synergy,
  type InsertSynergy,
  type Lead,
  type InsertLead,
  type Contact,
  type InsertContact,
  type Company,
  type InsertCompany,
  type PipelineStage,
  type InsertPipelineStage,
  type Deal,
  type InsertDeal,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { SQL, and, asc, desc, eq, ilike, inArray, lte, gte, sql, ne, isNull } from "drizzle-orm";
import { getContactsByCompany, getUnassignedContacts, updateContactCompany } from "./contacts-companies-methods";

// Interfaccia per l'accesso ai dati
export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: number,
    user: Partial<Omit<User, "id" | "createdAt">>
  ): Promise<User>;
  getUserSessionByToken(token: string): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(
    token: string,
    session: Partial<Omit<UserSession, "token" | "createdAt">>
  ): Promise<UserSession>;
  deleteUserSession(token: string): Promise<boolean>;
  deleteAllUserSessions(userId: number): Promise<boolean>;
  getSecurityLogs(userId?: number): Promise<SecurityLog[]>;
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;
  getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]>;
  getAreaOfActivity(id: number): Promise<AreaOfActivity | undefined>;
  createAreaOfActivity(
    area: InsertAreaOfActivity
  ): Promise<AreaOfActivity>;
  updateAreaOfActivity(
    id: number,
    area: Partial<Omit<AreaOfActivity, "id" | "createdAt">>
  ): Promise<AreaOfActivity>;
  deleteAreaOfActivity(id: number): Promise<boolean>;
  getAllSynergies(): Promise<Synergy[]>;
  getSynergiesCount(): Promise<number>;
  getSynergiesByContactId(contactId: number): Promise<Synergy[]>;
  getSynergiesByCompanyId(companyId: number): Promise<Synergy[]>;
  getSynergiesByDealId(dealId: number): Promise<Synergy[]>;
  getSynergyById(id: number): Promise<Synergy | undefined>;
  createSynergy(synergyData: InsertSynergy): Promise<Synergy>;
  updateSynergy(
    id: number,
    synergyData: Partial<Omit<Synergy, "id" | "createdAt">>
  ): Promise<Synergy>;
  deleteSynergy(id: number): Promise<boolean>;
  getAreasOfActivityByContactId(
    contactId: number
  ): Promise<AreaOfActivity[]>;
  resetPrimaryAreasOfActivity(contactId: number): Promise<boolean>;
  setPrimaryAreaOfActivity(id: number): Promise<boolean>;
  getLeads(): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  getLeadsCount(): Promise<number>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(
    id: number,
    lead: Partial<Omit<Lead, "id" | "createdAt">>
  ): Promise<Lead>;
  deleteLead(id: number): Promise<boolean>;
  getContacts(): Promise<Contact[]>;
  getAllContacts(): Promise<Contact[]>;
  getContactsCount(): Promise<number>;
  getRecentContacts(limit: number): Promise<Contact[]>;
  getContactsByCompany(companyId: number): Promise<Contact[]>;
  getUnassignedContacts(): Promise<Contact[]>;
  updateContactCompany(contactId: number, companyId: number | null): Promise<boolean>;
}

// Implementazione PostgreSQL dello storage
export class PostgresStorage implements IStorage {
  public db = db;
  
  // Metodi per gli utenti
  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(
    id: number,
    userData: Partial<Omit<User, "id" | "createdAt">>
  ): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Metodi per le sessioni
  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    const [session] = await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.token, token));
    return session;
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await this.db
      .insert(userSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateUserSession(
    token: string,
    sessionData: Partial<Omit<UserSession, "token" | "createdAt">>
  ): Promise<UserSession> {
    const [updatedSession] = await this.db
      .update(userSessions)
      .set({ ...sessionData, updatedAt: new Date() })
      .where(eq(userSessions.token, token))
      .returning();
    return updatedSession;
  }

  async deleteUserSession(token: string): Promise<boolean> {
    await this.db.delete(userSessions).where(eq(userSessions.token, token));
    return true;
  }

  async deleteAllUserSessions(userId: number): Promise<boolean> {
    await this.db.delete(userSessions).where(eq(userSessions.userId, userId));
    return true;
  }

  // Log di sicurezza
  async getSecurityLogs(userId?: number): Promise<SecurityLog[]> {
    let query = this.db.select().from(securityLogs);
    if (userId) {
      query = query.where(eq(securityLogs.userId, userId));
    }
    return await query.orderBy(desc(securityLogs.timestamp));
  }

  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    const [newLog] = await this.db.insert(securityLogs).values(log).returning();
    return newLog;
  }

  // Aree di attività
  async getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]> {
    return await this.db
      .select()
      .from(areasOfActivity)
      .where(eq(areasOfActivity.contactId, contactId));
  }

  async getAreaOfActivity(id: number): Promise<AreaOfActivity | undefined> {
    const [area] = await this.db
      .select()
      .from(areasOfActivity)
      .where(eq(areasOfActivity.id, id));
    return area;
  }

  async createAreaOfActivity(
    area: InsertAreaOfActivity
  ): Promise<AreaOfActivity> {
    const [newArea] = await this.db
      .insert(areasOfActivity)
      .values(area)
      .returning();
    return newArea;
  }

  async updateAreaOfActivity(
    id: number,
    areaData: Partial<Omit<AreaOfActivity, "id" | "createdAt">>
  ): Promise<AreaOfActivity> {
    const [updatedArea] = await this.db
      .update(areasOfActivity)
      .set({ ...areaData, updatedAt: new Date() })
      .where(eq(areasOfActivity.id, id))
      .returning();
    return updatedArea;
  }

  async deleteAreaOfActivity(id: number): Promise<boolean> {
    await this.db.delete(areasOfActivity).where(eq(areasOfActivity.id, id));
    return true;
  }

  // Sinergie
  async getAllSynergies(): Promise<Synergy[]> {
    return await this.db.select().from(synergies);
  }

  async getSynergiesCount(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(synergies);
    return Number(result[0].count) || 0;
  }

  async getSynergiesByContactId(contactId: number): Promise<Synergy[]> {
    return await this.db
      .select()
      .from(synergies)
      .where(eq(synergies.contactId, contactId));
  }

  async getSynergiesByCompanyId(companyId: number): Promise<Synergy[]> {
    return await this.db
      .select()
      .from(synergies)
      .where(eq(synergies.companyId, companyId));
  }

  async getSynergiesByDealId(dealId: number): Promise<Synergy[]> {
    return await this.db
      .select()
      .from(synergies)
      .where(eq(synergies.dealId, dealId));
  }

  async getSynergyById(id: number): Promise<Synergy | undefined> {
    const [synergy] = await this.db
      .select()
      .from(synergies)
      .where(eq(synergies.id, id));
    return synergy;
  }

  async createSynergy(synergyData: InsertSynergy): Promise<Synergy> {
    const [newSynergy] = await this.db
      .insert(synergies)
      .values(synergyData)
      .returning();
    return newSynergy;
  }

  async updateSynergy(
    id: number,
    synergyData: Partial<Omit<Synergy, "id" | "createdAt">>
  ): Promise<Synergy> {
    const [updatedSynergy] = await this.db
      .update(synergies)
      .set({ ...synergyData, updatedAt: new Date() })
      .where(eq(synergies.id, id))
      .returning();
    return updatedSynergy;
  }

  async deleteSynergy(id: number): Promise<boolean> {
    await this.db.delete(synergies).where(eq(synergies.id, id));
    return true;
  }

  async getAreasOfActivityByContactId(
    contactId: number
  ): Promise<AreaOfActivity[]> {
    return await this.db
      .select()
      .from(areasOfActivity)
      .where(eq(areasOfActivity.contactId, contactId));
  }

  async resetPrimaryAreasOfActivity(contactId: number): Promise<boolean> {
    await this.db
      .update(areasOfActivity)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(areasOfActivity.contactId, contactId));
    return true;
  }

  async setPrimaryAreaOfActivity(id: number): Promise<boolean> {
    const [area] = await this.db
      .select()
      .from(areasOfActivity)
      .where(eq(areasOfActivity.id, id));
    
    if (!area) {
      return false;
    }
    
    // Resetta tutte le aree di attività primarie per questo contatto
    await this.resetPrimaryAreasOfActivity(area.contactId);
    
    // Imposta questa area come primaria
    await this.db
      .update(areasOfActivity)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(areasOfActivity.id, id));
    
    return true;
  }

  // Lead
  async getLeads(): Promise<Lead[]> {
    return await this.db.select().from(leads);
  }

  async getAllLeads(): Promise<Lead[]> {
    return await this.db.select().from(leads);
  }

  async getLeadsCount(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(leads);
    return Number(result[0].count) || 0;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await this.db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(
    id: number,
    leadData: Partial<Omit<Lead, "id" | "createdAt">>
  ): Promise<Lead> {
    const [updatedLead] = await this.db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    await this.db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  // Contatti
  async getContacts(): Promise<Contact[]> {
    return await this.db
      .select()
      .from(contacts)
      .orderBy(asc(contacts.firstName), asc(contacts.lastName));
  }

  async getAllContacts(): Promise<Contact[]> {
    return await this.db
      .select()
      .from(contacts)
      .orderBy(asc(contacts.firstName), asc(contacts.lastName));
  }

  async getContactsCount(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(contacts);
    return Number(result[0].count) || 0;
  }

  async getRecentContacts(limit: number = 5): Promise<Contact[]> {
    return await this.db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .limit(limit);
  }

  // Utilizziamo i metodi dal modulo contacts-companies-methods.ts
  async getContactsByCompany(companyId: number): Promise<Contact[]> {
    return await getContactsByCompany(companyId);
  }

  async getUnassignedContacts(): Promise<Contact[]> {
    return await getUnassignedContacts();
  }

  async updateContactCompany(contactId: number, companyId: number | null): Promise<boolean> {
    return await updateContactCompany(contactId, companyId);
  }
}

export const storage = new PostgresStorage();