/**
 * Script per pulire il database mantenendo solo l'utente admin
 * Questo script elimina i dati dalle tabelle nell'ordine corretto
 * per rispettare i vincoli di chiave esterna
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { eq, ne } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

import {
  synergies, activities, tasks, deals, 
  areasOfActivity, leads, contacts, companies
} from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function cleanDatabase() {
  try {
    console.log('='.repeat(50));
    console.log('AVVIO PULIZIA DEL DATABASE');
    console.log('='.repeat(50));
    
    console.log('Eliminazione delle tabelle in ordine per rispettare i vincoli di chiave esterna...');
    
    // 1. Elimina tutte le sinergie (dipendono da deals, contacts e companies)
    const synergiesDeleted = await db.delete(synergies).returning();
    console.log(`✓ Eliminate ${synergiesDeleted.length} sinergie`);
    
    // 2. Elimina tutte le attività (dipendono da varie entità)
    const activitiesDeleted = await db.delete(activities).returning();
    console.log(`✓ Eliminate ${activitiesDeleted.length} attività`);
    
    // 3. Elimina tutti i task (dipendono da deals, contacts e companies)
    const tasksDeleted = await db.delete(tasks).returning();
    console.log(`✓ Eliminati ${tasksDeleted.length} task`);
    
    // 4. Elimina tutti i deal (dipendono da contacts e companies)
    const dealsDeleted = await db.delete(deals).returning();
    console.log(`✓ Eliminati ${dealsDeleted.length} deal`);
    
    // 5. Elimina tutte le aree di attività (dipendono da contacts e companies)
    const areasDeleted = await db.delete(areasOfActivity).returning();
    console.log(`✓ Eliminate ${areasDeleted.length} aree di attività`);
    
    // 6. Elimina tutti i lead (nessuna dipendenza)
    const leadsDeleted = await db.delete(leads).returning();
    console.log(`✓ Eliminati ${leadsDeleted.length} lead`);
    
    // 7. Elimina tutti i contatti (entità indipendente)
    const contactsDeleted = await db.delete(contacts).returning();
    console.log(`✓ Eliminati ${contactsDeleted.length} contatti`);
    
    // 8. Elimina tutte le aziende (entità indipendente)
    const companiesDeleted = await db.delete(companies).returning();
    console.log(`✓ Eliminate ${companiesDeleted.length} aziende`);
    
    console.log('='.repeat(50));
    console.log('PULIZIA DATABASE COMPLETATA CON SUCCESSO');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('ERRORE DURANTE LA PULIZIA DEL DATABASE:', error);
  } finally {
    // Chiudi la connessione al database
    await pool.end();
  }
}

// Esegui lo script
cleanDatabase();