import { db } from "./db-simple";
import { 
  contacts, 
  companies, 
  areasOfActivity, 
  pipelineStages, 
  deals,
  leads
} from "@shared/schema";
import { PostgresStorage } from "./postgresStorage";

const storage = new PostgresStorage();

async function createInitialData() {
  console.log("Creazione dati iniziali...");
  
  // Crea aziende di esempio
  console.log("Creazione aziende...");
  const urbanEats = await storage.createCompany({
    name: "Urban Eats",
    industry: "Ristorazione",
    email: "info@urbaneats.it",
    website: "www.urbaneats.it",
    phone: "+39 02 1234567"
  });
  
  const qsrFranchise = await storage.createCompany({
    name: "QSR Franchise",
    industry: "Ristorazione",
    email: "info@qsrfranchise.it",
    website: "www.qsrfranchise.it",
    phone: "+39 02 7654321"
  });
  
  const techSolutions = await storage.createCompany({
    name: "Tech Solutions Inc",
    industry: "Tecnologia",
    email: "info@techsolutions.com",
    website: "www.techsolutions.com",
    phone: "+39 02 9876543"
  });
  
  const techInnovate = await storage.createCompany({
    name: "TechInnovate Srl",
    industry: "Tecnologia",
    email: "info@techinnovate.it",
    website: "www.techinnovate.it",
    phone: "+39 02 3456789"
  });
  
  const modaElegante = await storage.createCompany({
    name: "Moda Elegante SpA",
    industry: "Moda",
    email: "info@modaelegante.it",
    website: "www.modaelegante.it",
    phone: "+39 02 2345678"
  });
  
  const gustoItaliano = await storage.createCompany({
    name: "Gusto Italiano Ristoranti",
    industry: "Ristorazione",
    email: "info@gustoitaliano.it",
    website: "www.gustoitaliano.it",
    phone: "+39 02 8765432"
  });
  
  const costruzioniModerne = await storage.createCompany({
    name: "Costruzioni Moderne SRL",
    industry: "Edilizia",
    email: "info@costruzionimoderne.it",
    website: "www.costruzionimoderne.it",
    phone: "+39 02 6543210"
  });
  
  const saluteBenessere = await storage.createCompany({
    name: "Salute e Benessere SpA",
    industry: "Salute",
    email: "info@salutebenessere.it",
    website: "www.salutebenessere.it",
    phone: "+39 02 5432109"
  });
  
  const energiaVerde = await storage.createCompany({
    name: "Energia Verde Italia",
    industry: "Energia",
    email: "info@energiaverde.it",
    website: "www.energiaverde.it",
    phone: "+39 02 4321098"
  });
  
  const educazioneFutura = await storage.createCompany({
    name: "Educazione Futura",
    industry: "Istruzione",
    email: "info@educazionefutura.it",
    website: "www.educazionefutura.it",
    phone: "+39 02 3210987"
  });
  
  console.log("Aziende create con successo");
  
  // Crea contatti di esempio
  console.log("Creazione contatti...");
  const sarahJohnson = await storage.createContact({
    firstName: "Sarah",
    lastName: "Johnson",
    companyEmail: "sarah.johnson@urbaneats.it",
    privateEmail: "sarah.johnson@gmail.com",
    mobilePhone: "+39 333 1234567",
    officePhone: "+39 02 1234567",
    address: "Via Roma 123, Milano",
    position: "Operations Director",
    notes: "Contatto principale per Urban Eats"
  });
  
  const alexChen = await storage.createContact({
    firstName: "Alex",
    lastName: "Chen",
    companyEmail: "alex.chen@qsrfranchise.it",
    privateEmail: "alex.chen@gmail.com",
    mobilePhone: "+39 333 2345678",
    officePhone: "+39 02 7654321",
    address: "Via Torino 456, Milano",
    position: "Business Developer",
    notes: "Esperto in franchising e sviluppo business"
  });
  
  const marcoBianchi = await storage.createContact({
    firstName: "Marco",
    lastName: "Bianchi",
    companyEmail: "marco.bianchi@techsolutions.com",
    privateEmail: "marco.bianchi@gmail.com",
    mobilePhone: "+39 333 3456789",
    officePhone: "+39 02 9876543",
    address: "Via Venezia 789, Milano",
    position: "CTO",
    notes: "Competenze tecniche avanzate"
  });
  
  const andreaNeri = await storage.createContact({
    firstName: "Andrea",
    lastName: "Neri",
    companyEmail: "andrea.neri@techinnovate.it",
    privateEmail: "andrea.neri@gmail.com",
    mobilePhone: "+39 333 4567890",
    officePhone: "+39 02 3456789",
    address: "Via Milano 101, Roma",
    position: "CEO",
    notes: "Decisore chiave"
  });
  
  const lauraMartini = await storage.createContact({
    firstName: "Laura",
    lastName: "Martini",
    companyEmail: "laura.martini@modaelegante.it",
    privateEmail: "laura.martini@gmail.com",
    mobilePhone: "+39 333 5678901",
    officePhone: "+39 02 2345678",
    address: "Via Firenze 111, Milano",
    position: "Marketing Director",
    notes: "Responsabile marketing e comunicazione"
  });
  
  const giuseppeRossi = await storage.createContact({
    firstName: "Giuseppe",
    lastName: "Rossi",
    companyEmail: "giuseppe.rossi@gustoitaliano.it",
    privateEmail: "giuseppe.rossi@gmail.com",
    mobilePhone: "+39 333 6789012",
    officePhone: "+39 02 8765432",
    address: "Via Napoli 121, Roma",
    position: "Founder",
    notes: "Fondatore della catena di ristoranti"
  });
  
  const francescaVerdi = await storage.createContact({
    firstName: "Francesca",
    lastName: "Verdi",
    companyEmail: "francesca.verdi@costruzionimoderne.it",
    privateEmail: "francesca.verdi@gmail.com",
    mobilePhone: "+39 333 7890123",
    officePhone: "+39 02 6543210",
    address: "Via Bologna 131, Torino",
    position: "Project Manager",
    notes: "Gestione progetti di costruzione"
  });
  
  const robertoMarini = await storage.createContact({
    firstName: "Roberto",
    lastName: "Marini",
    companyEmail: "roberto.marini@salutebenessere.it",
    privateEmail: "roberto.marini@gmail.com",
    mobilePhone: "+39 333 8901234",
    officePhone: "+39 02 5432109",
    address: "Via Genova 141, Milano",
    position: "Medical Director",
    notes: "Esperto in protocolli sanitari"
  });
  
  const valentinaMoretti = await storage.createContact({
    firstName: "Valentina",
    lastName: "Moretti",
    companyEmail: "valentina.moretti@energiaverde.it",
    privateEmail: "valentina.moretti@gmail.com",
    mobilePhone: "+39 333 9012345",
    officePhone: "+39 02 4321098",
    address: "Via Palermo 151, Roma",
    position: "Research Engineer",
    notes: "Esperta in soluzioni energetiche sostenibili"
  });
  
  const lucaFerrari = await storage.createContact({
    firstName: "Luca",
    lastName: "Ferrari",
    companyEmail: "luca.ferrari@educazionefutura.it",
    privateEmail: "luca.ferrari@gmail.com",
    mobilePhone: "+39 333 0123456",
    officePhone: "+39 02 3210987",
    address: "Via Bari 161, Milano",
    position: "Program Director",
    notes: "Sviluppo programmi formativi"
  });
  
  console.log("Contatti creati con successo");
  
  // Crea aree di attività per associare contatti e aziende
  console.log("Creazione aree di attività...");
  await storage.createAreaOfActivity({
    contactId: sarahJohnson.id,
    companyId: urbanEats.id,
    role: "Operations Director",
    jobDescription: "Gestione operativa e logistica",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: alexChen.id,
    companyId: qsrFranchise.id,
    role: "Business Developer",
    jobDescription: "Sviluppo business e franchising",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: marcoBianchi.id,
    companyId: techSolutions.id,
    role: "CTO",
    jobDescription: "Direzione tecnologica",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: andreaNeri.id,
    companyId: techInnovate.id,
    role: "CEO",
    jobDescription: "Direzione generale",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: lauraMartini.id,
    companyId: modaElegante.id,
    role: "Marketing Director",
    jobDescription: "Strategie di marketing",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: giuseppeRossi.id,
    companyId: gustoItaliano.id,
    role: "Founder",
    jobDescription: "Supervisione generale",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: francescaVerdi.id,
    companyId: costruzioniModerne.id,
    role: "Project Manager",
    jobDescription: "Gestione progetti di costruzione",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: robertoMarini.id,
    companyId: saluteBenessere.id,
    role: "Medical Director",
    jobDescription: "Supervisione protocolli sanitari",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: valentinaMoretti.id,
    companyId: energiaVerde.id,
    role: "Research Engineer",
    jobDescription: "Ricerca e sviluppo soluzioni energetiche",
    isPrimary: true
  });
  
  await storage.createAreaOfActivity({
    contactId: lucaFerrari.id,
    companyId: educazioneFutura.id,
    role: "Program Director",
    jobDescription: "Sviluppo programmi formativi",
    isPrimary: true
  });
  
  // Aggiunta: Associare Sarah Johnson a TechInnovate
  await storage.createAreaOfActivity({
    contactId: sarahJohnson.id,
    companyId: techInnovate.id,
    role: "External Consultant",
    jobDescription: "Consulenza per implementazione CRM",
    isPrimary: false
  });
  
  console.log("Aree di attività create con successo");
  
  // Crea lead di esempio
  console.log("Creazione lead...");
  await storage.createLead({
    firstName: "Giovanni",
    lastName: "Esposito",
    companyName: "Ristorante Da Giovanni",
    companyEmail: "giovanni@ristorantedagiovanni.it",
    privateEmail: "giovanni.esposito@gmail.com",
    mobilePhone: "+39 333 1122334",
    industry: "Ristorazione",
    source: "Referral",
    status: "New",
    notes: "Interessato a soluzioni di prenotazione online"
  });
  
  await storage.createLead({
    firstName: "Sofia",
    lastName: "Ricci",
    companyName: "Boutique Sofia",
    companyEmail: "sofia@boutiquesofia.it",
    privateEmail: "sofia.ricci@gmail.com",
    mobilePhone: "+39 333 2233445",
    industry: "Moda",
    source: "Website",
    status: "Contacted",
    notes: "Richiesta informazioni su sistemi di gestione inventario"
  });
  
  await storage.createLead({
    firstName: "Antonio",
    lastName: "Moretti",
    companyName: "TechSmart Solutions",
    companyEmail: "antonio@techsmart.it",
    privateEmail: "antonio.moretti@gmail.com",
    mobilePhone: "+39 333 3344556",
    industry: "Tecnologia",
    source: "LinkedIn",
    status: "Qualified",
    notes: "Potenziale cliente per servizi di consulenza IT"
  });
  
  await storage.createLead({
    firstName: "Elena",
    lastName: "Fabbri",
    companyName: "Wellness Center",
    companyEmail: "elena@wellnesscenter.it",
    privateEmail: "elena.fabbri@gmail.com",
    mobilePhone: "+39 333 4455667",
    industry: "Salute",
    source: "Event",
    status: "New",
    notes: "Incontrata alla fiera del benessere"
  });
  
  await storage.createLead({
    firstName: "Davide",
    lastName: "Romano",
    companyName: "Green Energy Solutions",
    companyEmail: "davide@greenenergy.it",
    privateEmail: "davide.romano@gmail.com",
    mobilePhone: "+39 333 5566778",
    industry: "Energia",
    source: "Cold Call",
    status: "Contacted",
    notes: "Da ricontattare per presentazione servizi"
  });
  
  console.log("Lead creati con successo");
  
  // Crea deal di esempio
  console.log("Creazione deal...");
  
  // Deal associato a Sarah Johnson e TechInnovate
  await storage.createDeal({
    name: "Implementazione sistema CRM",
    value: 12500,
    stageId: 3, // Analisi Esigenze
    contactId: sarahJohnson.id,
    companyId: techInnovate.id,
    expectedCloseDate: new Date(2025, 6, 30), // 30 luglio 2025
    notes: "Implementazione sistema CRM personalizzato"
  });
  
  // Altri deal
  await storage.createDeal({
    name: "Consulenza strategica",
    value: 8000,
    stageId: 2, // Primo Contatto
    contactId: alexChen.id,
    companyId: qsrFranchise.id,
    expectedCloseDate: new Date(2025, 5, 15), // 15 giugno 2025
    notes: "Consulenza per espansione franchising"
  });
  
  await storage.createDeal({
    name: "Sviluppo software gestionale",
    value: 15000,
    stageId: 4, // Proposta
    contactId: marcoBianchi.id,
    companyId: techSolutions.id,
    expectedCloseDate: new Date(2025, 7, 10), // 10 agosto 2025
    notes: "Sviluppo software personalizzato per gestione processi interni"
  });
  
  await storage.createDeal({
    name: "Campagna marketing digitale",
    value: 6500,
    stageId: 3, // Analisi Esigenze
    contactId: lauraMartini.id,
    companyId: modaElegante.id,
    expectedCloseDate: new Date(2025, 5, 30), // 30 giugno 2025
    notes: "Campagna sui social media per nuova collezione"
  });
  
  await storage.createDeal({
    name: "Ottimizzazione processi produttivi",
    value: 9000,
    stageId: 1, // Qualifica Lead
    contactId: giuseppeRossi.id,
    companyId: gustoItaliano.id,
    expectedCloseDate: new Date(2025, 6, 15), // 15 luglio 2025
    notes: "Analisi e ottimizzazione dei processi di produzione"
  });
  
  console.log("Deal creati con successo");
  
  console.log("Dati iniziali creati con successo!");
}

// Esegui lo script
createInitialData()
  .then(() => {
    console.log("Script completato con successo!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Errore durante l'esecuzione dello script:", error);
    process.exit(1);
  });