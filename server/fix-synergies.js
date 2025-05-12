/**
 * Script per rimuovere le sinergie "false" o non valide
 * 
 * 1. Rimuove sinergie senza un deal associato (non dovrebbero esistere)
 * 2. Rimuove sinergie che non hanno dati coerenti
 * 
 * Questo script è in formato .js con sintassi ES modules per compatibilità.
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Setup Neon WebSocket configuration
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws; // Configure WebSocket for Neon

// Setup database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function fixFakeSynergies() {
  try {
    console.log("Iniziando correzione delle sinergie...");
    
    // 1. Recupera tutte le sinergie
    const allSynergies = await db.execute(sql`SELECT * FROM synergies`);
    console.log(`Trovate ${allSynergies.length} sinergie totali`);
    
    // 2. Identifica sinergie senza deal associato (sinergie "orfane")
    const orphanSynergies = allSynergies.filter(s => s.deal_id === null);
    console.log(`Trovate ${orphanSynergies.length} sinergie senza deal associato (orfane)`);
    
    // 3. Elimina le sinergie orfane
    if (orphanSynergies.length > 0) {
      for (const synergy of orphanSynergies) {
        await db.execute(sql`DELETE FROM synergies WHERE id = ${synergy.id}`);
        console.log(`Eliminata sinergia orfana ID: ${synergy.id} tra contatto ${synergy.contact_id} e azienda ${synergy.company_id}`);
      }
    }
    
    // 4. Verifica se ci sono ancora problemi dopo la pulizia
    const remainingSynergies = await db.execute(sql`SELECT * FROM synergies`);
    console.log(`Rimaste ${remainingSynergies.length} sinergie valide`);
    
    // 5. Chiudi il pool di connessione
    await pool.end();
    
    console.log("Correzione delle sinergie completata con successo!");
    
  } catch (error) {
    console.error("Errore durante la correzione delle sinergie:", error);
    await pool.end();
    throw error;
  }
}

// sql tag is now imported at the top

// Esegui la correzione
fixFakeSynergies()
  .then(() => {
    console.log("Script di correzione sinergie completato!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script fallito:", error);
    process.exit(1);
  });