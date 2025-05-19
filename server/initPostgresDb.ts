import { sql } from "drizzle-orm";
import { pool, db, testConnection } from "./db";
import * as schema from '@shared/schema';
import bcrypt from 'bcrypt';

// Funzione per verificare se le tabelle esistono già
async function tablesExist(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    return false;
  }
}

// Funzione per creare le tabelle
async function createTables() {
  console.log('Creating database tables...');
  try {
    // Crea le tabelle utilizzando gli schemi definiti
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR(50) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(100) NOT NULL,
        "backup_email" VARCHAR(100),
        "role" VARCHAR(20) NOT NULL DEFAULT 'user',
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "email_verified" BOOLEAN DEFAULT false,
        "avatar" TEXT,
        "preferences" JSON,
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "contacts" (
        "id" SERIAL PRIMARY KEY,
        "first_name" VARCHAR(50) NOT NULL,
        "last_name" VARCHAR(50) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "email" VARCHAR(100),
        "phone" VARCHAR(20),
        "mobile" VARCHAR(20),
        "address" TEXT,
        "city" VARCHAR(50),
        "region" VARCHAR(50),
        "country" VARCHAR(50),
        "postal_code" VARCHAR(20),
        "website" VARCHAR(255),
        "birthday" DATE,
        "notes" TEXT,
        "source" VARCHAR(100),
        "tags" TEXT[],
        "avatar" TEXT,
        "custom_fields" JSON,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "email" VARCHAR(100),
        "phone" VARCHAR(20),
        "address" TEXT,
        "city" VARCHAR(50),
        "region" VARCHAR(50),
        "country" VARCHAR(50),
        "postal_code" VARCHAR(20),
        "website" VARCHAR(255),
        "industry" VARCHAR(100),
        "description" TEXT,
        "employee_count" INTEGER,
        "annual_revenue" DECIMAL(15, 2),
        "founded_year" INTEGER,
        "logo" TEXT,
        "tags" TEXT[],
        "notes" TEXT,
        "custom_fields" JSON,
        "parent_company_id" INTEGER REFERENCES "companies"("id"),
        "linkedin_url" VARCHAR(255),
        "location_types" TEXT[],
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "pipeline_stages" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL,
        "description" TEXT,
        "position" INTEGER NOT NULL,
        "color" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "deals" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "contact_id" INTEGER REFERENCES "contacts"("id"),
        "company_id" INTEGER REFERENCES "companies"("id"),
        "value" DECIMAL(15, 2),
        "notes" TEXT,
        "tags" TEXT[],
        "stage_id" INTEGER REFERENCES "pipeline_stages"("id"),
        "last_contacted_at" TIMESTAMP,
        "expected_close_date" DATE,
        "actual_close_date" DATE,
        "next_follow_up_at" TIMESTAMP,
        "description" TEXT,
        "probability" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" SERIAL PRIMARY KEY,
        "first_name" VARCHAR(50) NOT NULL,
        "last_name" VARCHAR(50) NOT NULL,
        "email" VARCHAR(100),
        "role" VARCHAR(100),
        "status" VARCHAR(50),
        "phone" VARCHAR(20),
        "address" TEXT,
        "city" VARCHAR(50),
        "region" VARCHAR(50),
        "country" VARCHAR(50),
        "postal_code" VARCHAR(20),
        "company" VARCHAR(100),
        "website" VARCHAR(255),
        "source" VARCHAR(100),
        "notes" TEXT,
        "custom_fields" JSON,
        "assigned_to_id" INTEGER REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "areas_of_activity" (
        "id" SERIAL PRIMARY KEY,
        "contact_id" INTEGER NOT NULL REFERENCES "contacts"("id"),
        "company_id" INTEGER REFERENCES "companies"("id"),
        "company_name" VARCHAR(100),
        "role" VARCHAR(100),
        "job_description" TEXT,
        "is_primary" BOOLEAN,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Database tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

// Funzione per inserire l'utente admin iniziale
async function createInitialAdmin() {
  try {
    // Verifica se esiste già un amministratore
    const adminExists = await db.select().from(schema.users).where(sql`role = 'super_admin'`);
    
    if (adminExists.length === 0) {
      console.log('Creating initial super admin user...');
      
      // Crea la password criptata
      const hashedPassword = await bcrypt.hash('admin_admin_69', 10);
      
      // Inserisci l'utente super admin
      await db.insert(schema.users).values({
        username: 'michele@experviser.com',
        password: hashedPassword,
        fullName: 'Michele Experviser',
        email: 'michele@experviser.com',
        role: 'super_admin' as any,
        status: 'active' as any,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Initial super admin user created successfully');
    } else {
      console.log('Super admin user already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating initial admin:', error);
    return false;
  }
}

// Funzione per creare le fasi della pipeline iniziali
async function createInitialPipelineStages() {
  try {
    // Verifica se esistono già le fasi della pipeline
    const stagesExist = await db.select().from(schema.pipelineStages);
    
    if (stagesExist.length === 0) {
      console.log('Creating initial pipeline stages...');
      
      // Definisci le fasi della pipeline
      const stages = [
        { name: 'Primo contatto', description: 'Fase iniziale di contatto', position: 1, color: '#3498db' },
        { name: 'Qualificato', description: 'Lead qualificato', position: 2, color: '#2ecc71' },
        { name: 'Proposta', description: 'Proposta inviata', position: 3, color: '#f1c40f' },
        { name: 'Negoziazione', description: 'In fase di negoziazione', position: 4, color: '#e67e22' },
        { name: 'Vinto/Perso', description: 'Opportunità conclusa', position: 5, color: '#e74c3c' }
      ];
      
      // Inserisci le fasi della pipeline
      for (const stage of stages) {
        await db.insert(schema.pipelineStages).values(stage);
      }
      
      console.log('Initial pipeline stages created successfully');
    } else {
      console.log('Pipeline stages already exist');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating initial pipeline stages:', error);
    return false;
  }
}

// Funzione principale per inizializzare il database
export async function initializePostgresDb() {
  console.log('Initializing PostgreSQL database...');
  
  try {
    // In modalità sviluppo, gestiamo errori in modo più tollerante
    if (process.env.NODE_ENV === 'development') {
      try {
        // Verifica la connessione
        const isConnected = await testConnection();
        if (!isConnected) {
          console.warn('ATTENZIONE: Impossibile connettersi al database PostgreSQL');
          console.warn('L\'applicazione funzionerà in modalità limitata senza database');
          console.warn('Usa il token JWT generato per accedere comunque all\'interfaccia');
          return true; // In sviluppo, continuiamo anche senza database
        }
        
        // Se la connessione è riuscita, continua con l'inizializzazione
        const tables = await tablesExist();
        if (tables) {
          console.log('Database tables already exist');
        } else {
          console.log('Database tables don\'t exist yet. This is normal if this is the first run.');
          console.log('Schema will be applied during migration.');
          
          // Crea le tabelle
          await createTables();
          // Crea l'utente admin iniziale
          await createInitialAdmin();
          // Crea le fasi della pipeline iniziali
          await createInitialPipelineStages();
        }
        
        console.log('PostgreSQL database initialized successfully');
        return true;
      } catch (error) {
        // In sviluppo, registriamo l'errore ma consentiamo all'app di avviarsi
        console.error('Errore durante l\'inizializzazione del database in modalità sviluppo:', error);
        console.warn('L\'applicazione funzionerà in modalità limitata senza accesso al database');
        console.warn('Il login automatico e le funzionalità di base rimarranno disponibili');
        return true;
      }
    } else {
      // In produzione, il comportamento rimane invariato
      // Verifica la connessione
      const isConnected = await testConnection();
      if (!isConnected) {
        console.error('Failed to connect to PostgreSQL database');
        return false;
      }
      
      // Verifica se le tabelle esistono già
      const tables = await tablesExist();
      if (tables) {
        console.log('Database tables already exist');
      } else {
        console.log('Database tables don\'t exist yet. This is normal if this is the first run.');
        console.log('Schema will be applied during migration.');
        // Crea le tabelle
        await createTables();
        // Crea l'utente admin iniziale
        await createInitialAdmin();
        // Crea le fasi della pipeline iniziali
        await createInitialPipelineStages();
      }
      
      console.log('PostgreSQL database initialized successfully');
      return true;
    }
  } catch (error) {
    console.error('Errore critico durante l\'inizializzazione del database:', error);
    
    // In sviluppo, consentiamo all'app di avviarsi anche in caso di errore
    if (process.env.NODE_ENV === 'development') {
      console.warn('L\'applicazione continuerà in modalità limitata (solo frontend)');
      return true;
    }
    
    return false;
  }
}

// Funzione per chiudere le connessioni
export async function closeDbConnections() {
  console.log('Closing database connections...');
  await pool.end();
  console.log('Database connections closed');
}