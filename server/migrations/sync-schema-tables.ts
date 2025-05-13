/**
 * Script per sincronizzare lo schema delle tabelle
 * Questo script adatta lo schema del database alle definizioni nel codice
 */
import { db } from '../db';

async function syncSchemaTables() {
  console.log("Avvio sincronizzazione schema tabelle...");
  
  try {
    // Sincronizzazione tabella pipeline_stages
    console.log("Sincronizzazione tabella pipeline_stages...");
    
    // Verifica se esiste già la tabella
    const pipelineStagesExist = await checkTableExists('pipeline_stages');
    if (pipelineStagesExist) {
      console.log("La tabella pipeline_stages esiste già, verifica della struttura...");
      
      // Verifica se ci sono dati esistenti
      const stagesCount = await getTableCount('pipeline_stages');
      console.log(`La tabella pipeline_stages contiene ${stagesCount} record.`);
      
      // Se la tabella è vuota, aggiungiamo gli stage predefiniti
      if (stagesCount === 0) {
        console.log("Aggiunta stage predefiniti...");
        await addDefaultPipelineStages();
      }
    } else {
      console.log("La tabella pipeline_stages non esiste, verrà creata...");
      await createPipelineStagesTable();
    }
    
    console.log("Sincronizzazione dello schema completata con successo!");
    return true;
  } catch (error) {
    console.error("Errore durante la sincronizzazione dello schema:", error);
    return false;
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = '${tableName}'
    );
  `;
  
  const result = await db.execute(query);
  return result.rows[0]?.exists || false;
}

async function getTableCount(tableName: string): Promise<number> {
  const query = `SELECT COUNT(*) as count FROM ${tableName};`;
  const result = await db.execute(query);
  return parseInt(result.rows[0]?.count || '0');
}

async function createPipelineStagesTable() {
  const query = `
    CREATE TABLE pipeline_stages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      order INTEGER NOT NULL
    );
  `;
  
  await db.execute(query);
  console.log("Tabella pipeline_stages creata con successo!");
  await addDefaultPipelineStages();
}

async function addDefaultPipelineStages() {
  const stages = [
    { name: "Lead", order: 1 },
    { name: "Qualifica", order: 2 },
    { name: "Contatto", order: 3 },
    { name: "Analisi", order: 4 },
    { name: "Proposta", order: 5 },
    { name: "Negoziazione", order: 6 },
    { name: "Chiuso vinto", order: 7 },
    { name: "Chiuso perso", order: 8 }
  ];
  
  for (const stage of stages) {
    await db.execute(
      'INSERT INTO pipeline_stages (name, order) VALUES ($1, $2)',
      [stage.name, stage.order]
    );
  }
  
  console.log(`Aggiunti ${stages.length} stage predefiniti.`);
}

// Esecuzione dello script
syncSchemaTables()
  .then(success => {
    if (success) {
      console.log("Sincronizzazione delle tabelle completata con successo.");
      process.exit(0);
    } else {
      console.error("Errore durante la sincronizzazione delle tabelle.");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Errore durante l'esecuzione dello script:", error);
    process.exit(1);
  });