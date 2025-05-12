/**
 * Script per eliminare completamente tutte le sinergie dal database
 * 
 * Questo script:
 * 1. Rimuove tutti i dati dalla tabella synergies
 * 2. Resetta l'auto-increment
 */
import { db, pool } from "./db";
import { synergies } from "@shared/schema";

async function purgeSynergies() {
  console.log("Iniziando la pulizia completa delle sinergie...");
  
  try {
    // 1. Elimina tutti i record dalla tabella synergies
    const deleteResult = await db.delete(synergies);
    
    // 2. Reset dell'auto-increment (specifico per PostgreSQL)
    await pool.query(`TRUNCATE TABLE synergies RESTART IDENTITY CASCADE;`);
    
    console.log("Pulizia completata! Tutte le sinergie sono state eliminate.");
    console.log("La tabella è stata resettata e l'auto-increment è stato azzerato.");
    
  } catch (error) {
    console.error("Errore durante la pulizia delle sinergie:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Esegui lo script
purgeSynergies();