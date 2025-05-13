/**
 * Script per inizializzare i pipeline stages
 */

import { db } from './db';
import { pipelineStages } from '../shared/schema';

async function initializeStages() {
  try {
    console.log('Verifica degli stage della pipeline...');
    
    // Verifica se esistono già gli stage
    const existingStages = await db.select().from(pipelineStages);
    if (existingStages.length > 0) {
      console.log(`Trovati ${existingStages.length} stage già esistenti.`);
      return existingStages;
    }
    
    // Stage della pipeline
    console.log('Creazione stage della pipeline...');
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
    
    // Inserimento degli stage
    for (const stage of stages) {
      await db.insert(pipelineStages).values(stage);
    }
    
    // Recupero stage creati
    const createdStages = await db.select().from(pipelineStages);
    console.log(`Creati ${createdStages.length} stage della pipeline.`);
    return createdStages;
  } catch (error) {
    console.error('Errore durante l\'inizializzazione degli stage:', error);
    throw error;
  }
}

// Esegue lo script
initializeStages()
  .then(() => {
    console.log('Script completato con successo.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore durante l\'esecuzione dello script:', error);
    process.exit(1);
  });