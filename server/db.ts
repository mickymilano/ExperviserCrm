import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configura il supporto WebSocket
neonConfig.webSocketConstructor = ws;

// In modalità sviluppo, evitiamo errori critici che possono bloccare l'avvio dell'app
export let pool;
export let db;

try {
  // Verifica che l'URL del database sia definito
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("WARNING: DATABASE_URL non è definito, l'applicazione funzionerà in modalità limitata");
    } else {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
  } else {
    // Crea il pool di connessione e l'istanza Drizzle
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("Database pool e istanza Drizzle creati correttamente");
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error("ERRORE durante l'inizializzazione del database:", error);
    console.warn("L'applicazione funzionerà in modalità limitata senza database");
    
    // In development, creiamo un mock per evitare errori
    pool = { 
      query: async () => ({ rows: [{ now: new Date() }] }),
      end: async () => console.log('Mock pool end chiamato'),
    };
    db = {
      select: () => ({ from: () => ({ where: () => [] }) }),
      insert: () => ({ values: () => ({}) }),
      execute: async () => ({}),
    };
  } else {
    // In produzione, l'errore è critico
    throw error;
  }
}

// Verifica se il sistema è in modalità fallback
let fallbackModeActive = false;

export const setFallbackMode = (mode: boolean) => {
  fallbackModeActive = mode;
  process.env.FALLBACK_MODE = mode ? 'true' : 'false';
};

export const isFallbackMode = () => {
  return process.env.FALLBACK_MODE === 'true' || fallbackModeActive;
};

// Funzione per verificare la connessione al database
export async function testConnection() {
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
      return true; // Comunica successo per non interrompere l'inizializzazione
    }
    
    return false;
  }
}