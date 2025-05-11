import { storage } from "./storage";
import { Contact, Company, Deal, PipelineStage } from "@shared/schema";

// Test data generation
async function seedTestData() {
  try {
    console.log("Iniziando il seeding dei dati di test...");
    
    // Ottieni gli stage della pipeline
    let pipelineStages = await storage.getPipelineStages();
    if (!pipelineStages || pipelineStages.length === 0) {
      console.log("Pipeline stages not found. Creating them now...");
      
      // Create default pipeline stages
      const stages = [
        { name: "Qualification", order: 1 },
        { name: "Meeting", order: 2 },
        { name: "Proposal", order: 3 },
        { name: "Negotiation", order: 4 },
        { name: "Closed Won", order: 5 },
        { name: "Closed Lost", order: 6 }
      ];
      
      for (const stage of stages) {
        await storage.createPipelineStage(stage);
      }
      
      // Get the created stages
      pipelineStages = await storage.getPipelineStages();
      console.log(`Created ${pipelineStages.length} pipeline stages.`);
    }
    
    // 1. Creare le aziende
    const companies: Company[] = [];
    const companyData = [
      {
        name: "TechInnovate Srl",
        industry: "Technology",
        email: "info@techinnovate.it",
        phone: "+39 02 8765 4321",
        website: "https://www.techinnovate.it",
        address: "Via Milano 123, Milano, Italia",
        tags: ["tech", "b2b", "software"]
      },
      {
        name: "Moda Elegante SpA",
        industry: "Fashion",
        email: "contatti@modaelegante.it",
        phone: "+39 06 1234 5678",
        website: "https://www.modaelegante.it",
        address: "Via Condotti 45, Roma, Italia",
        tags: ["fashion", "retail", "luxury"]
      },
      {
        name: "Gusto Italiano Ristoranti",
        industry: "Foodservice",
        email: "info@gustoitaliano.it",
        phone: "+39 055 9876 5432",
        website: "https://www.gustoitaliano.it",
        address: "Piazza della Repubblica 7, Firenze, Italia",
        tags: ["restaurant", "food", "hospitality"]
      },
      {
        name: "Costruzioni Moderne SRL",
        industry: "Construction",
        email: "info@costruzionimoderne.it",
        phone: "+39 081 2345 6789",
        website: "https://www.costruzionimoderne.it",
        address: "Via Napoli 67, Napoli, Italia",
        tags: ["construction", "architecture", "real-estate"]
      },
      {
        name: "Salute e Benessere SpA",
        industry: "Healthcare",
        email: "contatto@salutebenessere.it",
        phone: "+39 011 8765 4321",
        website: "https://www.salutebenessere.it",
        address: "Corso Francia 78, Torino, Italia",
        tags: ["healthcare", "wellness", "medical"]
      },
      {
        name: "Energia Verde Italia",
        industry: "Energy",
        email: "info@energiaverde.it",
        phone: "+39 041 2345 6789",
        website: "https://www.energiaverde.it",
        address: "Campo San Polo 2123, Venezia, Italia",
        tags: ["energy", "renewable", "sustainability"]
      },
      {
        name: "Educazione Futura",
        industry: "Education",
        email: "info@educazionefutura.it",
        phone: "+39 051 9876 5432",
        website: "https://www.educazionefutura.it",
        address: "Via Indipendenza 12, Bologna, Italia",
        tags: ["education", "training", "e-learning"]
      },
      {
        name: "Trasporti Veloci SpA",
        industry: "Transportation",
        email: "contatti@trasportiveloci.it",
        phone: "+39 010 1234 5678",
        website: "https://www.trasportiveloci.it",
        address: "Via XX Settembre 34, Genova, Italia",
        tags: ["logistics", "transport", "shipping"]
      },
      {
        name: "Turismo Italia Tour",
        industry: "Tourism",
        email: "booking@turismoitalia.it",
        phone: "+39 070 8765 4321",
        website: "https://www.turismoitalia.it",
        address: "Via Roma 56, Cagliari, Italia",
        tags: ["tourism", "travel", "vacation"]
      },
      {
        name: "Studio Legale Associato",
        industry: "Legal",
        email: "info@studiolegaleassociato.it",
        phone: "+39 049 2345 6789",
        website: "https://www.studiolegaleassociato.it",
        address: "Via Padova 23, Padova, Italia",
        tags: ["legal", "consulting", "law"]
      }
    ];

    for (const data of companyData) {
      const company = await storage.createCompany({
        name: data.name,
        industry: data.industry,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        tags: data.tags,
        notes: `Note per ${data.name}: Cliente potenziale con grandi opportunità.`
      });
      companies.push(company);
      console.log(`Creata azienda: ${company.name}`);
    }

    // 2. Creare i contatti
    const contacts: Contact[] = [];
    const contactData = [
      {
        firstName: "Marco",
        lastName: "Rossi",
        email: "marco.rossi@techinnovate.it",
        phone: "+39 333 123 4567",
        jobTitle: "CTO",
        companyId: null, // Sarà assegnato dopo
        tags: ["decision-maker", "tech"],
        linkedIn: "https://www.linkedin.com/in/marcorossi/",
        twitter: "@marcorossi",
        notes: "Esperto di tecnologia con potere decisionale."
      },
      {
        firstName: "Giulia",
        lastName: "Bianchi",
        email: "g.bianchi@modaelegante.it",
        phone: "+39 334 234 5678",
        jobTitle: "Direttore Marketing",
        companyId: null,
        tags: ["marketing", "fashion"],
        linkedIn: "https://www.linkedin.com/in/giuliabianchi/",
        facebook: "https://facebook.com/giulia.bianchi",
        notes: "Molto interessata alle soluzioni di marketing digitale."
      },
      {
        firstName: "Alessandro",
        lastName: "Verdi",
        email: "a.verdi@gustoitaliano.it",
        phone: "+39 335 345 6789",
        jobTitle: "CEO",
        companyId: null,
        tags: ["executive", "decision-maker"],
        linkedIn: "https://www.linkedin.com/in/alessandroverdi/",
        notes: "Fondatore, molto orientato all'innovazione."
      },
      {
        firstName: "Francesca",
        lastName: "Neri",
        email: "f.neri@costruzionimoderne.it",
        phone: "+39 336 456 7890",
        jobTitle: "Direttore Operativo",
        companyId: null,
        tags: ["operations", "construction"],
        linkedIn: "https://www.linkedin.com/in/francescaneri/",
        notes: "Gestisce tutti i progetti di costruzione."
      },
      {
        firstName: "Roberto",
        lastName: "Marini",
        email: "r.marini@salutebenessere.it",
        phone: "+39 337 567 8901",
        jobTitle: "Direttore Medico",
        companyId: null,
        tags: ["healthcare", "medical"],
        linkedIn: "https://www.linkedin.com/in/robertomarini/",
        notes: "Interessato a soluzioni tecnologiche per la salute."
      },
      {
        firstName: "Valentina",
        lastName: "Moretti",
        email: "v.moretti@energiaverde.it",
        phone: "+39 338 678 9012",
        jobTitle: "Responsabile Sostenibilità",
        companyId: null,
        tags: ["sustainability", "energy"],
        linkedIn: "https://www.linkedin.com/in/valentinamoretti/",
        instagram: "@valmoretti",
        notes: "Molto attiva nel settore delle energie rinnovabili."
      },
      {
        firstName: "Luca",
        lastName: "Ferrari",
        email: "l.ferrari@educazionefutura.it",
        phone: "+39 339 789 0123",
        jobTitle: "Direttore Didattico",
        companyId: null,
        tags: ["education", "e-learning"],
        linkedIn: "https://www.linkedin.com/in/lucaferrari/",
        notes: "Cerca soluzioni di e-learning avanzate."
      },
      {
        firstName: "Sofia",
        lastName: "Ricci",
        email: "s.ricci@trasportiveloci.it",
        phone: "+39 330 890 1234",
        jobTitle: "Responsabile Logistica",
        companyId: null,
        tags: ["logistics", "operations"],
        linkedIn: "https://www.linkedin.com/in/sofiaricci/",
        notes: "Gestisce la flotta e le operazioni logistiche."
      },
      {
        firstName: "Matteo",
        lastName: "Conti",
        email: "m.conti@turismoitalia.it",
        phone: "+39 331 901 2345",
        jobTitle: "Direttore Commerciale",
        companyId: null,
        tags: ["sales", "tourism"],
        linkedIn: "https://www.linkedin.com/in/matteoconti/",
        notes: "Interessato a espandere le partnership internazionali."
      },
      {
        firstName: "Elena",
        lastName: "Martini",
        email: "e.martini@studiolegaleassociato.it",
        phone: "+39 332 012 3456",
        jobTitle: "Partner",
        companyId: null,
        tags: ["legal", "decision-maker"],
        linkedIn: "https://www.linkedin.com/in/elenamartini/",
        notes: "Specializzata in diritto commerciale e tech."
      }
    ];

    // Assegnare ogni contatto a un'azienda corrispondente
    for (let i = 0; i < contactData.length; i++) {
      const data = contactData[i];
      data.companyId = companies[i].id;
      
      const contact = await storage.createContact({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        companyId: data.companyId,
        tags: data.tags,
        linkedin: data.linkedIn,
        twitter: data.twitter,
        facebook: data.facebook,
        instagram: data.instagram,
        notes: data.notes
      });
      
      // Creare l'area di attività per collegare contatto e azienda
      await storage.createAreaOfActivity({
        contactId: contact.id,
        companyId: data.companyId,
        companyName: companies[i].name,
        role: data.jobTitle,
        isPrimary: true,
        jobDescription: `${data.jobTitle} presso ${companies[i].name}`
      });
      
      contacts.push(contact);
      console.log(`Creato contatto: ${contact.firstName} ${contact.lastName}`);
    }

    // 3. Creare i deal (opportunità)
    const dealNames = [
      "Implementazione sistema CRM",
      "Consulenza marketing digitale",
      "Ristrutturazione sede centrale",
      "Progetto di espansione aziendale",
      "Sviluppo sito web e-commerce",
      "Consulenza strategica",
      "Programma di formazione aziendale",
      "Ottimizzazione logistica",
      "Campagna promozionale internazionale",
      "Servizi di consulenza legale"
    ];
    
    const dealValues = [15000, 8500, 120000, 45000, 12000, 9500, 18000, 22500, 30000, 7500];
    
    // Distribuire i deal tra i diversi stage
    for (let i = 0; i < dealNames.length; i++) {
      // Calcola l'indice dello stage come modulo del numero di stage disponibili
      const stageIndex = i % pipelineStages.length;
      const stage = pipelineStages[stageIndex];
      
      // Calcola la data di chiusura prevista (da 2 a 6 mesi nel futuro)
      const monthsAhead = Math.floor(Math.random() * 4) + 2; // da 2 a 6 mesi
      const expectedCloseDate = new Date();
      expectedCloseDate.setMonth(expectedCloseDate.getMonth() + monthsAhead);
      
      const deal = await storage.createDeal({
        name: dealNames[i],
        value: dealValues[i],
        stageId: stage.id,
        contactId: contacts[i].id,
        companyId: companies[i].id,
        expectedCloseDate: expectedCloseDate,
        tags: ["priority", contacts[i].tags?.[0] || "business"],
        notes: `Opportunità di business con ${companies[i].name}. Contatto principale: ${contacts[i].firstName} ${contacts[i].lastName}.`
      });
      
      console.log(`Creato deal: ${deal.name}`);
    }

    console.log("Seeding dei dati di test completato con successo!");
    return { companies, contacts };
  } catch (error) {
    console.error("Errore durante il seeding dei dati di test:", error);
    throw error;
  }
}

export { seedTestData };