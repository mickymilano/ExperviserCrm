/**
 * Script per rimuovere le sinergie "false" o non valide
 * 
 * 1. Rimuove sinergie senza un deal associato (non dovrebbero esistere)
 * 2. Rimuove sinergie che non hanno dati coerenti
 * 
 * Questo script è in formato .js con sintassi ES modules per compatibilità.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql, eq, isNull } from 'drizzle-orm';
import ws from 'ws';

// Setup Neon WebSocket configuration
neonConfig.webSocketConstructor = ws; // Configure WebSocket for Neon

// Need to define the synergies table structure before using it
const synergies = {
  id: { name: 'id' },
  dealId: { name: 'deal_id' },
  contactId: { name: 'contact_id' },
  companyId: { name: 'company_id' }
};

async function fixFakeSynergies() {
  // Setup database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    console.log("Iniziando correzione delle sinergie...");
    
    // 1. Conta tutte le sinergie
    const totalCount = await db.execute(sql`SELECT COUNT(*) as count FROM synergies`);
    console.log(`Trovate ${totalCount[0]?.count || 0} sinergie totali`);
    
    // 2. Conta sinergie senza deal associato (sinergie "orfane")
    const orphanCount = await db.execute(sql`SELECT COUNT(*) as count FROM synergies WHERE deal_id IS NULL`);
    console.log(`Trovate ${orphanCount[0]?.count || 0} sinergie senza deal associato (orfane)`);
    
    // 3. Elimina le sinergie orfane
    if (orphanCount[0]?.count > 0) {
      // Recupera le sinergie orfane prima di eliminarle per mostrarle nei log
      const orphanSynergies = await db.execute(sql`SELECT * FROM synergies WHERE deal_id IS NULL`);
      
      // Log delle sinergie che saranno eliminate
      for (const synergy of orphanSynergies) {
        console.log(`Sarà eliminata sinergia orfana ID: ${synergy.id} tra contatto ${synergy.contact_id} e azienda ${synergy.company_id}`);
      }
      
      // Eliminazione in bulk di tutte le sinergie orfane
      await db.execute(sql`DELETE FROM synergies WHERE deal_id IS NULL`);
      console.log(`Eliminate ${orphanCount[0]?.count || 0} sinergie orfane`);
    }
    
    // 4. Verifica se ci sono ancora problemi dopo la pulizia
    const remainingCount = await db.execute(sql`SELECT COUNT(*) as count FROM synergies`);
    console.log(`Rimaste ${remainingCount[0]?.count || 0} sinergie valide`);
    
    console.log("Correzione delle sinergie completata con successo!");
    
  } catch (error) {
    console.error("Errore durante la correzione delle sinergie:", error);
    throw error;
  } finally {
    // 5. Chiudi il pool di connessione
    await pool.end();
  }
}

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