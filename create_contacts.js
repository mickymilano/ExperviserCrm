// Questo script semplicemente esegue chiamate API al server Express in esecuzione

// Dati di esempio per contatti italiani
const firstNames = [
  'Marco', 'Luca', 'Giuseppe', 'Paolo', 'Andrea', 'Francesca', 'Anna', 'Maria', 'Chiara', 'Alessia',
  'Sofia', 'Giulia', 'Matteo', 'Francesco', 'Davide', 'Elena', 'Laura', 'Sara', 'Valentina', 'Roberta'
];

const lastNames = [
  'Rossi', 'Bianchi', 'Verdi', 'Ferrari', 'Russo', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino',
  'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi'
];

const domainNames = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'libero.it', 'virgilio.it'
];

const companyDomains = [
  'azienda.it', 'company.com', 'enterprise.eu', 'business.it', 'corporate.com', 'tech.com'
];

const roles = [
  'CEO', 'Direttore Commerciale', 'Direttore Marketing', 'CFO', 'CTO',
  'Responsabile Vendite', 'Responsabile Acquisti', 'Responsabile IT', 'Responsabile HR'
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
  'Gestisce le risorse umane e il recruitment.'
];

const tags = [
  'vip', 'prospect', 'cliente', 'fornitore', 'partner', 'influencer', 'decisore', 
  'tecnico', 'finanza', 'marketing', 'vendite'
];

// Aziende esistenti nel sistema (estrapolate dai log della console)
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
  const prefixes = ['+39 3', '+39 33', '+39 34', '+39 35', '+39 36', '+39 37'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

// Funzione per generare un numero di telefono fisso italiano
function generateItalianLandline() {
  const prefixes = ['+39 0', '+39 01', '+39 02', '+39 03', '+39 04', '+39 05'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

// Funzione per generare un indirizzo italiano casuale
function generateItalianAddress() {
  const streetTypes = ['Via', 'Corso', 'Piazza', 'Viale', 'Largo'];
  const streetNames = ['Roma', 'Dante', 'Garibaldi', 'Mazzini', 'Verdi', 'Cavour'];
  const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Bologna', 'Firenze'];
  
  const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const streetNumber = Math.floor(Math.random() * 100) + 1;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const cap = Math.floor(Math.random() * 90000) + 10000;
  
  return `${streetType} ${streetName}, ${streetNumber}, ${cap} ${city}, Italia`;
}

// Funzione per generare tag casuali
function getRandomTags(max = 3) {
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
  console.log(`Iniziando creazione di ${count} contatti di test...`);
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const hasMiddleName = Math.random() > 0.7;
    const middleName = hasMiddleName ? firstNames[Math.floor(Math.random() * firstNames.length)] : "";
    
    // Determina quante aziende associare a questo contatto (1-2)
    const numCompanies = Math.floor(Math.random() * 2) + 1;
    const selectedCompanies = [];
    
    // Selezione casuale di aziende uniche
    const companiesCopy = [...companies];
    for (let j = 0; j < numCompanies && companiesCopy.length > 0; j++) {
      const randomIndex = Math.floor(Math.random() * companiesCopy.length);
      const company = companiesCopy.splice(randomIndex, 1)[0];
      
      selectedCompanies.push({
        companyId: company.id,
        companyName: company.name,
        isPrimary: j === 0, // La prima azienda è primaria
        role: roles[Math.floor(Math.random() * roles.length)],
        jobDescription: jobDescriptions[Math.floor(Math.random() * jobDescriptions.length)]
      });
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
      birthday: Math.random() > 0.5 ? new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : "",
      areasOfActivity: selectedCompanies,
      tags: getRandomTags(),
      notes: Math.random() > 0.3 ? `Note di contatto per ${firstName} ${lastName}. Questo è un contatto di test.` : "",
      status: Math.random() > 0.1 ? 'active' : 'inactive'
    };
    
    try {
      console.log(`Creazione contatto ${i+1}/${count}: ${firstName} ${lastName}`);
      
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Errore durante la creazione del contatto ${i+1}:`, errorText);
      } else {
        const data = await response.json();
        console.log(`Contatto ${i+1} creato con successo, ID: ${data.id}`);
      }
      
      // Pausa per evitare sovraccarichi
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Errore durante la creazione del contatto ${i+1}:`, error);
    }
  }
  
  console.log('Creazione contatti completata!');
}

// Esegui lo script
createTestContacts(30);