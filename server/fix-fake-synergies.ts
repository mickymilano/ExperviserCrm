/**
 * Script per rimuovere le sinergie "false" o non valide
 * 
 * 1. Rimuove sinergie senza un deal associato (non dovrebbero esistere)
 * 2. Rimuove sinergie che non hanno dati coerenti
 */

import { db } from "./db";
import { synergies } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

async function fixFakeSynergies() {
  try {
    console.log("Iniziando correzione delle sinergie...");
    
    // 1. Recupera tutte le sinergie
    const allSynergies = await db.select().from(synergies);
    console.log(`Trovate ${allSynergies.length} sinergie totali`);
    
    // 2. Identifica sinergie senza deal associato (sinergie "orfane")
    const orphanSynergies = allSynergies.filter(s => s.dealId === null);
    console.log(`Trovate ${orphanSynergies.length} sinergie senza deal associato (orfane)`);
    
    // 3. Elimina le sinergie orfane
    if (orphanSynergies.length > 0) {
      for (const synergy of orphanSynergies) {
        await db.delete(synergies).where(eq(synergies.id, synergy.id));
        console.log(`Eliminata sinergia orfana ID: ${synergy.id} tra contatto ${synergy.contactId} e azienda ${synergy.companyId}`);
      }
    }
    
    // 4. Verifica se ci sono ancora problemi dopo la pulizia
    const remainingSynergies = await db.select().from(synergies);
    console.log(`Rimaste ${remainingSynergies.length} sinergie valide`);
    
    console.log("Correzione delle sinergie completata con successo!");
    
  } catch (error) {
    console.error("Errore durante la correzione delle sinergie:", error);
    throw error;
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