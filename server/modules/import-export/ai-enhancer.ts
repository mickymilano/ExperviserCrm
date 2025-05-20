import OpenAI from "openai";

// Inizializza client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Migliora i dati importati utilizzando OpenAI per categorizzazione, tagging e normalizzazione
 * @param items Lista di elementi da analizzare
 * @param enhancementType Tipo di miglioramento (tagging, categorization, enrichment)
 * @returns Dati migliorati con AI
 */
export async function enhanceWithAI(items: any[], enhancementType: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('API key OpenAI non configurata. Impossibile eseguire l\'arricchimento AI.');
    }
    
    // Limita il numero di elementi da analizzare per risparmiare token
    const maxItemsToProcess = 20;
    const limitedItems = items.slice(0, maxItemsToProcess);
    
    switch (enhancementType) {
      case 'tagging':
        return await generateTags(limitedItems);
      case 'categorization':
        return await categorizeItems(limitedItems);
      case 'enrichment':
        return await enrichData(limitedItems);
      default:
        throw new Error(`Tipo di arricchimento non supportato: ${enhancementType}`);
    }
  } catch (error) {
    console.error('Errore durante l\'arricchimento AI:', error);
    throw error;
  }
}

/**
 * Genera tag per i contatti basati sulle informazioni disponibili
 * @param items Contatti da analizzare
 * @returns Contatti con tag generati
 */
async function generateTags(items: any[]) {
  const enhancedItems = [];
  
  for (const item of items) {
    try {
      // Estrai le informazioni rilevanti
      const itemInfo = JSON.stringify({
        nome: item.firstName || '',
        cognome: item.lastName || '',
        azienda: item.company || '',
        ruolo: item.jobTitle || '',
        note: item.notes || '',
        email: item.email || '',
      });
      
      // Crea prompt per OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // il modello più recente rilasciato il 13 maggio 2024
        messages: [
          {
            role: "system",
            content: "Sei un assistente esperto di CRM che deve assegnare tag rilevanti per un contatto. Genera fino a 5 tag pertinenti in italiano che descrivano il settore, competenze, interessi o altre caratteristiche rilevanti per la gestione delle relazioni con questo contatto. Rispondi solo in formato JSON con un array di tag."
          },
          {
            role: "user",
            content: `Ecco i dati del contatto: ${itemInfo}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Estrai i tag dalla risposta di OpenAI
      const result = JSON.parse(response.choices[0].message.content);
      const tags = result.tags || [];
      
      // Aggiungi i tag all'elemento
      enhancedItems.push({
        ...item,
        tags: tags,
        ai_generated: true
      });
    } catch (error) {
      console.error(`Errore nella generazione dei tag per l'elemento ${item.id || 'sconosciuto'}:`, error);
      enhancedItems.push(item); // Mantieni l'elemento originale
    }
  }
  
  return enhancedItems;
}

/**
 * Categorizza i contatti in base alle informazioni disponibili
 * @param items Contatti da categorizzare
 * @returns Contatti con categorie assegnate
 */
async function categorizeItems(items: any[]) {
  const enhancedItems = [];
  
  for (const item of items) {
    try {
      // Estrai le informazioni rilevanti
      const itemInfo = JSON.stringify({
        nome: item.firstName || '',
        cognome: item.lastName || '',
        azienda: item.company || '',
        ruolo: item.jobTitle || '',
        note: item.notes || '',
        email: item.email || '',
      });
      
      // Crea prompt per OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // il modello più recente rilasciato il 13 maggio 2024
        messages: [
          {
            role: "system",
            content: "Sei un assistente esperto di CRM che deve categorizzare un contatto. Analizza le informazioni e assegna una categoria principale e fino a 3 sottocategorie pertinenti in italiano. Assegna anche una priorità da 1 a 5 (dove 5 è alta priorità) e uno stato suggerito (potenziale, attivo, inattivo, da ricontattare). Rispondi in formato JSON."
          },
          {
            role: "user",
            content: `Ecco i dati del contatto: ${itemInfo}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Estrai le categorie dalla risposta di OpenAI
      const result = JSON.parse(response.choices[0].message.content);
      
      // Aggiungi le categorie all'elemento
      enhancedItems.push({
        ...item,
        ai_category: result.categoria || '',
        ai_subcategories: result.sottocategorie || [],
        ai_priority: result.priorita || 3,
        ai_suggested_status: result.stato || 'potenziale',
        ai_generated: true
      });
    } catch (error) {
      console.error(`Errore nella categorizzazione dell'elemento ${item.id || 'sconosciuto'}:`, error);
      enhancedItems.push(item); // Mantieni l'elemento originale
    }
  }
  
  return enhancedItems;
}

/**
 * Arricchisce i dati esistenti con informazioni aggiuntive
 * @param items Elementi da arricchire
 * @returns Elementi con dati arricchiti
 */
async function enrichData(items: any[]) {
  const enhancedItems = [];
  
  for (const item of items) {
    try {
      // Estrai le informazioni rilevanti
      const itemInfo = JSON.stringify({
        nome: item.firstName || '',
        cognome: item.lastName || '',
        azienda: item.company || '',
        ruolo: item.jobTitle || '',
        note: item.notes || '',
        email: item.email || '',
      });
      
      // Crea prompt per OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // il modello più recente rilasciato il 13 maggio 2024
        messages: [
          {
            role: "system",
            content: "Sei un assistente esperto di CRM che deve arricchire i dati di un contatto. In base alle informazioni disponibili, suggerisci possibili interessi, punti di contatto, opportunità e una strategia di comunicazione. Rispondi in formato JSON."
          },
          {
            role: "user",
            content: `Ecco i dati del contatto: ${itemInfo}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Estrai i dati arricchiti dalla risposta di OpenAI
      const result = JSON.parse(response.choices[0].message.content);
      
      // Aggiungi i dati arricchiti all'elemento
      enhancedItems.push({
        ...item,
        ai_interests: result.interessi || [],
        ai_touchpoints: result.punti_di_contatto || [],
        ai_opportunities: result.opportunita || [],
        ai_communication_strategy: result.strategia_comunicazione || '',
        ai_generated: true
      });
    } catch (error) {
      console.error(`Errore nell'arricchimento dell'elemento ${item.id || 'sconosciuto'}:`, error);
      enhancedItems.push(item); // Mantieni l'elemento originale
    }
  }
  
  return enhancedItems;
}