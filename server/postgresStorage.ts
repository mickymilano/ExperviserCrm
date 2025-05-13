import { db, pool } from "./db";
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
  // Espone l'oggetto db per query dirette
  public db = db;
  // USERS
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.fullName);
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUser: cercando utente con id ${id}`);
      
      // Utilizziamo SQL nativo con un prepared statement corretto
      const result = await pool.query(
        `SELECT 
          id, 
          username, 
          password,
          full_name as "fullName",
          email,
          backup_email as "backupEmail",
          phone,
          role,
          status,
          last_login_at as "lastLogin",
          reset_password_token as "resetToken",
          reset_password_expires as "resetTokenExpires",
          avatar as "avatarUrl",
          timezone,
          language,
          job_title as "jobTitle",
          email_verified as "emailVerified",
          login_attempts as "loginAttempts",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        console.log(`Nessun utente trovato con id ${id}`);
        return undefined;
      }
      
      console.log(`Utente trovato con id ${id}`);
      return result.rows[0] as User;
    } catch (error) {
      console.error(`Errore in getUser(${id}):`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUserByUsername: cercando utente con username ${username}`);
      
      // Utilizziamo SQL nativo con un prepared statement corretto
      const result = await pool.query(
        `SELECT 
          id, 
          username, 
          password,
          full_name as "fullName",
          email,
          backup_email as "backupEmail",
          phone,
          role,
          status,
          last_login_at as "lastLogin",
          reset_password_token as "resetToken",
          reset_password_expires as "resetTokenExpires",
          avatar as "avatarUrl",
          timezone,
          language,
          job_title as "jobTitle",
          email_verified as "emailVerified",
          login_attempts as "loginAttempts",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE username = $1`,
        [username]
      );
      
      if (result.rows.length === 0) {
        console.log(`Nessun utente trovato con username ${username}`);
        return undefined;
      }
      
      console.log(`Utente trovato con username ${username}`);
      return result.rows[0] as User;
    } catch (error) {
      console.error(`Errore in getUserByUsername(${username}):`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUserByEmail: cercando utente con email ${email}`);
      
      // Utilizziamo SQL nativo con un prepared statement corretto
      const result = await pool.query(
        `SELECT 
          id, 
          username, 
          password,
          full_name as "fullName",
          email,
          backup_email as "backupEmail",
          phone,
          role,
          status,
          last_login_at as "lastLogin",
          reset_password_token as "resetToken",
          reset_password_expires as "resetTokenExpires",
          avatar as "avatarUrl",
          timezone,
          language,
          job_title as "jobTitle",
          email_verified as "emailVerified",
          login_attempts as "loginAttempts",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        console.log(`Nessun utente trovato con email ${email}`);
        return undefined;
      }
      
      console.log(`Utente trovato con email ${email}`);
      return result.rows[0] as User;
    } catch (error) {
      console.error(`Errore in getUserByEmail(${email}):`, error);
      return undefined;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      console.log(`PostgresStorage.getUserByResetToken: cercando utente con token ${token}`);
      
      // Utilizziamo SQL nativo con un prepared statement corretto
      const result = await pool.query(
        `SELECT 
          id, 
          username, 
          password,
          full_name as "fullName",
          email,
          backup_email as "backupEmail",
          phone,
          role,
          status,
          last_login_at as "lastLogin",
          reset_password_token as "resetToken",
          reset_password_expires as "resetTokenExpires",
          avatar as "avatarUrl",
          timezone,
          language,
          job_title as "jobTitle",
          email_verified as "emailVerified",
          login_attempts as "loginAttempts",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE reset_password_token = $1`,
        [token]
      );
      
      if (result.rows.length === 0) {
        console.log(`Nessun utente trovato con token di reset ${token}`);
        return undefined;
      }
      
      console.log(`Utente trovato con token di reset ${token}`);
      return result.rows[0] as User;
    } catch (error) {
      console.error(`Errore in getUserByResetToken(${token}):`, error);
      return undefined;
    }
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
    try {
      console.log("PostgresStorage.getAllSynergies: recuperando tutte le sinergie attive");
      
      // Utilizziamo SQL nativo per avere più controllo e filtriamo solo le sinergie attive
      const result = await pool.query(`
        SELECT 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          start_date,
          end_date,
          is_active,
          created_at,
          updated_at
        FROM synergies
        WHERE is_active = true
        ORDER BY created_at DESC
      `);
      
      console.log(`getAllSynergies: Found ${result.rows.length} synergies`);
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return result.rows.map(synergy => {
        return {
          id: synergy.id,
          contactId: synergy.contact_id,
          companyId: synergy.company_id,
          dealId: synergy.deal_id,
          type: synergy.type || "business",
          description: synergy.description || "",
          status: synergy.status || "Active",
          startDate: synergy.start_date,
          endDate: synergy.end_date,
          isActive: synergy.is_active,
          createdAt: synergy.created_at,
          updatedAt: synergy.updated_at
        };
      });
    } catch (error) {
      console.error("Error in getAllSynergies:", error);
      return [];
    }
  }
  
  async getSynergiesCount(): Promise<number> {
    try {
      console.log("PostgresStorage.getSynergiesCount: retrieving active synergies count");
      
      const queryStr = `SELECT COUNT(*) as count FROM synergies WHERE is_active = true`;
      const result = await pool.query(queryStr);
      
      console.log(`Retrieved ${result.rows[0].count} active synergies count`);
      
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error("Error in getSynergiesCount:", error);
      return 0;
    }
  }
  
  async getSynergiesByContactId(contactId: number): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getSynergiesByContactId: retrieving synergies for contact ${contactId}`);
      
      const result = await pool.query(`
        SELECT 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          start_date,
          end_date,
          created_at,
          updated_at
        FROM synergies
        WHERE contact_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [contactId]);
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return result.rows.map(synergy => {
        return {
          id: synergy.id,
          contactId: synergy.contact_id,
          companyId: synergy.company_id,
          dealId: synergy.deal_id,
          type: synergy.type || "business",
          startDate: synergy.start_date,
          endDate: synergy.end_date,
          description: synergy.description || "",
          status: synergy.status || "Active",
          createdAt: synergy.created_at,
          updatedAt: synergy.updated_at
        };
      });
    } catch (error) {
      console.error(`Error in getSynergiesByContactId(${contactId}):`, error);
      return [];
    }
  }
  
  async getSynergiesByCompanyId(companyId: number): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getSynergiesByCompanyId: retrieving synergies for company ${companyId}`);
      
      const result = await pool.query(`
        SELECT 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          start_date,
          end_date,
          created_at,
          updated_at
        FROM synergies
        WHERE company_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [companyId]);
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return result.rows.map(synergy => {
        return {
          id: synergy.id,
          contactId: synergy.contact_id,
          companyId: synergy.company_id,
          startDate: synergy.start_date,
          endDate: synergy.end_date,
          dealId: synergy.deal_id,
          type: synergy.type || "business",
          description: synergy.description || "",
          status: synergy.status || "Active",
          createdAt: synergy.created_at,
          updatedAt: synergy.updated_at
        };
      });
    } catch (error) {
      console.error(`Error in getSynergiesByCompanyId(${companyId}):`, error);
      return [];
    }
  }
  
  async getSynergiesByDealId(dealId: number): Promise<Synergy[]> {
    try {
      console.log(`PostgresStorage.getSynergiesByDealId: retrieving synergies for deal ${dealId}`);
      
      const result = await pool.query(`
        SELECT 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          start_date,
          end_date,
          created_at,
          updated_at
        FROM synergies
        WHERE deal_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `, [dealId]);
      
      // Array per memorizzare i risultati finali
      const synergiesWithRelations = [];
      
      // Per ogni sinergia, recupera i dati del contatto associato
      for (const synergy of result.rows) {
        // Prepara l'oggetto base della sinergia
        const synergyObject = {
          id: synergy.id,
          startDate: synergy.start_date,
          endDate: synergy.end_date,
          contactId: synergy.contact_id,
          companyId: synergy.company_id,
          dealId: synergy.deal_id,
          type: synergy.type || "business",
          description: synergy.description || "",
          status: synergy.status || "Active",
          createdAt: synergy.created_at,
          updatedAt: synergy.updated_at,
          contact: null, // Placeholder per i dati del contatto
          company: null  // Placeholder per i dati dell'azienda
        };
        
        // Se c'è un contatto associato, recuperane i dati
        if (synergy.contact_id) {
          const contactQuery = await pool.query(`
            SELECT 
              id, first_name, middle_name, last_name, status, 
              mobile_phone, company_email, private_email, 
              office_phone, private_phone, linkedin, facebook,
              instagram, tiktok, tags, roles, notes, custom_fields,
              last_contacted_at, next_follow_up_at, created_at, updated_at
            FROM contacts 
            WHERE id = $1
          `, [synergy.contact_id]);
          
          if (contactQuery.rows.length > 0) {
            const contactData = contactQuery.rows[0];
            // Trasforma i dati del contatto nel formato atteso dal frontend
            synergyObject.contact = {
              id: contactData.id,
              firstName: contactData.first_name,
              lastName: contactData.last_name,
              middleName: contactData.middle_name,
              status: contactData.status,
              mobilePhone: contactData.mobile_phone,
              companyEmail: contactData.company_email,
              privateEmail: contactData.private_email,
              officePhone: contactData.office_phone,
              privatePhone: contactData.private_phone,
              // Include altri campi se necessario
            };
          }
        }
        
        // Aggiungi la sinergia arricchita all'array dei risultati
        synergiesWithRelations.push(synergyObject);
      }
      
      return synergiesWithRelations;
    } catch (error) {
      console.error(`Error in getSynergiesByDealId(${dealId}):`, error);
      return [];
    }
  }
  
  async getSynergyById(id: number): Promise<Synergy | undefined> {
    try {
      console.log(`PostgresStorage.getSynergyById: retrieving synergy ${id}`);
      
      const result = await pool.query(`
        SELECT 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          start_date,
          end_date,
          created_at,
          updated_at
        FROM synergies
        WHERE id = $1 AND is_active = true
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const synergy = result.rows[0];
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return {
        id: synergy.id,
        contactId: synergy.contact_id,
        companyId: synergy.company_id,
        dealId: synergy.deal_id,
        type: synergy.type || "business",
        description: synergy.description || "",
        status: synergy.status || "Active",
        startDate: synergy.start_date,
        endDate: synergy.end_date,
        createdAt: synergy.created_at,
        updatedAt: synergy.updated_at
      };
    } catch (error) {
      console.error(`Error in getSynergyById(${id}):`, error);
      return undefined;
    }
  }
  
  async createSynergy(synergyData: InsertSynergy): Promise<Synergy> {
    try {
      console.log(`PostgresStorage.createSynergy: creating new synergy`);
      
      const result = await pool.query(`
        INSERT INTO synergies (
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        ) RETURNING 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          created_at,
          updated_at
      `, [
        synergyData.contactId,
        synergyData.companyId,
        synergyData.dealId || null,
        synergyData.type || "business",
        synergyData.description || "",
        synergyData.status || "Active"
      ]);
      
      const newSynergy = result.rows[0];
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return {
        id: newSynergy.id,
        contactId: newSynergy.contact_id,
        companyId: newSynergy.company_id,
        dealId: newSynergy.deal_id,
        type: newSynergy.type || "business",
        description: newSynergy.description || "",
        status: newSynergy.status || "Active",
        createdAt: newSynergy.created_at,
        updatedAt: newSynergy.updated_at
      };
    } catch (error) {
      console.error("Error in createSynergy:", error);
      throw new Error("Failed to create synergy");
    }
  }
  
  async updateSynergy(id: number, synergyData: Partial<InsertSynergy>): Promise<Synergy | undefined> {
    try {
      console.log(`PostgresStorage.updateSynergy: updating synergy ${id}`);
      
      // Costruiamo dinamicamente la query di aggiornamento
      let updateFields = [];
      let params = [];
      let paramCounter = 1;
      
      // Aggiungiamo solo i campi che esistono nel synergyData
      if (synergyData.contactId !== undefined) {
        updateFields.push(`contact_id = $${paramCounter++}`);
        params.push(synergyData.contactId);
      }
      
      if (synergyData.companyId !== undefined) {
        updateFields.push(`company_id = $${paramCounter++}`);
        params.push(synergyData.companyId);
      }
      
      if (synergyData.dealId !== undefined) {
        updateFields.push(`deal_id = $${paramCounter++}`);
        params.push(synergyData.dealId);
      }
      
      if (synergyData.type !== undefined) {
        updateFields.push(`type = $${paramCounter++}`);
        params.push(synergyData.type);
      }
      
      if (synergyData.description !== undefined) {
        updateFields.push(`description = $${paramCounter++}`);
        params.push(synergyData.description);
      }
      
      if (synergyData.status !== undefined) {
        updateFields.push(`status = $${paramCounter++}`);
        params.push(synergyData.status);
      }
      
      // Aggiungiamo sempre l'updated_at
      updateFields.push(`updated_at = NOW()`);
      
      // Se non ci sono campi da aggiornare, restituiamo la sinergia esistente
      if (updateFields.length === 1) {
        return this.getSynergyById(id);
      }
      
      // Aggiungiamo l'id come ultimo parametro
      params.push(id);
      
      const result = await pool.query(`
        UPDATE synergies SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING 
          id,
          contact_id, 
          company_id, 
          deal_id,
          type,
          description,
          status,
          created_at,
          updated_at
      `, params);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const updatedSynergy = result.rows[0];
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return {
        id: updatedSynergy.id,
        contactId: updatedSynergy.contact_id,
        companyId: updatedSynergy.company_id,
        dealId: updatedSynergy.deal_id,
        type: updatedSynergy.type || "business",
        description: updatedSynergy.description || "",
        status: updatedSynergy.status || "Active",
        createdAt: updatedSynergy.created_at,
        updatedAt: updatedSynergy.updated_at
      };
    } catch (error) {
      console.error(`Error in updateSynergy(${id}):`, error);
      return undefined;
    }
  }
  
  async deleteSynergy(id: number): Promise<boolean> {
    try {
      console.log(`PostgresStorage.deleteSynergy: soft-deleting synergy ${id} (setting isActive=false)`);
      
      // Implementa soft delete invece di una cancellazione fisica
      const result = await pool.query(`
        UPDATE synergies
        SET is_active = false, 
            updated_at = NOW()
        WHERE id = $1
      `, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error in deleteSynergy(${id}):`, error);
      return false;
    }
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
    try {
      // Otteniamo i lead direttamente con SQL nativo mappando i campi della tabella effettiva
      // Non c'è una colonna 'name', dobbiamo usare first_name e last_name
      const result = await pool.query(`
        SELECT 
          id, 
          first_name,
          middle_name,
          last_name,
          company_name, 
          role,
          mobile_phone,
          company_email,
          private_email,
          office_phone,
          private_phone,
          linkedin,
          facebook,
          instagram,
          tiktok,
          website,
          source, 
          status, 
          tags,
          notes, 
          assigned_to_id,
          custom_fields,
          created_at, 
          updated_at
        FROM leads 
        ORDER BY first_name, last_name
      `);
      
      console.log(`getLeads: Found ${result.rows.length} leads`);
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return result.rows.map(lead => {
        const phone = lead.mobile_phone || lead.office_phone || lead.private_phone || '';
        const email = lead.company_email || lead.private_email || '';
        
        return {
          id: lead.id,
          firstName: lead.first_name || "",
          lastName: lead.last_name || "",
          // Il frontend usa name in alcuni punti
          name: `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
          // Il frontend usa email/phone invece delle versioni specifiche
          email: email,
          phone: phone,
          companyName: lead.company_name || "",
          companyEmail: lead.company_email || "",
          privateEmail: lead.private_email || "",
          mobilePhone: lead.mobile_phone || "",
          officePhone: lead.office_phone || "",
          privatePhone: lead.private_phone || "",
          status: lead.status || "new",
          source: lead.source || "",
          notes: lead.notes || "",
          tags: lead.tags || [],
          createdAt: lead.created_at,
          updatedAt: lead.updated_at
        };
      });
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
    try {
      // Utilizziamo SQL nativo per evitare problemi con l'ORM
      const result = await pool.query(`SELECT COUNT(*) as count FROM leads`);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error("Error in getLeadsCount:", error);
      return 0;
    }
  }

  async getLead(id: number): Promise<Lead | undefined> {
    try {
      // Utilizziamo SQL nativo per evitare problemi con l'ORM
      const result = await pool.query(`
        SELECT 
          id, 
          first_name,
          middle_name,
          last_name,
          company_name, 
          role,
          mobile_phone,
          company_email,
          private_email,
          office_phone,
          private_phone,
          linkedin,
          facebook,
          instagram,
          tiktok,
          website,
          source, 
          status, 
          tags,
          notes, 
          assigned_to_id,
          custom_fields,
          created_at, 
          updated_at
        FROM leads 
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const lead = result.rows[0];
      const phone = lead.mobile_phone || lead.office_phone || lead.private_phone || '';
      const email = lead.company_email || lead.private_email || '';
      
      // Adaptiamo il formato per essere compatibile con il frontend
      return {
        id: lead.id,
        firstName: lead.first_name || "",
        lastName: lead.last_name || "",
        name: `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
        email: email,
        phone: phone,
        companyName: lead.company_name || "",
        companyEmail: lead.company_email || "",
        privateEmail: lead.private_email || "",
        mobilePhone: lead.mobile_phone || "",
        officePhone: lead.office_phone || "",
        privatePhone: lead.private_phone || "",
        status: lead.status || "new",
        source: lead.source || "",
        notes: lead.notes || "",
        tags: lead.tags || [],
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      };
    } catch (error) {
      console.error(`Error in getLead(${id}):`, error);
      return undefined;
    }
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    try {
      // Estraiamo i campi dal lead object
      const { name, status, source, notes, companyName, jobTitle, leadOwner } = lead;
      
      // Usando una query SQL nativa
      const result = await pool.query(`
        INSERT INTO leads (
          name, 
          status, 
          source, 
          notes, 
          company_name, 
          job_title, 
          lead_owner, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING 
          id, 
          name, 
          status, 
          source, 
          notes, 
          company_name as "companyName", 
          job_title as "jobTitle", 
          lead_owner as "leadOwner", 
          created_at as "createdAt", 
          updated_at as "updatedAt"
      `, [name, status, source, notes, companyName, jobTitle, leadOwner]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error in createLead:", error);
      throw new Error("Failed to create lead");
    }
  }

  async updateLead(id: number, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    try {
      // Costruiamo dinamicamente la query di aggiornamento
      let updateFields = [];
      let params = [];
      let paramCounter = 1;
      
      // Aggiungiamo solo i campi che esistono nel leadData
      if (leadData.name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        params.push(leadData.name);
      }
      
      if (leadData.status !== undefined) {
        updateFields.push(`status = $${paramCounter++}`);
        params.push(leadData.status);
      }
      
      if (leadData.source !== undefined) {
        updateFields.push(`source = $${paramCounter++}`);
        params.push(leadData.source);
      }
      
      if (leadData.notes !== undefined) {
        updateFields.push(`notes = $${paramCounter++}`);
        params.push(leadData.notes);
      }
      
      if (leadData.companyName !== undefined) {
        updateFields.push(`company_name = $${paramCounter++}`);
        params.push(leadData.companyName);
      }
      
      if (leadData.jobTitle !== undefined) {
        updateFields.push(`job_title = $${paramCounter++}`);
        params.push(leadData.jobTitle);
      }
      
      if (leadData.leadOwner !== undefined) {
        updateFields.push(`lead_owner = $${paramCounter++}`);
        params.push(leadData.leadOwner);
      }
      
      // Aggiungiamo sempre l'updated_at
      updateFields.push(`updated_at = NOW()`);
      
      // Se non ci sono campi da aggiornare, restituiamo il lead esistente
      if (updateFields.length === 1) {
        return this.getLead(id);
      }
      
      // Aggiungiamo l'id come ultimo parametro
      params.push(id);
      
      const result = await pool.query(`
        UPDATE leads SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING 
          id, 
          name, 
          status, 
          source, 
          notes, 
          company_name as "companyName", 
          job_title as "jobTitle", 
          lead_owner as "leadOwner", 
          created_at as "createdAt", 
          updated_at as "updatedAt"
      `, params);
      
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error("Error in updateLead:", error);
      return undefined;
    }
  }

  async deleteLead(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM leads WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in deleteLead:", error);
      return false;
    }
  }

  // CONTACTS
  async getContacts(): Promise<Contact[]> {
    // Simplified query without relational features to prevent 'map' errors
    // Rimosso filtro per status per ottenere tutti i contatti, come per leads
    console.log("PostgresStorage.getContacts: retrieving all contacts regardless of status");
    try {
      // Seleziona colonne esattamente come sono definite nel database
      const result = await db.execute(
        `SELECT 
          id, 
          first_name as "firstName", 
          last_name as "lastName", 
          status, 
          company_email as "companyEmail", 
          private_email as "privateEmail", 
          mobile_phone as "mobilePhone", 
          office_phone as "officePhone",
          private_phone as "privatePhone",
          created_at as "createdAt", 
          updated_at as "updatedAt" 
        FROM contacts 
        ORDER BY first_name, last_name`
      );
      return result.rows as Contact[];
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
      // Seleziona colonne esattamente come sono definite nel database
      // Aggiunge fullName come concatenazione di first_name e last_name
      const result = await pool.query(
        `SELECT 
          id, 
          first_name as "firstName", 
          last_name as "lastName",
          CONCAT(first_name, ' ', last_name) as "fullName",
          company_email as "email", 
          status, 
          company_email as "companyEmail", 
          private_email as "privateEmail", 
          mobile_phone as "mobilePhone", 
          office_phone as "officePhone",
          private_phone as "privatePhone",
          created_at as "createdAt", 
          updated_at as "updatedAt" 
        FROM contacts 
        ORDER BY updated_at DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows as Contact[];
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
      
      // Get all contacts with these IDs usando SQL nativo
      const idsList = contactIds.map(c => c.contactId).join(',');
      const result = await db.execute(
        `SELECT 
          id, 
          first_name as "firstName", 
          last_name as "lastName", 
          status, 
          company_email as "companyEmail", 
          private_email as "privateEmail", 
          mobile_phone as "mobilePhone", 
          office_phone as "officePhone",
          private_phone as "privatePhone",
          created_at as "createdAt", 
          updated_at as "updatedAt" 
        FROM contacts 
        WHERE id IN (${idsList})
        ORDER BY first_name, last_name`
      );
      
      console.log(`Retrieved ${result.rows.length} contacts for company ${companyId}`);
      return result.rows as Contact[];
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
    console.log(`getContact: Processing request for contact id ${id}`);
    
    // Utilizzando direttamente il pool invece di Drizzle ORM
    try {
      // Query SQL per ottenere i dati del contatto
      const contactQuery = {
        text: `SELECT 
          id, first_name, middle_name, last_name, status, 
          mobile_phone, company_email, private_email, 
          office_phone, private_phone, linkedin, facebook,
          instagram, tiktok, tags, roles, notes, custom_fields,
          last_contacted_at, next_follow_up_at, created_at, updated_at
        FROM contacts 
        WHERE id = $1`,
        values: [id]
      };
      
      console.log(`getContact: Executing contact query: ${contactQuery.text}`);
      const contactResult = await pool.query(contactQuery);
      
      // Verifico se abbiamo trovato il contatto
      if (contactResult.rows.length === 0) {
        console.log(`getContact: No contact found with id ${id}`);
        return undefined;
      }
      
      const contactData = contactResult.rows[0];
      console.log(`getContact: Found contact:`, contactData);
      
      // Query per ottenere le aree di attività del contatto
      const areasQuery = {
        text: `SELECT id, contact_id, company_id, company_name, role, job_description, is_primary, created_at, updated_at
               FROM areas_of_activity 
               WHERE contact_id = $1`,
        values: [id]
      };
      
      console.log(`getContact: Executing areas query: ${areasQuery.text}`);
      const areasResult = await pool.query(areasQuery);
      
      // Mappatura degli oggetti dalle righe di risultato
      const areas = areasResult.rows.map(row => ({
        id: row.id,
        contactId: row.contact_id,
        companyId: row.company_id,
        companyName: row.company_name,
        role: row.role,
        jobDescription: row.job_description,
        isPrimary: row.is_primary,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      // Creo il contatto con i campi mappati correttamente
      const contact: Contact = {
        id: contactData.id,
        firstName: contactData.first_name,
        middleName: contactData.middle_name,
        lastName: contactData.last_name,
        status: contactData.status,
        mobilePhone: contactData.mobile_phone,
        companyEmail: contactData.company_email,
        privateEmail: contactData.private_email,
        officePhone: contactData.office_phone,
        privatePhone: contactData.private_phone,
        linkedin: contactData.linkedin,
        facebook: contactData.facebook,
        instagram: contactData.instagram,
        tiktok: contactData.tiktok,
        tags: contactData.tags,
        roles: contactData.roles,
        notes: contactData.notes,
        customFields: contactData.custom_fields,
        lastContactedAt: contactData.last_contacted_at,
        nextFollowUpAt: contactData.next_follow_up_at,
        createdAt: contactData.created_at,
        updatedAt: contactData.updated_at,
        
        // Campi di compatibilità
        email: contactData.company_email || contactData.private_email || null,
        phone: contactData.mobile_phone || contactData.office_phone || contactData.private_phone || null,
        
        // Relazioni
        areasOfActivity: areas
      };
      
      return contact;
    } catch (error) {
      console.error("Error fetching contact:", error);
      return undefined;
    }
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
    // Rimosso filtro per status per ottenere tutte le aziende, come per contatti e leads
    console.log("PostgresStorage.getCompanies: retrieving all companies regardless of status");
    try {
      // Utilizziamo SQL nativo per avere più controllo
      const result = await pool.query(`
        SELECT 
          id, 
          name, 
          industry, 
          website, 
          email, 
          phone, 
          address, 
          tags, 
          notes, 
          custom_fields, 
          created_at, 
          updated_at, 
          status,
          is_active_rep,
          company_type,
          brands,
          channels,
          products_or_services_tags,
          location_types,
          last_contacted_at,
          next_follow_up_at
        FROM companies 
        ORDER BY name
      `);
      
      console.log(`getCompanies: Found ${result.rows.length} companies`);
      
      // Adattiamo il formato per essere compatibile con quello che si aspetta il frontend
      return result.rows.map(company => {
        return {
          id: company.id,
          name: company.name || "",
          industry: company.industry || "",
          website: company.website || "",
          email: company.email || "",
          phone: company.phone || "",
          address: company.address || "",
          tags: company.tags || [],
          notes: company.notes || "",
          customFields: company.custom_fields || {},
          status: company.status || "active",
          isActiveRep: company.is_active_rep || false,
          companyType: company.company_type || "other",
          brands: company.brands || [],
          channels: company.channels || [],
          productsOrServicesTags: company.products_or_services_tags || [],
          locationTypes: company.location_types || [],
          lastContactedAt: company.last_contacted_at,
          nextFollowUpAt: company.next_follow_up_at,
          createdAt: company.created_at,
          updatedAt: company.updated_at
        };
      });
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
    // Selezioniamo solo campi specifici che esistono sicuramente nel database
    const [company] = await db.select({
      id: companies.id,
      name: companies.name,
      status: companies.status,
      email: companies.email,
      phone: companies.phone,
      address: companies.address,
      website: companies.website,
      industry: companies.industry,
      // Rimuoviamo le colonne problematiche (description, logo)
      tags: companies.tags,
      notes: companies.notes,
      customFields: companies.customFields,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt
    })
    .from(companies)
    .where(eq(companies.id, id));
    
    if (!company) {
      return undefined;
    }
    
    // Then fetch areas of activity separately
    const areas = await db.select().from(areasOfActivity).where(eq(areasOfActivity.companyId, id));
    
    // Return the company with areas attached
    return {
      ...company,
      // Add empty values for fields that might be expected by the frontend
      city: null,
      region: null,
      country: null,
      postalCode: null,
      description: null, // Aggiungiamo anche questo campo per evitare errori nel frontend
      logo: null, // Aggiungiamo anche il logo come null
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
    try {
      console.log(`PostgresStorage.getDealsCount: retrieving deals count with options:`, options);
      
      let queryStr = `SELECT COUNT(*) as count FROM deals`;
      const params: any[] = [];
      
      if (options?.status) {
        params.push(options.status);
        queryStr += ` WHERE status = $1`;
      }
      
      const result = await pool.query(queryStr, params);
      console.log(`Retrieved ${result.rows[0].count} deals count`);
      
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error("Error in getDealsCount:", error);
      return 0;
    }
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
        // Get contact using SQL native query with correct column names
        let contactData = null;
        if (deal.contactId) {
          const contactResult = await pool.query(
            `SELECT 
              id, 
              first_name as "firstName", 
              last_name as "lastName", 
              status, 
              company_email as "companyEmail", 
              private_email as "privateEmail", 
              mobile_phone as "mobilePhone", 
              office_phone as "officePhone",
              private_phone as "privatePhone",
              created_at as "createdAt", 
              updated_at as "updatedAt" 
            FROM contacts 
            WHERE id = $1`,
            [deal.contactId]
          );
          if (contactResult.rows.length > 0) {
            contactData = contactResult.rows[0];
          }
        }
      
      // Get company using SQL native query with correct column names
      let companyData = null;
      if (deal.companyId) {
        const companyResult = await pool.query(
          `SELECT 
            id, 
            name, 
            website, 
            industry, 
            status,
            created_at as "createdAt", 
            updated_at as "updatedAt" 
          FROM companies 
          WHERE id = $1`,
          [deal.companyId]
        );
        if (companyResult.rows.length > 0) {
          companyData = companyResult.rows[0];
        }
      }
      
      // Get stage using SQL native query with correct column names
      let stageData = null;
      if (deal.stageId) {
        const stageResult = await pool.query(
          `SELECT 
            id, 
            name, 
            "order"
          FROM pipeline_stages 
          WHERE id = $1`,
          [deal.stageId]
        );
        if (stageResult.rows.length > 0) {
          stageData = stageResult.rows[0];
        }
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
      console.log("PostgresStorage.getDealsWithFilters: retrieving deals with filters:", filters);
      
      // Build query with appropriate filters - usando pool.query per maggiore stabilità
      let queryStr = `
        SELECT 
          id, 
          name, 
          value, 
          status, 
          contact_id as "contactId", 
          company_id as "companyId", 
          stage_id as "stageId", 
          created_at as "createdAt", 
          updated_at as "updatedAt" 
        FROM deals
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      // Apply filters
      if (filters.status) {
        params.push(filters.status);
        queryStr += ` AND status = $${params.length}`;
      }
      
      if (filters.companyId) {
        params.push(filters.companyId);
        queryStr += ` AND company_id = $${params.length}`;
      }
      
      if (filters.contactId) {
        params.push(filters.contactId);
        queryStr += ` AND contact_id = $${params.length}`;
      }
      
      if (filters.stageId) {
        params.push(filters.stageId);
        queryStr += ` AND stage_id = $${params.length}`;
      }
      
      // Order by stage_id and value
      queryStr += ` ORDER BY stage_id ASC, value DESC`;
      
      const queryResult = await pool.query(queryStr, params);
      const dealsResult = queryResult.rows || [];
      
      console.log(`Retrieved ${dealsResult.length} deals from database`);
      
      // Manually populate relations
      const result = [];
      for (const deal of dealsResult) {
        // Get contact
        let contactData = null;
        if (deal.contactId) {
          try {
            const contactResult = await pool.query(
              `SELECT 
                id, 
                first_name as "firstName", 
                last_name as "lastName", 
                company_email as "email"
              FROM contacts 
              WHERE id = $1`, 
              [deal.contactId]
            );
            
            if (contactResult.rows && contactResult.rows.length > 0) {
              contactData = contactResult.rows[0];
            }
          } catch (contactError) {
            console.error('Error getting contact data:', contactError);
          }
        }
        
        // Get company
        let companyData = null;
        if (deal.companyId) {
          try {
            const companyResult = await pool.query(
              `SELECT 
                id, 
                name, 
                email
              FROM companies 
              WHERE id = $1`, 
              [deal.companyId]
            );
            
            if (companyResult.rows && companyResult.rows.length > 0) {
              companyData = companyResult.rows[0];
            }
          } catch (companyError) {
            console.error('Error getting company data:', companyError);
          }
        }
        
        // Get pipeline stage
        let stageData = null;
        if (deal.stageId) {
          try {
            const stageResult = await pool.query(
              `SELECT 
                id, 
                name, 
                "order" as position
              FROM pipeline_stages 
              WHERE id = $1`, 
              [deal.stageId]
            );
            
            if (stageResult.rows && stageResult.rows.length > 0) {
              stageData = stageResult.rows[0];
            }
          } catch (stageError) {
            console.error('Error getting stage data:', stageError);
          }
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
      // 🚨 FIX: evita riferimento a colonna inesistente "city"
      // -- vecchia selezione:
      // const [company] = await db.select().from(companies).where(eq(companies.id, deal.companyId));
      const [company] = await db
        .select({
          id: companies.id,
          name: companies.name,
          status: companies.status,
          email: companies.email,
          phone: companies.phone,
          address: companies.address,
          website: companies.website,
          tags: companies.tags,
          notes: companies.notes,
          customFields: companies.customFields,
          lastContactedAt: companies.lastContactedAt,
          nextFollowUpAt: companies.nextFollowUpAt,
          isActiveRep: companies.isActiveRep,
          companyType: companies.companyType,
          brands: companies.brands,
          channels: companies.channels,
          productsOrServicesTags: companies.productsOrServicesTags,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt
        })
        .from(companies)
        .where(eq(companies.id, deal.companyId));
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
    try {
      // Implementazione temporanea che restituisce un array vuoto
      // ma potrebbe essere aggiornata in futuro quando il modulo email sarà implementato
      return [];
    } catch (error) {
      console.error("Error in getEmails:", error);
      return [];
    }
  }

  async getEmail(id: number): Promise<Email | undefined> {
    try {
      // Implementazione temporanea che restituisce null
      // ma potrebbe essere aggiornata in futuro quando il modulo email sarà implementato
      return undefined;
    } catch (error) {
      console.error("Error in getEmail:", error);
      return undefined;
    }
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    try {
      // Implementazione temporanea che restituisce un oggetto vuoto
      // ma potrebbe essere aggiornata in futuro quando il modulo email sarà implementato
      return { id: 1 } as Email;
    } catch (error) {
      console.error("Error in createEmail:", error);
      throw new Error("Failed to create email");
    }
  }

  async updateEmail(id: number, emailData: Partial<InsertEmail>): Promise<Email | undefined> {
    try {
      // Implementazione temporanea che restituisce un oggetto vuoto
      // ma potrebbe essere aggiornata in futuro quando il modulo email sarà implementato
      return { id } as Email;
    } catch (error) {
      console.error("Error in updateEmail:", error);
      return undefined;
    }
  }

  async markEmailAsRead(id: number): Promise<Email | undefined> {
    try {
      // Implementazione temporanea che restituisce un oggetto vuoto
      // ma potrebbe essere aggiornata in futuro quando il modulo email sarà implementato
      return { id, read: true } as Email;
    } catch (error) {
      console.error("Error in markEmailAsRead:", error);
      return undefined;
    }
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