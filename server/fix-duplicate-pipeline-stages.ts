/**
 * Script per rimuovere gli stage duplicati della pipeline
 * Questo script trova e rimuove gli stage della pipeline con lo stesso nome
 * mantenendo solo quello con l'ID più basso (originale)
 */

import { db } from "./db-simple";
import { pipelineStages, deals } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function fixDuplicatePipelineStages() {
  console.log("Avvio pulizia degli stage duplicati della pipeline...");
  
  try {
    // 1. Ottieni tutti gli stage esistenti
    const allStages = await db.select().from(pipelineStages);
    console.log(`Trovati ${allStages.length} stage della pipeline nel database`);
    
    // 2. Identifica i duplicati (stesso nome)
    const stagesByName: Record<string, typeof pipelineStages.$inferSelect[]> = {};
    
    allStages.forEach(stage => {
      const name = stage.name.toLowerCase().trim();
      if (!stagesByName[name]) {
        stagesByName[name] = [];
      }
      stagesByName[name].push(stage);
    });
    
    // 3. Crea un elenco di stage da mantenere e da eliminare
    const stagesToDelete: number[] = [];
    const stageIdMapping: Record<number, number> = {}; // oldId -> newId for updating deals
    
    for (const name in stagesByName) {
      if (stagesByName[name].length > 1) {
        // Ordina gli stage per ID (mantieni quello con ID più basso)
        const sortedStages = stagesByName[name].sort((a, b) => a.id - b.id);
        const stageToKeep = sortedStages[0];
        
        console.log(`Stage duplicato trovato: "${name}" (${sortedStages.length} occorrenze)`);
        console.log(`Mantenimento dello stage con ID ${stageToKeep.id}`);
        
        // Marca gli altri stage come da eliminare
        for (let i = 1; i < sortedStages.length; i++) {
          stagesToDelete.push(sortedStages[i].id);
          stageIdMapping[sortedStages[i].id] = stageToKeep.id;
          console.log(`Stage con ID ${sortedStages[i].id} sarà eliminato e mappato a ${stageToKeep.id}`);
        }
      }
    }
    
    if (stagesToDelete.length === 0) {
      console.log("Nessuno stage duplicato trovato da eliminare");
      return;
    }
    
    // 4. Aggiorna i deal che usano gli stage da eliminare
    for (const oldStageId in stageIdMapping) {
      const newStageId = stageIdMapping[oldStageId];
      
      // Trova i deal che usano lo stage vecchio
      const dealsToUpdate = await db
        .select()
        .from(deals)
        .where(eq(deals.stageId, Number(oldStageId)));
      
      if (dealsToUpdate.length > 0) {
        console.log(`Aggiornamento di ${dealsToUpdate.length} deal dallo stage ${oldStageId} allo stage ${newStageId}`);
        
        // Aggiorna i deal
        await db
          .update(deals)
          .set({ stageId: newStageId })
          .where(eq(deals.stageId, Number(oldStageId)));
      }
    }
    
    // 5. Elimina gli stage duplicati
    console.log(`Eliminazione di ${stagesToDelete.length} stage duplicati...`);
    
    for (const stageId of stagesToDelete) {
      await db
        .delete(pipelineStages)
        .where(eq(pipelineStages.id, stageId));
    }
    
    console.log("Pulizia degli stage duplicati completata con successo");
    
    // 6. Riordina gli stage rimasti
    const remainingStages = await db
      .select()
      .from(pipelineStages)
      .orderBy(pipelineStages.order, pipelineStages.name);
    
    console.log(`Riordinamento di ${remainingStages.length} stage rimasti...`);
    
    for (let i = 0; i < remainingStages.length; i++) {
      await db
        .update(pipelineStages)
        .set({ order: i + 1 })
        .where(eq(pipelineStages.id, remainingStages[i].id));
    }
    
    console.log("Riordinamento degli stage completato");
    
    // Output finale
    const finalStages = await db
      .select()
      .from(pipelineStages)
      .orderBy(pipelineStages.order);
    
    console.log("Stage della pipeline dopo la pulizia:");
    finalStages.forEach(stage => {
      console.log(`ID: ${stage.id}, Ordine: ${stage.order}, Nome: ${stage.name}`);
    });
    
  } catch (error) {
    console.error("Errore durante la rimozione degli stage duplicati:", error);
  }
}

// Esporta la funzione per poterla utilizzare altrove
export { fixDuplicatePipelineStages };