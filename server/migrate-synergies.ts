import { db } from "./db";
import { synergies } from "@shared/schema";

/**
 * Script per creare la tabella 'synergies' nel database se non esiste già
 */
async function migrateSynergiesTable() {
  try {
    console.log("Checking if 'synergies' table exists...");
    
    // Controlliamo se la tabella esiste già
    const result = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'synergies'
      );`
    );
    
    const tableExists = result.rows[0].exists;
    
    if (!tableExists) {
      console.log("'synergies' table doesn't exist. Creating it now...");
      
      // Creiamo la tabella synergies
      await db.execute(sql`
        CREATE TABLE synergies (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
          start_date TIMESTAMP NOT NULL DEFAULT NOW(),
          description TEXT,
          type TEXT DEFAULT 'business',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log("'synergies' table created successfully!");
    } else {
      console.log("'synergies' table already exists. No need to create it.");
    }
    
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

// Eseguiamo la migrazione
migrateSynergiesTable()
  .then(() => {
    console.log("Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

import { sql } from "drizzle-orm";