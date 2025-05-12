/**
 * Script per rimuovere le sinergie con "contatti rimossi" o non validi
 * 
 * Questo script:
 * 1. Trova tutte le sinergie nel database
 * 2. Per ciascuna sinergia verifica se il contatto e l'azienda esistono realmente
 * 3. Elimina tutte le sinergie con contatti o aziende non esistenti
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
import { eq, sql } from 'drizzle-orm';
import { synergies, contacts, companies, deals } from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function purgeFakeSynergies() {
  try {
    console.log('Avvio rimozione delle sinergie con contatti o aziende non validi...');

    // Ottieni tutte le sinergie
    const allSynergies = await db.select().from(synergies);
    console.log(`Trovate ${allSynergies.length} sinergie nel database`);

    // Array per tenere traccia degli ID delle sinergie da eliminare
    const synergiesToDelete: number[] = [];

    // Verifica ogni sinergia
    for (const synergy of allSynergies) {
      // Verifica se il contatto esiste
      const contactExists = await db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(eq(contacts.id, synergy.contactId));
        
      // Verifica se l'azienda esiste
      const companyExists = await db
        .select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(eq(companies.id, synergy.companyId));
      
      // Verifica se il deal esiste (se presente)
      let dealExists = true;
      if (synergy.dealId) {
        const dealResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(deals)
          .where(eq(deals.id, synergy.dealId as number));
        dealExists = dealResult[0].count > 0;
      }
      
      // Se contatto o azienda non esistono o il deal non esiste (se specificato),
      // aggiungi la sinergia all'elenco da eliminare
      if (contactExists[0].count === 0 || companyExists[0].count === 0 || !dealExists) {
        synergiesToDelete.push(synergy.id);
        console.log(`Sinergia ${synergy.id} con contactId=${synergy.contactId}, companyId=${synergy.companyId}, dealId=${synergy.dealId} è invalida e verrà eliminata`);
      }
    }

    console.log(`Trovate ${synergiesToDelete.length} sinergie con contatti o aziende non validi`);

    // Elimina tutte le sinergie non valide
    if (synergiesToDelete.length > 0) {
      for (const synergyId of synergiesToDelete) {
        await db.delete(synergies).where(eq(synergies.id, synergyId));
      }
      console.log(`Eliminate ${synergiesToDelete.length} sinergie con contatti o aziende non validi`);
    }

    console.log('Pulizia delle sinergie non valide completata con successo!');
  } catch (error) {
    console.error('Errore durante la pulizia delle sinergie:', error);
  } finally {
    await pool.end();
  }
}

// Esegui lo script
purgeFakeSynergies();