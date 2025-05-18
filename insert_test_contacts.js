// Script per inserire contatti di test utilizzando l'API locale
// Semplice versione che non necessita di moduli esterni

const firstNames = [
  'Marco', 'Luca', 'Giuseppe', 'Paolo', 'Andrea', 'Francesca', 'Anna', 'Maria', 'Chiara', 'Alessia',
  'Sofia', 'Giulia', 'Matteo', 'Francesco', 'Davide', 'Elena', 'Laura', 'Sara', 'Valentina', 'Roberta'
];

const lastNames = [
  'Rossi', 'Bianchi', 'Verdi', 'Ferrari', 'Russo', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino',
  'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi'
];

const domainNames = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'libero.it', 'virgilio.it', 
  'icloud.com', 'me.com', 'fastwebnet.it', 'tiscali.it'
];

const companyDomains = [
  'azienda.it', 'company.com', 'enterprise.eu', 'business.it', 'corporate.com', 
  'srl.it', 'spa.it', 'tech.com', 'group.it', 'consulting.com'  
];

const roles = [
  'CEO', 'Direttore Commerciale', 'Direttore Marketing', 'CFO', 'CTO',
  'Responsabile Vendite', 'Responsabile Acquisti', 'Responsabile IT', 'Responsabile HR',
  'Project Manager', 'Account Manager', 'Consulente', 'Sales Manager', 'Marketing Manager',
  'Sviluppatore', 'Designer', 'Analista', 'Tecnico', 'Assistente', 'Segretario/a'
];

const jobDescriptions = [
  'Gestisce l\'azienda e definisce le strategie.',
  'Supervisiona le attività commerciali e sviluppa nuove opportunità di business.',
  'Pianifica e implementa strategie di marketing.',
  'Supervisiona tutte le questioni finanziarie dell\'azienda.',
  'Gestisce l\'infrastruttura tecnologica e le soluzioni IT.',
  'Coordina le attività di vendita e il team commerciale.',
  'Gestisce gli acquisti e le relazioni con i fornitori.',
  'Supervisiona i sistemi informatici e la rete aziendale.',
  'Gestisce le risorse umane e il recruitment.',
  'Coordina progetti e supervisiona i team di lavoro.',
  'Gestisce i rapporti con i clienti chiave.',
  'Fornisce consulenza professionale in ambito specifico.',
  'Sviluppa strategie di vendita e gestisce il team vendite.',
  'Crea e implementa campagne di marketing.',
  'Sviluppa software e soluzioni tecnologiche.',
  'Crea design visivi per prodotti e comunicazioni.',
  'Analizza dati e fornisce insight strategici.',
  'Fornisce supporto tecnico e manutenzione.',
  'Supporta i manager nelle attività quotidiane.',
  'Gestisce l\'agenda, la corrispondenza e le comunicazioni.'
];

const tags = [
  'vip', 'prospect', 'cliente', 'fornitore', 'partner', 'influencer', 'decisore', 
  'tecnico', 'finanza', 'marketing', 'vendite', 'strategico', 'innovazione', 
  'startup', 'enterprise', 'estero', 'locale', 'consulente', 'investitore', 'media'
];

// Aziende esistenti nel sistema
const companies = [
  { id: 9, name: 'ABC Consulting' },
  { id: 19, name: 'EasyPoke' },
  { id: 23, name: 'Falegnameria Curzel Srl' },
  { id: 14, name: 'FranchisingPlus SpA' },
  { id: 11, name: 'Gruppo Ethos' },
  { id: 22, name: 'INVESTFOOD s.r.l.' },
  { id: 21, name: 'Investec Johannesburg' },
  { id: 17, name: 'JWT Test Company' },
  { id: 16, name: 'Panino Giusto Duomo Milano' },
  { id: 12, name: 'Pioneer MRT Station (EW28)' },
  { id: 20, name: 'Poke House - Roma' },
  { id: 18, name: 'Porcobrado Milano' },
  { id: 15, name: 'Ristoranti Italiani Srl' },
  { id: 13, name: 'Shell Italia S.p.A.' },
  { id: 10, name: 'XYZ Franchising' }
];

// Funzione per generare un numero di telefono italiano
function generateItalianPhone() {
  const prefixes = ['+39 3', '+39 33', '+39 34', '+39 35', '+39 36', '+39 37', '+39 38', '+39 39'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

// Funzione per generare un numero di telefono fisso italiano
function generateItalianLandline() {
  const prefixes = ['+39 0', '+39 01', '+39 02', '+39 03', '+39 04', '+39 05', '+39 06', '+39 07', '+39 08', '+39 09'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

// Funzione per generare una data casuale negli ultimi 2 anni
function generateRandomDate() {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  return new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));
}

// Funzione per generare un indirizzo italiano casuale
function generateItalianAddress() {
  const streetTypes = ['Via', 'Corso', 'Piazza', 'Viale', 'Largo', 'Vicolo'];
  const streetNames = ['Roma', 'Dante', 'Garibaldi', 'Mazzini', 'Verdi', 'Cavour', 'Colombo', 'Leonardo', 'Marconi', 'Galilei'];
  const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Bologna', 'Firenze', 'Venezia', 'Genova', 'Palermo', 'Bari'];
  
  const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const streetNumber = Math.floor(Math.random() * 100) + 1;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const cap = Math.floor(Math.random() * 90000) + 10000;
  
  return `${streetType} ${streetName}, ${streetNumber}, ${cap} ${city}, Italia`;
}

// Funzione per generare tag casuali
function getRandomTags(max = 5) {
  const count = Math.floor(Math.random() * max) + 1;
  const selectedTags = [];
  
  for (let i = 0; i < count; i++) {
    const tag = tags[Math.floor(Math.random() * tags.length)];
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }
  
  return selectedTags;
}

// Funzione principale per creare contatti di test
async function createTestContacts(count) {
  console.log(`Creazione di ${count} contatti di test...`);
  
  if (companies.length === 0) {
    console.error('Non sono state trovate aziende nel database.');
    return;
  }
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const hasMiddleName = Math.random() > 0.7;
    const middleName = hasMiddleName ? firstNames[Math.floor(Math.random() * firstNames.length)] : null;
    
    // Determina quante aziende associare a questo contatto (1-3)
    const numCompanies = Math.floor(Math.random() * 3) + 1;
    const selectedCompanies = [];
    
    for (let j = 0; j < numCompanies; j++) {
      if (companies.length > 0) {
        const randomIndex = Math.floor(Math.random() * companies.length);
        const company = companies[randomIndex];
        
        // Evita di associare la stessa azienda più volte
        if (!selectedCompanies.some(c => c.companyId === company.id)) {
          selectedCompanies.push({
            companyId: company.id,
            companyName: company.name,
            isPrimary: j === 0, // La prima azienda è primaria
            role: roles[Math.floor(Math.random() * roles.length)],
            jobDescription: jobDescriptions[Math.floor(Math.random() * jobDescriptions.length)]
          });
        }
      }
    }
    
    // Crea un'email personale
    const personalEmailDomain = domainNames[Math.floor(Math.random() * domainNames.length)];
    const personalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${personalEmailDomain}`;
    
    // Crea un'email aziendale
    const companyDomain = companyDomains[Math.floor(Math.random() * companyDomains.length)];
    const companyEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`;
    
    const contact = {
      firstName,
      lastName,
      middleName,
      companyEmail,
      privateEmail: personalEmail,
      mobilePhone: generateItalianPhone(),
      officePhone: generateItalianLandline(),
      address: generateItalianAddress(),
      birthday: Math.random() > 0.5 ? new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : null,
      areasOfActivity: selectedCompanies,
      tags: getRandomTags(),
      notes: Math.random() > 0.3 ? `Note di contatto per ${firstName} ${lastName}. Contatto creato a scopo di test.` : null,
      status: Math.random() > 0.1 ? 'active' : 'inactive'
    };
    
    try {
      console.log(`Creazione contatto ${i+1}: ${firstName} ${lastName}`);
      
      const response = await fetch('http://localhost:5000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Errore durante la creazione del contatto ${i+1}:`, errorText);
      } else {
        const data = await response.json();
        console.log(`Contatto ${i+1} creato con ID: ${data.id}`);
      }
      
      // Piccola pausa per evitare sovraccarichi
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Errore durante la creazione del contatto ${i+1}:`, error);
    }
  }
  
  console.log('Creazione contatti completata!');
}

// Esegui lo script
createTestContacts(30).catch(console.error);