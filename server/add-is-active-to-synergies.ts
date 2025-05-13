import { pool } from "./db";

async function addIsActiveToSynergies() {
  try {
    console.log("Verifico se la colonna is_active esiste già...");
    
    // Verifica se la colonna esiste già
    const checkColumnExistence = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'synergies' AND column_name = 'is_active'
    `);
    
    if (checkColumnExistence.rows.length === 0) {
      console.log("Colonna is_active non esiste, la sto aggiungendo...");
      
      // Aggiungi la colonna is_active se non esiste
      await pool.query(`
        ALTER TABLE synergies
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      console.log("Colonna is_active aggiunta con successo alla tabella synergies");
    } else {
      console.log("La colonna is_active esiste già nella tabella synergies");
    }
  } catch (error) {
    console.error("Errore durante l'aggiunta della colonna is_active:", error);
  } finally {
    process.exit(0);
  }
}

addIsActiveToSynergies();