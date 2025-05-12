/**
 * Script per eliminare TUTTE le sinergie dal database e ricominciare da zero
 * 
 * Questo script eliminerà tutte le sinergie esistenti, indipendentemente dalla loro validità
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
import { sql } from 'drizzle-orm';
import { synergies } from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function deleteAllSynergies() {
  try {
    console.log('Avvio eliminazione di tutte le sinergie dal database...');

    // Ottieni il conteggio delle sinergie prima dell'eliminazione
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(synergies);
    const synergiesCount = countResult[0].count;
    
    console.log(`Trovate ${synergiesCount} sinergie nel database da eliminare`);

    // Elimina tutte le sinergie
    if (synergiesCount > 0) {
      // Usa una query SQL diretta per eliminare tutto ed evitare problemi con gli ID
      await db.execute(sql`DELETE FROM synergies`);
      console.log(`Eliminate ${synergiesCount} sinergie con successo!`);
      
      // Resetta l'auto-increment per ripartire da ID = 1
      try {
        await db.execute(sql`ALTER SEQUENCE synergies_id_seq RESTART WITH 1`);
        console.log('Sequenza di ID resettata con successo');
      } catch (error) {
        console.error('Errore durante il reset della sequenza ID:', error);
      }
    } else {
      console.log('Nessuna sinergia da eliminare.');
    }

    console.log('Pulizia completa delle sinergie completata con successo!');
  } catch (error) {
    console.error('Errore durante l\'eliminazione delle sinergie:', error);
  } finally {
    await pool.end();
  }
}

// Esegui lo script
deleteAllSynergies();