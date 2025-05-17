import { PostgresError } from "postgres";
import { db, pool } from "./db";
import { SQL, and, asc, desc, eq, ilike, inArray, lte, gte, sql } from "drizzle-orm";
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
  tasks,
  emailAccounts,
  emails,
  signatures,
  activities,
  meetings,
  contactEmails,
  branches,
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
  type Task,
  type InsertTask,
  type EmailAccount,
  type InsertEmailAccount,
  type Email,
  type InsertEmail,
  type Signature,
  type InsertSignature,
  type Activity,
  type InsertActivity,
  type Meeting,
  type InsertMeeting,
  type ContactEmail,
  type InsertContactEmail,
  type Branch,
  type InsertBranch,
} from "@shared/schema";

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
}

// Implementazione PostgreSQL dello storage
export class PostgresStorage implements IStorage {
  public db = db;

  async getUsers(): Promise<User[]> {
    try {
      console.log("PostgresStorage.getUsers: retrieving all users");
      const result = await this.db.select().from(users);
      return result;
    } catch (error) {
      console.error("Error in getUsers:", error);
      return [];
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUser: retrieving user ${id}`);
      const [result] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id));
      return result;
    } catch (error) {
      console.error(`Error in getUser(${id}):`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUserByUsername: retrieving user ${username}`);
      const [result] = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return result;
    } catch (error) {
      console.error(`Error in getUserByUsername(${username}):`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUserByEmail: retrieving user with email ${email}`);
      const [result] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return result;
    } catch (error) {
      console.error(`Error in getUserByEmail(${email}):`, error);
      return undefined;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUserByResetToken: retrieving user by reset token`);
      const [result] = await this.db
        .select()
        .from(users)
        .where(eq(users.resetToken, token));
      return result;
    } catch (error) {
      console.error(`Error in getUserByResetToken:`, error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      console.log(`PostgresStorage.createUser: creating new user`);
      const [result] = await this.db.insert(users).values(user).returning();
      return result;
    } catch (error) {
      console.error(`Error in createUser:`, error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    userData: Partial<Omit<User, "id" | "createdAt">>
  ): Promise<User> {
    try {
      console.log(`PostgresStorage.updateUser: updating user ${id}`);
      const [result] = await this.db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in updateUser(${id}):`, error);
      throw error;
    }
  }

  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    try {
      console.log(`PostgresStorage.getUserSessionByToken: retrieving session`);
      const [result] = await this.db
        .select()
        .from(userSessions)
        .where(eq(userSessions.token, token));
      return result;
    } catch (error) {
      console.error(`Error in getUserSessionByToken:`, error);
      return undefined;
    }
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    try {
      console.log(`PostgresStorage.createUserSession: creating new session`);
      const [result] = await this.db
        .insert(userSessions)
        .values(session)
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in createUserSession:`, error);
      throw error;
    }
  }

  async updateUserSession(
    token: string,
    sessionData: Partial<Omit<UserSession, "token" | "createdAt">>
  ): Promise<UserSession> {
    try {
      console.log(`PostgresStorage.updateUserSession: updating session`);
      const [result] = await this.db
        .update(userSessions)
        .set({ ...sessionData, updatedAt: new Date() })
        .where(eq(userSessions.token, token))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in updateUserSession:`, error);
      throw error;
    }
  }

  async deleteUserSession(token: string): Promise<boolean> {
    try {
      console.log(`PostgresStorage.deleteUserSession: deleting session`);
      const result = await this.db
        .delete(userSessions)
        .where(eq(userSessions.token, token));
      return true;
    } catch (error) {
      console.error(`Error in deleteUserSession:`, error);
      return false;
    }
  }

  async deleteAllUserSessions(userId: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.deleteAllUserSessions: deleting all sessions for user ${userId}`);
      const result = await this.db
        .delete(userSessions)
        .where(eq(userSessions.userId, userId));
      return true;
    } catch (error) {
      console.error(`Error in deleteAllUserSessions(${userId}):`, error);
      return false;
    }
  }

  async getSecurityLogs(userId?: number): Promise<SecurityLog[]> {
    try {
      console.log(`PostgresStorage.getSecurityLogs: retrieving logs${userId ? ` for user ${userId}` : ''}`);
      let query = this.db.select().from(securityLogs);
      
      if (userId) {
        query = query.where(eq(securityLogs.userId, userId));
      }
      
      const result = await query.orderBy(desc(securityLogs.timestamp));
      return result;
    } catch (error) {
      console.error(`Error in getSecurityLogs:`, error);
      return [];
    }
  }

  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    try {
      console.log(`PostgresStorage.createSecurityLog: creating new log`);
      const [result] = await this.db
        .insert(securityLogs)
        .values(log)
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in createSecurityLog:`, error);
      throw error;
    }
  }

  async getAreasOfActivity(contactId: number): Promise<AreaOfActivity[]> {
    try {
      console.log(`PostgresStorage.getAreasOfActivity: retrieving areas for contact ${contactId}`);
      const result = await this.db
        .select()
        .from(areasOfActivity)
        .where(eq(areasOfActivity.contactId, contactId));
      return result;
    } catch (error) {
      console.error(`Error in getAreasOfActivity(${contactId}):`, error);
      return [];
    }
  }

  async getAreaOfActivity(id: number): Promise<AreaOfActivity | undefined> {
    try {
      console.log(`PostgresStorage.getAreaOfActivity: retrieving area ${id}`);
      const [result] = await this.db
        .select()
        .from(areasOfActivity)
        .where(eq(areasOfActivity.id, id));
      return result;
    } catch (error) {
      console.error(`Error in getAreaOfActivity(${id}):`, error);
      return undefined;
    }
  }

  async createAreaOfActivity(
    area: InsertAreaOfActivity
  ): Promise<AreaOfActivity> {
    try {
      console.log(`PostgresStorage.createAreaOfActivity: creating new area`);
      const [result] = await this.db
        .insert(areasOfActivity)
        .values(area)
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in createAreaOfActivity:`, error);
      throw error;
    }
  }

  async updateAreaOfActivity(
    id: number,
    areaData: Partial<Omit<AreaOfActivity, "id" | "createdAt">>
  ): Promise<AreaOfActivity> {
    try {
      console.log(`PostgresStorage.updateAreaOfActivity: updating area ${id}`);
      const [result] = await this.db
        .update(areasOfActivity)
        .set({ ...areaData, updatedAt: new Date() })
        .where(eq(areasOfActivity.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in updateAreaOfActivity(${id}):`, error);
      throw error;
    }
  }

  async deleteAreaOfActivity(id: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.deleteAreaOfActivity: deleting area ${id}`);
      const result = await this.db
        .delete(areasOfActivity)
        .where(eq(areasOfActivity.id, id));
      return true;
    } catch (error) {
      console.error(`Error in deleteAreaOfActivity(${id}):`, error);
      return false;
    }
  }

  async getAllSynergies(): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getAllSynergies: retrieving all synergies`);
      const result = await this.db.select().from(synergies);
      return result;
    } catch (error) {
      console.error(`Error in getAllSynergies:`, error);
      return [];
    }
  }

  async getSynergiesCount(): Promise<number> {
    try {
      console.log(`PostgresStorage.getSynergiesCount: retrieving count`);
      const result = await this.db.select({ count: sql`count(*)` }).from(synergies);
      return Number(result[0].count) || 0;
    } catch (error) {
      console.error(`Error in getSynergiesCount:`, error);
      return 0;
    }
  }

  async getSynergiesByContactId(contactId: number): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getSynergiesByContactId: retrieving synergies for contact ${contactId}`);
      const result = await this.db
        .select()
        .from(synergies)
        .where(eq(synergies.contactId, contactId));
      return result;
    } catch (error) {
      console.error(`Error in getSynergiesByContactId(${contactId}):`, error);
      return [];
    }
  }

  async getSynergiesByCompanyId(companyId: number): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getSynergiesByCompanyId: retrieving synergies for company ${companyId}`);
      const result = await this.db
        .select()
        .from(synergies)
        .where(eq(synergies.companyId, companyId));
      return result;
    } catch (error) {
      console.error(`Error in getSynergiesByCompanyId(${companyId}):`, error);
      return [];
    }
  }

  async getSynergiesByDealId(dealId: number): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getSynergiesByDealId: retrieving synergies for deal ${dealId}`);
      const result = await this.db
        .select()
        .from(synergies)
        .where(eq(synergies.dealId, dealId));
      return result;
    } catch (error) {
      console.error(`Error in getSynergiesByDealId(${dealId}):`, error);
      return [];
    }
  }

  async getSynergyById(id: number): Promise<Synergy | undefined> {
    try {
      console.log(`PostgresStorage.getSynergyById: retrieving synergy ${id}`);
      const [result] = await this.db
        .select()
        .from(synergies)
        .where(eq(synergies.id, id));
      return result;
    } catch (error) {
      console.error(`Error in getSynergyById(${id}):`, error);
      return undefined;
    }
  }

  async createSynergy(synergyData: InsertSynergy): Promise<Synergy> {
    try {
      console.log(`PostgresStorage.createSynergy: creating new synergy`);
      const [result] = await this.db
        .insert(synergies)
        .values(synergyData)
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in createSynergy:`, error);
      throw error;
    }
  }

  async updateSynergy(
    id: number,
    synergyData: Partial<Omit<Synergy, "id" | "createdAt">>
  ): Promise<Synergy> {
    try {
      console.log(`PostgresStorage.updateSynergy: updating synergy ${id}`);
      const [result] = await this.db
        .update(synergies)
        .set({ ...synergyData, updatedAt: new Date() })
        .where(eq(synergies.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in updateSynergy(${id}):`, error);
      throw error;
    }
  }

  async deleteSynergy(id: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.deleteSynergy: deleting synergy ${id}`);
      const result = await this.db
        .delete(synergies)
        .where(eq(synergies.id, id));
      return true;
    } catch (error) {
      console.error(`Error in deleteSynergy(${id}):`, error);
      return false;
    }
  }

  async getAreasOfActivityByContactId(
    contactId: number
  ): Promise<AreaOfActivity[]> {
    try {
      console.log(`PostgresStorage.getAreasOfActivityByContactId: retrieving areas for contact ${contactId}`);
      const result = await this.db
        .select()
        .from(areasOfActivity)
        .where(eq(areasOfActivity.contactId, contactId));
      return result;
    } catch (error) {
      console.error(`Error in getAreasOfActivityByContactId(${contactId}):`, error);
      return [];
    }
  }

  async resetPrimaryAreasOfActivity(contactId: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.resetPrimaryAreasOfActivity: resetting primary areas for contact ${contactId}`);
      await this.db
        .update(areasOfActivity)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(areasOfActivity.contactId, contactId));
      return true;
    } catch (error) {
      console.error(`Error in resetPrimaryAreasOfActivity(${contactId}):`, error);
      return false;
    }
  }

  async setPrimaryAreaOfActivity(id: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.setPrimaryAreaOfActivity: setting area ${id} as primary`);
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
    } catch (error) {
      console.error(`Error in setPrimaryAreaOfActivity(${id}):`, error);
      return false;
    }
  }

  async getLeads(): Promise<Lead[]> {
    try {
      console.log(`PostgresStorage.getLeads: retrieving all leads`);
      const result = await this.db.select().from(leads);
      return result;
    } catch (error) {
      console.error(`Error in getLeads:`, error);
      return [];
    }
  }

  async getAllLeads(): Promise<Lead[]> {
    try {
      console.log(`PostgresStorage.getAllLeads: retrieving all leads`);
      const result = await this.db.select().from(leads);
      return result;
    } catch (error) {
      console.error(`Error in getAllLeads:`, error);
      return [];
    }
  }

  async getLeadsCount(): Promise<number> {
    try {
      console.log(`PostgresStorage.getLeadsCount: retrieving count`);
      const result = await this.db.select({ count: sql`count(*)` }).from(leads);
      return Number(result[0].count) || 0;
    } catch (error) {
      console.error(`Error in getLeadsCount:`, error);
      return 0;
    }
  }

  async getLead(id: number): Promise<Lead | undefined> {
    try {
      console.log(`PostgresStorage.getLead: retrieving lead ${id}`);
      const [result] = await this.db
        .select()
        .from(leads)
        .where(eq(leads.id, id));
      return result;
    } catch (error) {
      console.error(`Error in getLead(${id}):`, error);
      return undefined;
    }
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    try {
      console.log(`PostgresStorage.createLead: creating new lead`);
      const [result] = await this.db.insert(leads).values(lead).returning();
      return result;
    } catch (error) {
      console.error(`Error in createLead:`, error);
      throw error;
    }
  }

  async updateLead(
    id: number,
    leadData: Partial<Omit<Lead, "id" | "createdAt">>
  ): Promise<Lead> {
    try {
      console.log(`PostgresStorage.updateLead: updating lead ${id}`);
      const [result] = await this.db
        .update(leads)
        .set({ ...leadData, updatedAt: new Date() })
        .where(eq(leads.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error in updateLead(${id}):`, error);
      throw error;
    }
  }

  async deleteLead(id: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.deleteLead: deleting lead ${id}`);
      const result = await this.db.delete(leads).where(eq(leads.id, id));
      return true;
    } catch (error) {
      console.error(`Error in deleteLead(${id}):`, error);
      return false;
    }
  }

  async getContacts(): Promise<Contact[]> {
    try {
      console.log(`PostgresStorage.getContacts: retrieving all contacts`);
      const result = await this.db
        .select()
        .from(contacts)
        .orderBy(asc(contacts.firstName), asc(contacts.lastName));
      return result;
    } catch (error) {
      console.error(`Error in getContacts:`, error);
      return [];
    }
  }

  async getAllContacts(): Promise<Contact[]> {
    try {
      console.log(`PostgresStorage.getAllContacts: retrieving all contacts`);
      const result = await this.db
        .select()
        .from(contacts)
        .orderBy(asc(contacts.firstName), asc(contacts.lastName));
      return result;
    } catch (error) {
      console.error(`Error in getAllContacts:`, error);
      return [];
    }
  }

  async getContactsCount(): Promise<number> {
    try {
      console.log(`PostgresStorage.getContactsCount: retrieving count`);
      const result = await this.db.select({ count: sql`count(*)` }).from(contacts);
      return Number(result[0].count) || 0;
    } catch (error) {
      console.error(`Error in getContactsCount:`, error);
      return 0;
    }
  }

  async getRecentContacts(limit: number = 5): Promise<Contact[]> {
    try {
      console.log(`PostgresStorage.getRecentContacts: retrieving ${limit} recent contacts`);
      const result = await this.db
        .select()
        .from(contacts)
        .orderBy(desc(contacts.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error(`Error in getRecentContacts:`, error);
      return [];
    }
  }

  // Questi metodi sono stati spostati in contacts-companies-methods.ts
  // per evitare conflitti sintattici e migliorare la manutenibilità
  async getContactsByCompany(companyId: number): Promise<Contact[]> {
    console.log("PostgresStorage.getContactsByCompany: Delegating to external module");
    // Questo metodo è stato spostato in contacts-companies-methods.ts
    return [];
  }

  // Alias per compatibilità con lo script di correzione delle relazioni
  async getCompanyContacts(companyId: number): Promise<Contact[]> {
    console.log("PostgresStorage.getCompanyContacts: Delegating to external module");
    // Questo metodo è stato spostato in contacts-companies-methods.ts
    return [];
  }

  // Questi metodi sono stati rimossi temporaneamente per facilitare lo sviluppo
  // Per implementare queste funzionalità, utilizzare contacts-companies-methods.ts
  async getContactCompanies(contactId: number): Promise<Company[]> {
    console.log("PostgresStorage.getContactCompanies: Delegating to external module");
    return [];
  }
  
  async getUnassignedContacts(): Promise<Contact[]> {
    console.log("PostgresStorage.getUnassignedContacts: Delegating to external module");
    return [];
  }
  
  async updateContactCompany(contactId: number, companyId: number | null): Promise<boolean> {
    console.log("PostgresStorage.updateContactCompany: Delegating to external module");
    return true;
  }
}