/**
 * Modulo di integrazione con OpenAI per migliorare i dati importati
 * Arricchisce contatti, aziende e lead con dati migliorati e categorizzati
 */
import OpenAI from "openai";
import { Contact, Company, Lead } from "../../../shared/schema";

// Assicurati che l'API key di OpenAI sia disponibile
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interfacce per le opzioni di miglioramento
export interface AIEnhancementOptions {
  confidence_threshold?: number; // Soglia di confidenza (0-1)
  enrich_missing_fields?: boolean; // Arricchisci campi mancanti
  auto_categorize?: boolean; // Categorizza automaticamente
  auto_tag?: boolean; // Genera tag automaticamente
  language?: string; // Lingua per l'elaborazione
  max_tokens?: number; // Numero massimo di token per la risposta
  verbose?: boolean; // Log verbosi
}

// Tipo per i risultati del miglioramento
export interface AIEnhancementResult<T> {
  enhanced_entity: T;
  original_entity: T;
  confidence_score: number;
  fields_enhanced: string[];
  suggested_tags?: string[];
  suggested_category?: string;
  suggested_notes?: string;
}

/**
 * Migliora e arricchisce un contatto usando OpenAI
 * @param contact Il contatto da migliorare
 * @param options Opzioni di miglioramento
 * @returns Risultato del miglioramento con confidenza
 */
export async function enhanceContact(
  contact: Partial<Contact>,
  options: AIEnhancementOptions = {}
): Promise<AIEnhancementResult<Partial<Contact>>> {
  // Opzioni di default
  const defaultOptions: AIEnhancementOptions = {
    confidence_threshold: 0.7,
    enrich_missing_fields: true,
    auto_categorize: true,
    auto_tag: true,
    language: "it",
    max_tokens: 1000
  };
  
  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Campi migliorati e risultato iniziale
  const fieldsEnhanced: string[] = [];
  const result: AIEnhancementResult<Partial<Contact>> = {
    enhanced_entity: { ...contact },
    original_entity: contact,
    confidence_score: 0,
    fields_enhanced: []
  };
  
  try {
    // Verifica se l'API key è disponibile
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY non disponibile, impossibile migliorare il contatto");
      return result;
    }
    
    // Prepara il prompt per OpenAI
    const contactDetails = JSON.stringify(contact, null, 2);
    
    const systemPrompt = `Sei un assistente esperto in CRM e gestione contatti. 
Analizza il seguente contatto e migliora/arricchisci i dati in base alle informazioni disponibili.
La lingua principale è "${mergedOptions.language}".

Se "enrich_missing_fields" è true, cerca di dedurre o suggerire valori per i campi mancanti basandoti sui dati esistenti.
Se "auto_categorize" è true, suggerisci una categoria appropriata per il contatto.
Se "auto_tag" è true, genera tag pertinenti per il contatto.

Considera il contesto aziendale italiano e la struttura tipica delle organizzazioni italiane.
Includi un campo "confidence_score" (0-1) per indicare quanto sei sicuro delle tue modifiche.`;

    const userPrompt = `Ecco il contatto da elaborare:
\`\`\`json
${contactDetails}
\`\`\`

Opzioni di elaborazione:
- enrich_missing_fields: ${mergedOptions.enrich_missing_fields}
- auto_categorize: ${mergedOptions.auto_categorize}
- auto_tag: ${mergedOptions.auto_tag}

Rispondi SOLO con un oggetto JSON che contiene:
1. "enhanced_contact": il contatto migliorato
2. "fields_enhanced": array di campi che hai migliorato
3. "confidence_score": un valore tra 0 e 1
4. "suggested_tags": array di tag suggeriti (se auto_tag è true)
5. "suggested_category": categoria suggerita (se auto_categorize è true)
6. "suggested_notes": eventuali note aggiuntive suggerite`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: mergedOptions.max_tokens,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    // Estrai e analizza la risposta
    const responseContent = response.choices[0].message.content;
    
    if (responseContent) {
      try {
        const aiResult = JSON.parse(responseContent);
        
        // Aggiorna il risultato
        if (aiResult.enhanced_contact) {
          result.enhanced_entity = aiResult.enhanced_contact;
        }
        
        if (Array.isArray(aiResult.fields_enhanced)) {
          result.fields_enhanced = aiResult.fields_enhanced;
        }
        
        if (typeof aiResult.confidence_score === 'number') {
          result.confidence_score = aiResult.confidence_score;
        }
        
        if (Array.isArray(aiResult.suggested_tags)) {
          result.suggested_tags = aiResult.suggested_tags;
        }
        
        if (aiResult.suggested_category) {
          result.suggested_category = aiResult.suggested_category;
        }
        
        if (aiResult.suggested_notes) {
          result.suggested_notes = aiResult.suggested_notes;
        }
        
        // Log se richiesto
        if (mergedOptions.verbose) {
          console.log("AI Enhancement Result:", JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error("Errore nel parsing della risposta AI:", error);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Errore nell'utilizzo di OpenAI:", error);
    return result;
  }
}

/**
 * Migliora e arricchisce un'azienda usando OpenAI
 * @param company L'azienda da migliorare
 * @param options Opzioni di miglioramento
 * @returns Risultato del miglioramento con confidenza
 */
export async function enhanceCompany(
  company: Partial<Company>,
  options: AIEnhancementOptions = {}
): Promise<AIEnhancementResult<Partial<Company>>> {
  // Opzioni di default
  const defaultOptions: AIEnhancementOptions = {
    confidence_threshold: 0.7,
    enrich_missing_fields: true,
    auto_categorize: true,
    auto_tag: true,
    language: "it",
    max_tokens: 1000
  };
  
  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Campi migliorati e risultato iniziale
  const fieldsEnhanced: string[] = [];
  const result: AIEnhancementResult<Partial<Company>> = {
    enhanced_entity: { ...company },
    original_entity: company,
    confidence_score: 0,
    fields_enhanced: []
  };
  
  try {
    // Verifica se l'API key è disponibile
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY non disponibile, impossibile migliorare l'azienda");
      return result;
    }
    
    // Prepara il prompt per OpenAI
    const companyDetails = JSON.stringify(company, null, 2);
    
    const systemPrompt = `Sei un assistente esperto in CRM e gestione aziendale. 
Analizza la seguente azienda e migliora/arricchisci i dati in base alle informazioni disponibili.
La lingua principale è "${mergedOptions.language}".

Se "enrich_missing_fields" è true, cerca di dedurre o suggerire valori per i campi mancanti basandoti sui dati esistenti.
Se "auto_categorize" è true, suggerisci una categoria o settore appropriato per l'azienda.
Se "auto_tag" è true, genera tag pertinenti per l'azienda.

Considera il contesto aziendale italiano e i settori tipici dell'economia italiana.
Includi un campo "confidence_score" (0-1) per indicare quanto sei sicuro delle tue modifiche.`;

    const userPrompt = `Ecco l'azienda da elaborare:
\`\`\`json
${companyDetails}
\`\`\`

Opzioni di elaborazione:
- enrich_missing_fields: ${mergedOptions.enrich_missing_fields}
- auto_categorize: ${mergedOptions.auto_categorize}
- auto_tag: ${mergedOptions.auto_tag}

Rispondi SOLO con un oggetto JSON che contiene:
1. "enhanced_company": l'azienda migliorata
2. "fields_enhanced": array di campi che hai migliorato
3. "confidence_score": un valore tra 0 e 1
4. "suggested_tags": array di tag suggeriti (se auto_tag è true)
5. "suggested_category": categoria o settore suggerito (se auto_categorize è true)
6. "suggested_notes": eventuali note aggiuntive suggerite`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: mergedOptions.max_tokens,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    // Estrai e analizza la risposta
    const responseContent = response.choices[0].message.content;
    
    if (responseContent) {
      try {
        const aiResult = JSON.parse(responseContent);
        
        // Aggiorna il risultato
        if (aiResult.enhanced_company) {
          result.enhanced_entity = aiResult.enhanced_company;
        }
        
        if (Array.isArray(aiResult.fields_enhanced)) {
          result.fields_enhanced = aiResult.fields_enhanced;
        }
        
        if (typeof aiResult.confidence_score === 'number') {
          result.confidence_score = aiResult.confidence_score;
        }
        
        if (Array.isArray(aiResult.suggested_tags)) {
          result.suggested_tags = aiResult.suggested_tags;
        }
        
        if (aiResult.suggested_category) {
          result.suggested_category = aiResult.suggested_category;
        }
        
        if (aiResult.suggested_notes) {
          result.suggested_notes = aiResult.suggested_notes;
        }
        
        // Log se richiesto
        if (mergedOptions.verbose) {
          console.log("AI Enhancement Result:", JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error("Errore nel parsing della risposta AI:", error);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Errore nell'utilizzo di OpenAI:", error);
    return result;
  }
}

/**
 * Migliora e arricchisce un lead usando OpenAI
 * @param lead Il lead da migliorare
 * @param options Opzioni di miglioramento
 * @returns Risultato del miglioramento con confidenza
 */
export async function enhanceLead(
  lead: Partial<Lead>,
  options: AIEnhancementOptions = {}
): Promise<AIEnhancementResult<Partial<Lead>>> {
  // Opzioni di default
  const defaultOptions: AIEnhancementOptions = {
    confidence_threshold: 0.7,
    enrich_missing_fields: true,
    auto_categorize: true,
    auto_tag: true,
    language: "it",
    max_tokens: 1000
  };
  
  // Unisci le opzioni fornite con quelle di default
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Campi migliorati e risultato iniziale
  const fieldsEnhanced: string[] = [];
  const result: AIEnhancementResult<Partial<Lead>> = {
    enhanced_entity: { ...lead },
    original_entity: lead,
    confidence_score: 0,
    fields_enhanced: []
  };
  
  try {
    // Verifica se l'API key è disponibile
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY non disponibile, impossibile migliorare il lead");
      return result;
    }
    
    // Prepara il prompt per OpenAI
    const leadDetails = JSON.stringify(lead, null, 2);
    
    const systemPrompt = `Sei un assistente esperto in CRM e gestione lead. 
Analizza il seguente lead e migliora/arricchisci i dati in base alle informazioni disponibili.
La lingua principale è "${mergedOptions.language}".

Se "enrich_missing_fields" è true, cerca di dedurre o suggerire valori per i campi mancanti basandoti sui dati esistenti.
Se "auto_categorize" è true, suggerisci una categoria appropriata per il lead.
Se "auto_tag" è true, genera tag pertinenti per il lead.

Considera il contesto aziendale italiano e le tipiche fonti di lead nel mercato italiano.
Includi un campo "confidence_score" (0-1) per indicare quanto sei sicuro delle tue modifiche.`;

    const userPrompt = `Ecco il lead da elaborare:
\`\`\`json
${leadDetails}
\`\`\`

Opzioni di elaborazione:
- enrich_missing_fields: ${mergedOptions.enrich_missing_fields}
- auto_categorize: ${mergedOptions.auto_categorize}
- auto_tag: ${mergedOptions.auto_tag}

Rispondi SOLO con un oggetto JSON che contiene:
1. "enhanced_lead": il lead migliorato
2. "fields_enhanced": array di campi che hai migliorato
3. "confidence_score": un valore tra 0 e 1
4. "suggested_tags": array di tag suggeriti (se auto_tag è true)
5. "suggested_category": categoria suggerita (se auto_categorize è true)
6. "suggested_notes": eventuali note aggiuntive suggerite`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: mergedOptions.max_tokens,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    // Estrai e analizza la risposta
    const responseContent = response.choices[0].message.content;
    
    if (responseContent) {
      try {
        const aiResult = JSON.parse(responseContent);
        
        // Aggiorna il risultato
        if (aiResult.enhanced_lead) {
          result.enhanced_entity = aiResult.enhanced_lead;
        }
        
        if (Array.isArray(aiResult.fields_enhanced)) {
          result.fields_enhanced = aiResult.fields_enhanced;
        }
        
        if (typeof aiResult.confidence_score === 'number') {
          result.confidence_score = aiResult.confidence_score;
        }
        
        if (Array.isArray(aiResult.suggested_tags)) {
          result.suggested_tags = aiResult.suggested_tags;
        }
        
        if (aiResult.suggested_category) {
          result.suggested_category = aiResult.suggested_category;
        }
        
        if (aiResult.suggested_notes) {
          result.suggested_notes = aiResult.suggested_notes;
        }
        
        // Log se richiesto
        if (mergedOptions.verbose) {
          console.log("AI Enhancement Result:", JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error("Errore nel parsing della risposta AI:", error);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Errore nell'utilizzo di OpenAI:", error);
    return result;
  }
}

/**
 * Funzione generale per il miglioramento di entità con AI
 * @param entity L'entità da migliorare
 * @param entityType Il tipo di entità
 * @param options Opzioni di miglioramento
 * @returns Risultato del miglioramento
 */
export async function aiEnhancer(
  entity: any,
  entityType: 'contacts' | 'companies' | 'leads',
  options: AIEnhancementOptions = {}
): Promise<AIEnhancementResult<any>> {
  
  switch(entityType) {
    case 'contacts':
      return enhanceContact(entity, options);
    case 'companies':
      return enhanceCompany(entity, options);
    case 'leads':
      return enhanceLead(entity, options);
    default:
      throw new Error(`Tipo di entità non supportato: ${entityType}`);
  }
}