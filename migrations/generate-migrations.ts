import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Configurazione del client PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configurazione di Drizzle con il client
const db = drizzle(pool, { schema });

async function generateMigrations() {
  console.log("Generating migrations...");
  
  try {
    // Esegue il push diretto dello schema al database
    await db.execute(/* sql */`
      -- Drop synergies if exists
      DROP TABLE IF EXISTS synergies CASCADE;
      
      -- Drop old tables that might have relationships
      DROP TABLE IF EXISTS contact_emails CASCADE;
      
      -- Drop other tables if necessary
    `);
    
    console.log("Migrazione generata con successo!");
  } catch (error) {
    console.error("Errore durante la generazione della migrazione:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

generateMigrations();