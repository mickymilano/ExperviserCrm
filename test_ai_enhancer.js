import { OpenAI } from 'openai';

// Inizializza il client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Funzione di test per l'integrazione OpenAI
async function testOpenAIIntegration() {
  try {
    console.log('Inizio test integrazione OpenAI...');
    
    // Dati di test per un contatto
    const testContact = {
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@example.com',
      phone: '+39 02 1234567',
      role: 'Direttore Marketing',
      company: 'Azienda Innovativa SPA',
      notes: 'Interessato ai nostri servizi di automazione per marketing digitale. Ha richiesto un preventivo per un progetto di 6 mesi.'
    };

    console.log('Dati contatto di test:', testContact);
    
    // Prepara il prompt
    const prompt = `
    Analizza questi dati di contatto e fornisci suggerimenti per categorizzazione, tag pertinenti, e potenziali opportunità basandoti sulle informazioni disponibili. 
    Rispondi con un oggetto JSON con i campi 'category', 'tags', e 'notes'.
    
    Dati del contatto:
    Nome: ${testContact.firstName} ${testContact.lastName}
    Email: ${testContact.email}
    Telefono: ${testContact.phone}
    Ruolo: ${testContact.role}
    Azienda: ${testContact.company}
    Note: ${testContact.notes}
    `;

    console.log('Invio richiesta ad OpenAI...');
    
    // Chiama OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: "Sei un assistente CRM esperto che analizza contatti per suggerire categorizzazioni, tag e note." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    // Estrai la risposta
    const content = response.choices[0].message.content;
    console.log('Risposta ricevuta da OpenAI:', content);
    
    // Analizza il JSON
    const analysis = JSON.parse(content);
    console.log('Analisi strutturata:', analysis);
    
    // Arricchisci il contatto
    const enhancedContact = {
      ...testContact,
      category: analysis.category || "Non categorizzato",
      tags: [...(testContact.tags || []), ...(analysis.tags || [])],
      suggestedNotes: analysis.notes || ""
    };
    
    console.log('Contatto arricchito:', enhancedContact);
    console.log('Test completato con successo!');
    
    return enhancedContact;
  } catch (error) {
    console.error('Errore durante il test OpenAI:', error);
    throw error;
  }
}

// Esegui il test
testOpenAIIntegration()
  .then(() => {
    console.log('Test eseguito con successo');
  })
  .catch(error => {
    console.error('Test fallito:', error);
  });