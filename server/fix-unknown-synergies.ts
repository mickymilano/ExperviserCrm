/**
 * Script per rimuovere le sinergie con contatti "Unknown" o aziende "Unknown"
 * 
 * Questo script:
 * 1. Identifica sinergie con contatti o aziende inesistenti
 * 2. Elimina queste sinergie errate dal database
 */

import { pool } from "./db";
import { synergies } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";

const db = drizzle(pool, { schema: { synergies } });

async function fixUnknownSynergies() {
  console.log("Avvio rimozione delle sinergie con contatti o aziende inesistenti...");
  
  try {
    // Ottieni tutte le sinergie
    const allSynergies = await db.query.synergies.findMany();
    console.log(`Trovate ${allSynergies.length} sinergie nel database`);
    
    // Ottieni tutti i contatti e aziende
    const contacts = await pool.query('SELECT id FROM contacts');
    const companies = await pool.query('SELECT id FROM companies');
    
    // Crea set per lookup veloce
    const contactIds = new Set(contacts.rows.map(c => c.id));
    const companyIds = new Set(companies.rows.map(c => c.id));
    
    // Filtra sinergie con contatti o aziende inesistenti
    const invalidSynergies = allSynergies.filter(synergy => {
      const hasValidContact = contactIds.has(synergy.contactId);
      const hasValidCompany = companyIds.has(synergy.companyId);
      return !hasValidContact || !hasValidCompany;
    });
    
    console.log(`Trovate ${invalidSynergies.length} sinergie con contatti o aziende inesistenti`);
    
    // Elimina le sinergie invalide
    for (const synergy of invalidSynergies) {
      console.log(`Rimozione sinergia ${synergy.id} (Contatto: ${synergy.contactId}, Azienda: ${synergy.companyId})`);
      await db.delete(synergies).where(eq(synergies.id, synergy.id));
    }
    
    console.log(`Rimozione completata. Eliminate ${invalidSynergies.length} sinergie invalide.`);
  } catch (error) {
    console.error("Errore durante la rimozione delle sinergie:", error);
  }
}

// Esegui lo script
fixUnknownSynergies()
  .then(() => {
    console.log("Script completato con successo");
    process.exit(0);
  })
  .catch(error => {
    console.error("Errore durante l'esecuzione dello script:", error);
    process.exit(1);
  });

export { fixUnknownSynergies };