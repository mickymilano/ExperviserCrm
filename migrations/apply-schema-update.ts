import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as path from "path";

// Configurazione del client PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configurazione di Drizzle con il client
const db = drizzle(pool);

async function applyMigration() {
  console.log("Avvio della migrazione dello schema...");
  
  try {
    // Esegui la migrazione dal file di schema
    await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
    console.log("Migrazione completata con successo!");
  } catch (error) {
    console.error("Errore durante la migrazione:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();