import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { contacts, areasOfActivity } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Configura il client DB
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

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

const tags = [
  'vip', 'prospect', 'cliente', 'fornitore', 'partner', 'influencer', 'decisore', 
  'tecnico', 'finanza', 'marketing', 'vendite'
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
  let created = 0;
  
  try {
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const hasMiddleName = Math.random() > 0.7;
      const middleName = hasMiddleName ? firstNames[Math.floor(Math.random() * firstNames.length)] : null;
      
      // Crea un'email personale
      const personalEmailDomain = domainNames[Math.floor(Math.random() * domainNames.length)];
      const personalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${personalEmailDomain}`;
      
      // Crea un'email aziendale
      const companyDomain = companyDomains[Math.floor(Math.random() * companyDomains.length)];
      const companyEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`;
      
      const now = new Date();
      
      // Prepara i dati del contatto
      const contactData = {
        firstName,
        lastName,
        middleName,
        companyEmail,
        privateEmail: personalEmail,
        mobilePhone: generateItalianPhone(),
        officePhone: generateItalianLandline(),
        address: generateItalianAddress(),
        birthday: Math.random() > 0.5 ? new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
        tags: getRandomTags(),
        notes: Math.random() > 0.3 ? `Note di contatto per ${firstName} ${lastName}. Questo è un contatto di test.` : null,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        updatedAt: now,
        createdAt: now
      };
      
      console.log(`Creazione contatto ${i+1}/${count}: ${firstName} ${lastName}`);
      
      // Inserisci il contatto nel database
      const [insertedContact] = await db.insert(contacts).values(contactData).returning();
      console.log(`Contatto ${i+1} creato con successo, ID: ${insertedContact.id}`);
      created++;
      
    }
    
    console.log(`Creazione contatti completata! ${created} contatti creati con successo.`);
  } catch (error) {
    console.error('Errore durante la creazione dei contatti:', error);
  } finally {
    // Chiudi la connessione al database
    await pool.end();
  }
}

// Esegui lo script
createTestContacts(30).catch(console.error);