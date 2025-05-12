import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

// Configura il websocket constructor per la connessione Neon
neonConfig.webSocketConstructor = ws;

// Ottieni il percorso del file corrente per moduli ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione del client PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeSchemaUpdate() {
  console.log("Esecuzione dell'aggiornamento dello schema...");
  
  try {
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, "update-schema.sql");
    console.log(`Lettura del file SQL da: ${sqlPath}`);
    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    
    // Esegui lo script SQL
    console.log("Connessione al database...");
    const client = await pool.connect();
    try {
      console.log("Esecuzione delle query SQL...");
      await client.query(sqlContent);
      console.log("Schema aggiornato con successo!");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello schema:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeSchemaUpdate();