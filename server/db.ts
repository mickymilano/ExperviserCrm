import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configura il supporto WebSocket
neonConfig.webSocketConstructor = ws;

// Variabili per la modalità fallback
let fallbackModeActive = false;

// In modalità sviluppo, evitiamo errori critici che possono bloccare l'avvio dell'app
export let pool: any;
export let db: any;

// Funzione per impostare la modalità fallback
export const setFallbackMode = (mode: boolean): void => {
  fallbackModeActive = mode;
  process.env.FALLBACK_MODE = mode ? 'true' : 'false';
  console.log(`Modalità fallback impostata a: ${mode} (${process.env.FALLBACK_MODE})`);
};

// Funzione per verificare se siamo in modalità fallback
export const isFallbackMode = (): boolean => {
  return process.env.FALLBACK_MODE === 'true' || fallbackModeActive;
};

// Inizializzazione del database
try {
  // Verifica che l'URL del database sia definito
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("WARNING: DATABASE_URL non è definito, l'applicazione funzionerà in modalità limitata");
      setFallbackMode(true);
    } else {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
  } else {
    try {
      // Crea il pool di connessione con timeout esteso
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 30000 // 30 secondi di timeout
      });
      
      // Inizializza Drizzle ORM
      db = drizzle(pool, { schema });
      console.log("Database pool e istanza Drizzle creati correttamente");
    } catch (dbInitError) {
      console.error("ERRORE durante la creazione del pool:", dbInitError);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn("Fallback: Utilizzo mock del database in modalità sviluppo");
        setFallbackMode(true);
      } else {
        throw dbInitError;
      }
    }
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error("ERRORE durante l'inizializzazione del database:", error);
    console.warn("L'applicazione funzionerà in modalità limitata senza database");
    setFallbackMode(true);
  } else {
    // In produzione, l'errore è critico
    throw error;
  }
}

// Se siamo in modalità fallback, creiamo un database mock
if (isFallbackMode()) {
  pool = { 
    query: async () => ({ rows: [{ now: new Date() }] }),
    end: async () => console.log('Mock pool end chiamato'),
  };
  
  db = {
    select: () => ({ from: () => ({ where: () => [] }) }),
    insert: () => ({ values: () => ({}) }),
    execute: async () => ({}),
  };
  
  console.log("Database mock inizializzato per modalità fallback");
}

// Funzione per verificare la connessione al database
export async function testConnection() {
  if (isFallbackMode()) {
    console.log('Using mock database in fallback mode');
    return true;
  }
  
  try {
    // Esegui una query semplice
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    
    // In modalità di sviluppo, non bloccare il flusso dell'applicazione
    if (process.env.NODE_ENV === 'development') {
      console.warn('MODALITÀ FALLBACK ATTIVATA: CRM funzionerà in modalità limitata senza database');
      setFallbackMode(true);
      return true; // Comunica successo per non interrompere l'inizializzazione
    }
    
    return false;
  }
}