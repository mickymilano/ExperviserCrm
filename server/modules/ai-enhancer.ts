import OpenAI from "openai";

// Inizializza il client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interfacce per tipizzare le risposte di OpenAI
interface ContactAnalysisResult {
  category?: string;
  tags?: string[];
  notes?: string;
}

interface CompanyAnalysisResult {
  industry?: string;
  tags?: string[];
  opportunities?: string[];
}

interface LeadAnalysisResult {
  priority?: string;
  nextSteps?: string;
  successProbability?: number;
}

// Utility function per gestire i valori null nei prompt
function safeString(value: any, defaultValue: string = 'N/A'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
}

// Utility function per il parsing sicuro delle risposte OpenAI
function safeJsonParse<T>(content: string | null, defaultValue: T): T {
  if (!content) return defaultValue;
  
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("Errore nel parsing JSON:", error);
    return defaultValue;
  }
}

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
    Nome: ${safeString(contact.firstName)} ${safeString(contact.lastName)}
    Email: ${safeString(contact.email)}
    Telefono: ${safeString(contact.phone)}
    Ruolo: ${safeString(contact.role)}
    Azienda: ${safeString(contact.company)}
    Note: ${safeString(contact.notes)}
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
      max_tokens: 500
    });

    // Estrai e restituisci la risposta come JSON
    const defaultAnalysis: ContactAnalysisResult = { 
      category: "Non categorizzato", 
      tags: [], 
      notes: "" 
    };
    
    const analysis = safeJsonParse<ContactAnalysisResult>(
      response.choices[0].message.content,
      defaultAnalysis
    );
    
    return {
      ...contact,
      category: analysis.category || "Non categorizzato",
      tags: [...(contact.tags || []), ...(analysis.tags || [])],
      suggestedNotes: analysis.notes || ""
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
    Nome: ${safeString(company.name)}
    Email: ${safeString(company.email)}
    Telefono: ${safeString(company.phone)}
    Sito web: ${safeString(company.website)}
    Settore attuale: ${safeString(company.industry, 'Non specificato')}
    Descrizione: ${safeString(company.description)}
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
      max_tokens: 500
    });

    // Estrai e restituisci la risposta come JSON
    try {
      const content = response.choices[0].message.content || "{}";
      const analysis = JSON.parse(content);
      
      return {
        ...company,
        industry: analysis.industry || company.industry,
        tags: [...(company.tags || []), ...(analysis.tags || [])],
        opportunities: analysis.opportunities || []
      };
    } catch (parseError) {
      console.error("Errore nel parsing della risposta JSON:", parseError);
      return company;
    }
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
    Titolo: ${safeString(lead.title)}
    Descrizione: ${safeString(lead.description)}
    Stato: ${safeString(lead.status)}
    Valore: ${safeString(lead.value, 'Non specificato')}
    Fonte: ${safeString(lead.source)}
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
      max_tokens: 500
    });

    // Estrai e restituisci la risposta come JSON
    try {
      const content = response.choices[0].message.content || "{}";
      const analysis = JSON.parse(content);
      
      return {
        ...lead,
        priority: analysis.priority || "Media",
        nextSteps: analysis.nextSteps || "",
        successProbability: analysis.successProbability || 50
      };
    } catch (parseError) {
      console.error("Errore nel parsing della risposta JSON:", parseError);
      return lead;
    }
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