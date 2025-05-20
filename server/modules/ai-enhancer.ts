import OpenAI from "openai";

// Inizializza il client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analizza ed arricchisce i dati di un contatto utilizzando OpenAI
 * @param contact Dati del contatto da analizzare
 * @returns Contatto arricchito con suggerimenti
 */
export async function enhanceContact(contact: any) {
  try {
    // Costruisci un prompt descrittivo per l'AI
    const prompt = `
    Analizza questi dati di contatto e fornisci suggerimenti per categorizzazione, tag pertinenti, e potenziali opportunità basandoti sulle informazioni disponibili. 
    Rispondi con un oggetto JSON con i campi 'category', 'tags', e 'notes'.
    
    Dati del contatto:
    Nome: ${contact.firstName} ${contact.lastName}
    Email: ${contact.email !== null ? contact.email : 'N/A'}
    Telefono: ${contact.phone !== null ? contact.phone : 'N/A'}
    Ruolo: ${contact.role !== null ? contact.role : 'N/A'}
    Azienda: ${contact.company !== null ? contact.company : 'N/A'}
    Note: ${contact.notes !== null ? contact.notes : 'N/A'}
    `;

    // Il modello gpt-4o è la versione più recente dell'API OpenAI
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Sei un assistente CRM esperto che analizza contatti per suggerire categorizzazioni, tag e note." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    // Estrai e restituisci la risposta come JSON
    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      ...contact,
      category: analysis.category,
      tags: [...(contact.tags || []), ...(analysis.tags || [])],
      suggestedNotes: analysis.notes
    };
  } catch (error) {
    console.error("Errore durante l'arricchimento del contatto:", error);
    // In caso di errore, restituisci il contatto originale
    return contact;
  }
}

/**
 * Analizza ed arricchisce i dati di un'azienda utilizzando OpenAI
 * @param company Dati dell'azienda da analizzare
 * @returns Azienda arricchita con suggerimenti
 */
export async function enhanceCompany(company: any) {
  try {
    const prompt = `
    Analizza questi dati aziendali e fornisci suggerimenti per categorizzazione del settore, tag pertinenti, e potenziali aree di opportunità.
    Rispondi con un oggetto JSON con i campi 'industry', 'tags', e 'opportunities'.
    
    Dati aziendali:
    Nome: ${company.name}
    Email: ${company.email !== null ? company.email : 'N/A'}
    Telefono: ${company.phone !== null ? company.phone : 'N/A'}
    Sito web: ${company.website !== null ? company.website : 'N/A'}
    Settore attuale: ${company.industry !== null ? company.industry : 'Non specificato'}
    Descrizione: ${company.description !== null ? company.description : 'N/A'}
    `;

    // Il modello gpt-4o è la versione più recente dell'API OpenAI
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Sei un analista di business esperto che analizza aziende per suggerire categorizzazioni e opportunità." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    // Estrai e restituisci la risposta come JSON
    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      ...company,
      industry: analysis.industry || company.industry,
      tags: [...(company.tags || []), ...(analysis.tags || [])],
      opportunities: analysis.opportunities
    };
  } catch (error) {
    console.error("Errore durante l'arricchimento dell'azienda:", error);
    return company;
  }
}

/**
 * Analizza ed arricchisce i dati di un'opportunità utilizzando OpenAI
 * @param lead Dati dell'opportunità da analizzare
 * @returns Opportunità arricchita con suggerimenti
 */
export async function enhanceLead(lead: any) {
  try {
    const prompt = `
    Analizza questi dati di opportunità commerciale e fornisci suggerimenti per priorità, prossimi passi, e una stima delle probabilità di successo.
    Rispondi con un oggetto JSON con i campi 'priority', 'nextSteps', e 'successProbability' (valore numerico da 0 a 100).
    
    Dati opportunità:
    Titolo: ${lead.title}
    Descrizione: ${lead.description !== null ? lead.description : 'N/A'}
    Stato: ${lead.status !== null ? lead.status : 'N/A'}
    Valore: ${lead.value !== null ? lead.value : 'Non specificato'}
    Fonte: ${lead.source !== null ? lead.source : 'N/A'}
    `;

    // Il modello gpt-4o è la versione più recente dell'API OpenAI
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: "Sei un analista di vendite esperto che analizza opportunità di business per suggerire strategie." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    // Estrai e restituisci la risposta come JSON
    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      ...lead,
      priority: analysis.priority,
      nextSteps: analysis.nextSteps,
      successProbability: analysis.successProbability
    };
  } catch (error) {
    console.error("Errore durante l'arricchimento dell'opportunità:", error);
    return lead;
  }
}

/**
 * Funzione di arricchimento generale che inoltra la richiesta alla funzione specifica
 * @param entity Entità da arricchire
 * @param entityType Tipo di entità (contacts, companies, leads)
 * @returns Entità arricchita
 */
export async function enhanceEntity(entity: any, entityType: string) {
  switch (entityType) {
    case 'contacts':
      return enhanceContact(entity);
    case 'companies':
      return enhanceCompany(entity);
    case 'leads':
      return enhanceLead(entity);
    default:
      throw new Error(`Tipo di entità non supportato: ${entityType}`);
  }
}