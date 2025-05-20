import { db, pool } from './db';
import { PostgresStorage } from './postgresStorage';
import { 
  users, 
  contacts, 
  companies, 
  deals,
  pipelineStages,
  synergies,
  branches,
  emails,
  emailAccounts,
  leads,
  sectors,
  subSectors,
  jobTitles,
  contactEmails
} from '@shared/schema';
import bcrypt from 'bcrypt';

const storage = new PostgresStorage();

/**
 * Funzione che rimuove tutti i dati di test dal database
 */
export async function removeAllTestData() {
  console.log('Inizio rimozione di tutti i dati di test...');

  try {
    // Utilizziamo transazioni per garantire l'integrità dei dati
    await db.transaction(async (tx) => {
      // Rimozione in ordine inverso rispetto alle dipendenze
      console.log('Eliminazione emails...');
      await tx.delete(emails);

      console.log('Eliminazione contactEmails...');
      await tx.delete(contactEmails);

      console.log('Eliminazione synergies...');
      await tx.delete(synergies);

      console.log('Eliminazione deals...');
      await tx.delete(deals);

      console.log('Eliminazione leads...');
      await tx.delete(leads);

      console.log('Eliminazione branches...');
      await tx.delete(branches);

      console.log('Eliminazione contacts...');
      await tx.delete(contacts);

      console.log('Eliminazione companies...');
      await tx.delete(companies);

      console.log('Eliminazione pipelineStages...');
      await tx.delete(pipelineStages);

      console.log('Eliminazione jobTitles...');
      await tx.delete(jobTitles);

      console.log('Eliminazione subSectors...');
      await tx.delete(subSectors);

      console.log('Eliminazione sectors...');
      await tx.delete(sectors);

      console.log('Eliminazione emailAccounts...');
      await tx.delete(emailAccounts);

      // Non eliminiamo gli utenti perché potrebbe esserci l'utente admin
      // che deve rimanere per accedere al sistema
    });

    console.log('Rimozione dati completata con successo!');
    return true;
  } catch (error) {
    console.error('Errore durante la rimozione dei dati:', error);
    return false;
  }
}

/**
 * Genera dati di test per tutti i moduli
 */
export async function generateTestData() {
  console.log('Inizio generazione dati di test...');

  try {
    // 1. Creiamo l'utente admin se non esiste
    const adminUser = await ensureAdminUserExists();
    console.log(`Utente admin creato/verificato con ID: ${adminUser.id}`);

    // 2. Creiamo un account email per i test se non esiste già
    const emailAccount = await createTestEmailAccount(adminUser.id);
    console.log(`Account email creato con ID: ${emailAccount.id}`);

    // 3. Creiamo i settori e sotto-settori
    const sectorsData = await createSectorsAndSubSectors();
    console.log(`Creati ${sectorsData.sectors.length} settori e ${sectorsData.subSectors.length} sotto-settori`);

    // 4. Creiamo le qualifiche lavorative (job titles)
    const jobTitlesData = await createJobTitles();
    console.log(`Create ${jobTitlesData.length} qualifiche lavorative`);

    // 5. Creiamo gli stage della pipeline
    const stagesData = await createPipelineStages();
    console.log(`Creati ${stagesData.length} stage della pipeline`);

    // 6. Creiamo le aziende di test
    const companiesData = await createTestCompanies();
    console.log(`Create ${companiesData.length} aziende`);

    // 7. Creiamo le filiali per alcune aziende
    const branchesData = await createTestBranches(companiesData);
    console.log(`Create ${branchesData.length} filiali`);

    // 8. Creiamo i contatti di test
    const contactsData = await createTestContacts(companiesData, sectorsData.subSectors, jobTitlesData);
    console.log(`Creati ${contactsData.length} contatti`);

    // 9. Creiamo le opportunità (deals)
    const dealsData = await createTestDeals(contactsData, companiesData, stagesData);
    console.log(`Create ${dealsData.length} opportunità`);

    // 10. Creiamo le sinergie tra contatti
    const synergiesData = await createTestSynergies(contactsData);
    console.log(`Create ${synergiesData.length} sinergie`);

    // 11. Creiamo i lead di test
    const leadsData = await createTestLeads(sectorsData.subSectors);
    console.log(`Creati ${leadsData.length} lead`);

    // 12. Creiamo le email di test
    const emailsData = await createTestEmails(contactsData, emailAccount.id);
    console.log(`Create ${emailsData.length} email`);

    console.log('Generazione dati di test completata con successo!');
    return true;
  } catch (error) {
    console.error('Errore durante la generazione dei dati di test:', error);
    return false;
  }
}

/**
 * Assicura che esista un utente admin nel sistema
 */
async function ensureAdminUserExists() {
  // Verifica se l'utente admin esiste già
  let admin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, 'admin')
  });

  if (!admin) {
    // Crea l'utente admin se non esiste
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [newAdmin] = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@experviser.com',
      fullName: 'Amministratore',
      role: 'super_admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    }).returning();
    
    admin = newAdmin;
  }

  return admin;
}

/**
 * Crea un account email di test
 */
async function createTestEmailAccount(userId: number) {
  // Verifica se esiste già un account email per l'utente
  let account = await db.query.emailAccounts.findFirst({
    where: (emailAccounts, { eq }) => eq(emailAccounts.userId, userId)
  });

  if (!account) {
    // Crea un nuovo account email
    const [newAccount] = await db.insert(emailAccounts).values({
      userId: userId,
      name: 'Account Principale',
      email: 'info@experviser.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      imapUsername: 'info@experviser.com',
      imapPassword: 'password_sicura',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      smtpUsername: 'info@experviser.com',
      smtpPassword: 'password_sicura',
      provider: 'generic',
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    account = newAccount;
  }

  return account;
}

/**
 * Crea settori e sotto-settori di test
 */
async function createSectorsAndSubSectors() {
  const sectorsList = [
    { name: 'Information Technology', description: 'Aziende che si occupano di tecnologia' },
    { name: 'Finance', description: 'Aziende del settore finanziario' },
    { name: 'Healthcare', description: 'Aziende del settore sanitario' },
    { name: 'Education', description: 'Settore dell\'istruzione' },
    { name: 'Manufacturing', description: 'Settore manifatturiero' },
    { name: 'Retail', description: 'Vendita al dettaglio' }
  ];

  const sectorsData = [];
  for (const sector of sectorsList) {
    const [insertedSector] = await db.insert(sectors).values(sector).returning();
    sectorsData.push(insertedSector);
  }

  const subSectorsList = [
    // IT
    { name: 'Software Development', sectorId: sectorsData[0].id, description: 'Sviluppo software' },
    { name: 'IT Consulting', sectorId: sectorsData[0].id, description: 'Consulenza IT' },
    { name: 'Cloud Services', sectorId: sectorsData[0].id, description: 'Servizi cloud' },
    // Finance
    { name: 'Banking', sectorId: sectorsData[1].id, description: 'Servizi bancari' },
    { name: 'Insurance', sectorId: sectorsData[1].id, description: 'Assicurazioni' },
    { name: 'Investment', sectorId: sectorsData[1].id, description: 'Investimenti' },
    // Healthcare
    { name: 'Hospitals', sectorId: sectorsData[2].id, description: 'Ospedali' },
    { name: 'Pharmaceuticals', sectorId: sectorsData[2].id, description: 'Farmaceutica' },
    // Education
    { name: 'Higher Education', sectorId: sectorsData[3].id, description: 'Istruzione superiore' },
    { name: 'EdTech', sectorId: sectorsData[3].id, description: 'Tecnologia educativa' },
    // Manufacturing
    { name: 'Automotive', sectorId: sectorsData[4].id, description: 'Automotive' },
    { name: 'Electronics', sectorId: sectorsData[4].id, description: 'Elettronica' },
    // Retail
    { name: 'E-commerce', sectorId: sectorsData[5].id, description: 'Commercio elettronico' },
    { name: 'Fashion', sectorId: sectorsData[5].id, description: 'Moda' }
  ];

  const subSectorsData = [];
  for (const subSector of subSectorsList) {
    const [insertedSubSector] = await db.insert(subSectors).values(subSector).returning();
    subSectorsData.push(insertedSubSector);
  }

  return { sectors: sectorsData, subSectors: subSectorsData };
}

/**
 * Crea qualifiche lavorative di test
 */
async function createJobTitles() {
  const jobTitlesList = [
    { name: 'CEO', description: 'Chief Executive Officer' },
    { name: 'CTO', description: 'Chief Technology Officer' },
    { name: 'CFO', description: 'Chief Financial Officer' },
    { name: 'COO', description: 'Chief Operating Officer' },
    { name: 'HR Manager', description: 'Human Resources Manager' },
    { name: 'IT Manager', description: 'Information Technology Manager' },
    { name: 'Marketing Manager', description: 'Marketing Manager' },
    { name: 'Sales Manager', description: 'Sales Manager' },
    { name: 'Project Manager', description: 'Project Manager' },
    { name: 'Software Developer', description: 'Software Developer' },
    { name: 'Data Analyst', description: 'Data Analyst' },
    { name: 'UX Designer', description: 'User Experience Designer' }
  ];

  const jobTitlesData = [];
  for (const jobTitle of jobTitlesList) {
    const [insertedJobTitle] = await db.insert(jobTitles).values(jobTitle).returning();
    jobTitlesData.push(insertedJobTitle);
  }

  return jobTitlesData;
}

/**
 * Crea stage della pipeline di test
 */
async function createPipelineStages() {
  const stagesList = [
    { name: 'Contatto Iniziale', description: 'Primo contatto con il cliente', color: '#3498db', position: 1 },
    { name: 'Qualificazione', description: 'Valutazione delle esigenze del cliente', color: '#2ecc71', position: 2 },
    { name: 'Presentazione', description: 'Presentazione della proposta', color: '#f1c40f', position: 3 },
    { name: 'Negoziazione', description: 'Discussione dei termini', color: '#e67e22', position: 4 },
    { name: 'Chiusura', description: 'Finalizzazione dell\'accordo', color: '#e74c3c', position: 5 }
  ];

  const stagesData = [];
  for (const stage of stagesList) {
    const [insertedStage] = await db.insert(pipelineStages).values(stage).returning();
    stagesData.push(insertedStage);
  }

  return stagesData;
}

/**
 * Crea aziende di test
 */
async function createTestCompanies() {
  const companiesList = [
    {
      name: 'TechSolutions S.r.l.',
      email: 'info@techsolutions.it',
      phone: '+39 02 12345678',
      website: 'https://www.techsolutions.it',
      industry: 'Information Technology',
      location: 'Via Roma 123, Milano, Italia',
      employeeCount: '51-200',
      annualRevenue: '1-10M',
      founded: '2010',
      tags: ['IT', 'Consulenza', 'Software'],
      notes: 'Azienda specializzata in soluzioni IT per PMI',
      customFields: JSON.stringify({
        vatNumber: 'IT12345678901',
        registrationNumber: 'MI-123456',
        socialMediaHandles: {
          linkedin: 'techsolutions-srl',
          twitter: '@techsolutions'
        }
      })
    },
    {
      name: 'Banca Innovativa',
      email: 'info@bancainnovativa.it',
      phone: '+39 06 87654321',
      website: 'https://www.bancainnovativa.it',
      industry: 'Finance',
      location: 'Piazza Affari 1, Milano, Italia',
      employeeCount: '201-500',
      annualRevenue: '10-50M',
      founded: '1998',
      tags: ['Finanza', 'Investimenti', 'Banking'],
      notes: 'Banca specializzata in servizi digitali',
      customFields: JSON.stringify({
        vatNumber: 'IT98765432101',
        registrationNumber: 'MI-654321',
        regulatoryInfo: 'Autorizzata da Banca d\'Italia'
      })
    },
    {
      name: 'Ospedale San Raffaele',
      email: 'info@sanraffaele.it',
      phone: '+39 02 26431',
      website: 'https://www.sanraffaele.it',
      industry: 'Healthcare',
      location: 'Via Olgettina 60, Milano, Italia',
      employeeCount: '1000+',
      annualRevenue: '50-100M',
      founded: '1971',
      tags: ['Sanità', 'Ricerca', 'Eccellenza'],
      notes: 'Ospedale e centro di ricerca di eccellenza',
      customFields: JSON.stringify({
        accreditations: ['JCI', 'ISO 9001'],
        specialties: ['Cardiologia', 'Neurologia', 'Oncologia']
      })
    },
    {
      name: 'Università di Milano',
      email: 'info@unimi.it',
      phone: '+39 02 50312100',
      website: 'https://www.unimi.it',
      industry: 'Education',
      location: 'Via Festa del Perdono 7, Milano, Italia',
      employeeCount: '1000+',
      annualRevenue: '100-500M',
      founded: '1924',
      tags: ['Istruzione', 'Ricerca', 'Università'],
      notes: 'Una delle più grandi università italiane',
      customFields: JSON.stringify({
        programs: ['Scienze', 'Medicina', 'Giurisprudenza', 'Economia'],
        internationalRanking: 'Top 300'
      })
    },
    {
      name: 'AutoItalia S.p.A.',
      email: 'info@autoitalia.it',
      phone: '+39 011 12345678',
      website: 'https://www.autoitalia.it',
      industry: 'Manufacturing',
      location: 'Corso Agnelli 200, Torino, Italia',
      employeeCount: '1000+',
      annualRevenue: '500M+',
      founded: '1980',
      tags: ['Auto', 'Produzione', 'Made in Italy'],
      notes: 'Produttore di auto di lusso italiano',
      customFields: JSON.stringify({
        factories: ['Torino', 'Modena', 'Cassino'],
        brands: ['Luxury', 'Sport', 'City']
      })
    },
    {
      name: 'ModaItaliana S.r.l.',
      email: 'info@modaitaliana.it',
      phone: '+39 02 98765432',
      website: 'https://www.modaitaliana.it',
      industry: 'Retail',
      location: 'Via Montenapoleone 8, Milano, Italia',
      employeeCount: '51-200',
      annualRevenue: '10-50M',
      founded: '2005',
      tags: ['Moda', 'Lusso', 'Design'],
      notes: 'Brand di moda italiana di fascia alta',
      customFields: JSON.stringify({
        stores: ['Milano', 'Roma', 'Firenze', 'Parigi', 'New York'],
        collections: ['Primavera/Estate', 'Autunno/Inverno']
      })
    },
    {
      name: 'CloudServices Italia',
      email: 'info@cloudservices.it',
      phone: '+39 06 11223344',
      website: 'https://www.cloudservices.it',
      industry: 'Information Technology',
      location: 'Via dell\'Innovazione 5, Roma, Italia',
      employeeCount: '11-50',
      annualRevenue: '1-10M',
      founded: '2015',
      tags: ['Cloud', 'SaaS', 'Hosting'],
      notes: 'Provider di servizi cloud per aziende',
      customFields: JSON.stringify({
        datacenters: ['Milano', 'Roma', 'Francoforte'],
        certifications: ['ISO 27001', 'GDPR Compliant']
      })
    },
    {
      name: 'Scuola Innovativa',
      email: 'info@scuolainnovativa.it',
      phone: '+39 055 55667788',
      website: 'https://www.scuolainnovativa.it',
      industry: 'Education',
      location: 'Via dell\'Istruzione 10, Firenze, Italia',
      employeeCount: '11-50',
      annualRevenue: '1-10M',
      founded: '2018',
      tags: ['Istruzione', 'EdTech', 'Innovazione'],
      notes: 'Scuola privata con approccio tecnologico',
      customFields: JSON.stringify({
        programs: ['STEM', 'Lingue', 'Arte Digitale'],
        partnerships: ['Google for Education', 'Microsoft Education']
      })
    }
  ];

  const companiesData = [];
  for (const company of companiesList) {
    const [insertedCompany] = await db.insert(companies).values({
      ...company,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    companiesData.push(insertedCompany);
  }

  return companiesData;
}

/**
 * Crea filiali di test
 */
async function createTestBranches(companiesData: any[]) {
  // Creiamo filiali solo per alcune aziende
  const branchesList = [
    {
      companyId: companiesData[0].id,
      name: 'TechSolutions Milano',
      type: 'headquarters',
      address: 'Via Roma 123',
      city: 'Milano',
      region: 'Lombardia',
      postalCode: '20123',
      country: 'Italia',
      phone: '+39 02 12345678',
      email: 'milano@techsolutions.it',
      description: 'Sede principale',
      isHeadquarters: true,
      customFields: JSON.stringify({
        employeeCount: 120,
        departments: ['Administration', 'Sales', 'Development']
      }),
      managers: JSON.stringify([
        { name: 'Marco Rossi', role: 'General Manager' },
        { name: 'Laura Bianchi', role: 'HR Director' }
      ])
    },
    {
      companyId: companiesData[0].id,
      name: 'TechSolutions Roma',
      type: 'branch',
      address: 'Via Nazionale 45',
      city: 'Roma',
      region: 'Lazio',
      postalCode: '00184',
      country: 'Italia',
      phone: '+39 06 98765432',
      email: 'roma@techsolutions.it',
      description: 'Filiale di Roma',
      isHeadquarters: false,
      customFields: JSON.stringify({
        employeeCount: 35,
        departments: ['Sales', 'Support']
      }),
      managers: JSON.stringify([
        { name: 'Antonio Verdi', role: 'Branch Manager' }
      ])
    },
    {
      companyId: companiesData[1].id,
      name: 'Banca Innovativa - Sede Centrale',
      type: 'headquarters',
      address: 'Piazza Affari 1',
      city: 'Milano',
      region: 'Lombardia',
      postalCode: '20123',
      country: 'Italia',
      phone: '+39 06 87654321',
      email: 'sede@bancainnovativa.it',
      description: 'Sede centrale della banca',
      isHeadquarters: true,
      customFields: JSON.stringify({
        employeeCount: 250,
        securityLevel: 'Massimo',
        departments: ['Direzione', 'Corporate', 'Retail', 'IT']
      }),
      managers: JSON.stringify([
        { name: 'Giuseppe Neri', role: 'Direttore Generale' },
        { name: 'Maria Verdi', role: 'CFO' }
      ])
    },
    {
      companyId: companiesData[1].id,
      name: 'Banca Innovativa - Filiale Torino',
      type: 'branch',
      address: 'Corso Francia 123',
      city: 'Torino',
      region: 'Piemonte',
      postalCode: '10138',
      country: 'Italia',
      phone: '+39 011 2233445',
      email: 'torino@bancainnovativa.it',
      description: 'Filiale di Torino',
      isHeadquarters: false,
      customFields: JSON.stringify({
        employeeCount: 45,
        securityLevel: 'Alto',
        services: ['Retail', 'Private Banking']
      }),
      managers: JSON.stringify([
        { name: 'Carlo Gialli', role: 'Direttore Filiale' }
      ])
    }
  ];

  const branchesData = [];
  for (const branch of branchesList) {
    const [insertedBranch] = await db.insert(branches).values({
      ...branch,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    branchesData.push(insertedBranch);
  }

  return branchesData;
}

/**
 * Crea contatti di test
 */
async function createTestContacts(companiesData: any[], subSectorsData: any[], jobTitlesData: any[]) {
  // Funzione di utilità per generare numeri di telefono italiani casuali
  const generateItalianPhone = () => {
    const prefixes = ['+39 320', '+39 330', '+39 340', '+39 350', '+39 360', '+39 370', '+39 380', '+39 390'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    return `${randomPrefix} ${randomNumber}`;
  };

  // Funzione per generare un indirizzo italiano casuale
  const generateItalianAddress = () => {
    const streets = ['Via Roma', 'Via Milano', 'Via Napoli', 'Via Torino', 'Via Firenze', 'Corso Italia', 'Piazza Duomo', 'Via Garibaldi', 'Via Dante', 'Corso Vittorio Emanuele'];
    const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Firenze', 'Bologna', 'Venezia', 'Genova', 'Palermo', 'Bari'];
    const regions = ['Lombardia', 'Lazio', 'Campania', 'Piemonte', 'Toscana', 'Emilia-Romagna', 'Veneto', 'Liguria', 'Sicilia', 'Puglia'];
    
    const street = streets[Math.floor(Math.random() * streets.length)];
    const streetNumber = Math.floor(1 + Math.random() * 100);
    const city = cities[Math.floor(Math.random() * cities.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const postalCode = Math.floor(10000 + Math.random() * 90000);
    
    return {
      street: `${street} ${streetNumber}`,
      city,
      region,
      postalCode: `${postalCode}`,
      country: 'Italia'
    };
  };

  // Funzione per generare tag casuali
  const getRandomTags = (max = 3) => {
    const allTags = ['VIP', 'Prospect', 'Customer', 'Partner', 'Supplier', 'Influencer', 'Investor', 'Lead', 'Hot Lead', 'Cold Lead', 'Referred', 'Conference'];
    const tagsCount = Math.floor(Math.random() * max) + 1;
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, tagsCount);
  };

  const contactsList = [];

  // Per ogni azienda, creiamo alcuni contatti
  for (const company of companiesData) {
    // Numero casuale di contatti per azienda (2-5)
    const contactsCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < contactsCount; i++) {
      const subSector = subSectorsData[Math.floor(Math.random() * subSectorsData.length)];
      const jobTitle = jobTitlesData[Math.floor(Math.random() * jobTitlesData.length)];
      const address = generateItalianAddress();
      
      // Decidiamo casualmente se questo contatto sarà collegato all'azienda
      const isCompanyContact = Math.random() > 0.3;
      
      contactsList.push({
        firstName: ['Mario', 'Luigi', 'Giovanni', 'Paolo', 'Alessandro', 'Francesco', 'Roberto', 'Laura', 'Giulia', 'Francesca', 'Valentina', 'Chiara'][Math.floor(Math.random() * 12)],
        lastName: ['Rossi', 'Bianchi', 'Verdi', 'Russo', 'Ferrari', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno'][Math.floor(Math.random() * 12)],
        email: `contatto${contactsList.length + 1}@example.com`,
        phone: generateItalianPhone(),
        jobTitle: jobTitle.name,
        companyId: isCompanyContact ? company.id : null,
        companyName: isCompanyContact ? company.name : ['Freelance', 'Self-employed', 'Consultant', ''][Math.floor(Math.random() * 4)],
        street: address.street,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        country: address.country,
        tags: getRandomTags(),
        notes: `Contatto ${i + 1} ${isCompanyContact ? 'dell\'azienda '+company.name : 'indipendente'}`,
        status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
        source: ['Referral', 'Website', 'Event', 'Cold Call', 'Social Media'][Math.floor(Math.random() * 5)],
        subSectorId: subSector.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // Aggiungiamo anche contatti non associati ad aziende
  for (let i = 0; i < 10; i++) {
    const subSector = subSectorsData[Math.floor(Math.random() * subSectorsData.length)];
    const jobTitle = jobTitlesData[Math.floor(Math.random() * jobTitlesData.length)];
    const address = generateItalianAddress();
    
    contactsList.push({
      firstName: ['Antonio', 'Marco', 'Luca', 'Davide', 'Simone', 'Andrea', 'Sara', 'Elena', 'Alessandra', 'Maria', 'Anna', 'Paola'][Math.floor(Math.random() * 12)],
      lastName: ['Conti', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Caruso', 'Ferraro', 'Santoro'][Math.floor(Math.random() * 12)],
      email: `indipendente${i + 1}@example.com`,
      phone: generateItalianPhone(),
      jobTitle: jobTitle.name,
      companyId: null,
      companyName: ['Freelance', 'Self-employed', 'Consultant', ''][Math.floor(Math.random() * 4)],
      street: address.street,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      tags: getRandomTags(),
      notes: `Contatto indipendente ${i + 1}`,
      status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
      source: ['Referral', 'Website', 'Event', 'Cold Call', 'Social Media'][Math.floor(Math.random() * 5)],
      subSectorId: subSector.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const contactsData = [];
  for (const contact of contactsList) {
    const [insertedContact] = await db.insert(contacts).values(contact).returning();
    contactsData.push(insertedContact);
    
    // Per ogni contatto, creamo anche un'associazione alla email
    await db.insert(contactEmails).values({
      contactId: insertedContact.id,
      email: insertedContact.email,
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return contactsData;
}

/**
 * Crea opportunità (deal) di test
 */
async function createTestDeals(contactsData: any[], companiesData: any[], stagesData: any[]) {
  const dealsList = [];
  
  // Generiamo alcune opportunità con contatti e aziende
  for (let i = 0; i < 20; i++) {
    // Seleziona casualmente un contatto e un'azienda
    const contact = contactsData[Math.floor(Math.random() * contactsData.length)];
    const company = companiesData[Math.floor(Math.random() * companiesData.length)];
    const stage = stagesData[Math.floor(Math.random() * stagesData.length)];
    
    // Genera una data di chiusura attesa (tra 1 e 90 giorni da oggi)
    const expectedCloseDate = new Date();
    expectedCloseDate.setDate(expectedCloseDate.getDate() + Math.floor(Math.random() * 90) + 1);
    
    // Genera un valore casuale tra 1.000€ e 100.000€
    const value = (Math.floor(Math.random() * 99) + 1) * 1000;
    
    dealsList.push({
      name: `Opportunità ${i + 1}`,
      contactId: contact.id,
      companyId: company.id,
      stageId: stage.id,
      value: value.toString(),
      status: ['active', 'won', 'lost'][Math.floor(Math.random() * 3)],
      notes: `Opportunità di vendita con ${contact.firstName} ${contact.lastName} di ${company.name}`,
      tags: ['Priority', 'Q2', 'Upsell', 'New Business'][Math.floor(Math.random() * 4)].split(' '),
      expectedCloseDate: expectedCloseDate.toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const dealsData = [];
  for (const deal of dealsList) {
    const [insertedDeal] = await db.insert(deals).values(deal).returning();
    dealsData.push(insertedDeal);
  }

  return dealsData;
}

/**
 * Crea sinergie di test tra contatti
 */
async function createTestSynergies(contactsData: any[]) {
  const synergiesList = [];
  
  // Creiamo alcune sinergie tra contatti
  for (let i = 0; i < 15; i++) {
    // Seleziona due contatti diversi casualmente
    let contactIndex1 = Math.floor(Math.random() * contactsData.length);
    let contactIndex2 = Math.floor(Math.random() * contactsData.length);
    
    // Assicurati che siano diversi
    while (contactIndex1 === contactIndex2) {
      contactIndex2 = Math.floor(Math.random() * contactsData.length);
    }
    
    const contact1 = contactsData[contactIndex1];
    const contact2 = contactsData[contactIndex2];
    
    synergiesList.push({
      contactId1: contact1.id,
      contactId2: contact2.id,
      relationship: ['Colleague', 'Friend', 'Family', 'Business Partner', 'Mentor'][Math.floor(Math.random() * 5)],
      notes: `Relazione tra ${contact1.firstName} ${contact1.lastName} e ${contact2.firstName} ${contact2.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const synergiesData = [];
  for (const synergy of synergiesList) {
    const [insertedSynergy] = await db.insert(synergies).values(synergy).returning();
    synergiesData.push(insertedSynergy);
  }

  return synergiesData;
}

/**
 * Crea lead di test
 */
async function createTestLeads(subSectorsData: any[]) {
  const leadsList = [];
  
  for (let i = 0; i < 12; i++) {
    const subSector = subSectorsData[Math.floor(Math.random() * subSectorsData.length)];
    
    leadsList.push({
      name: `Lead ${i + 1}`,
      email: `lead${i + 1}@example.com`,
      phone: `+39 ${Math.floor(300000000 + Math.random() * 699999999)}`,
      company: `Azienda Lead ${i + 1}`,
      jobTitle: ['CEO', 'CTO', 'Marketing Manager', 'Sales Director', 'HR Manager'][Math.floor(Math.random() * 5)],
      source: ['Website', 'Cold Call', 'Event', 'Referral', 'Social Media'][Math.floor(Math.random() * 5)],
      status: ['new', 'contacted', 'qualified', 'converted', 'lost'][Math.floor(Math.random() * 5)],
      leadScore: Math.floor(Math.random() * 100),
      assignedTo: 1, // Assegnato all'utente admin
      notes: `Note per il lead ${i + 1}`,
      tags: ['Priority', 'Follow-up', 'Hot', 'Cold'][Math.floor(Math.random() * 4)].split(' '),
      subSectorId: subSector.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const leadsData = [];
  for (const lead of leadsList) {
    const [insertedLead] = await db.insert(leads).values(lead).returning();
    leadsData.push(insertedLead);
  }

  return leadsData;
}

/**
 * Crea email di test
 */
async function createTestEmails(contactsData: any[], accountId: number) {
  const emailsList = [];
  
  // Seleziona alcuni contatti per creare delle email di test
  const selectedContacts = contactsData.slice(0, 10);
  
  for (const contact of selectedContacts) {
    // Email ricevuta dal contatto
    emailsList.push({
      accountId,
      from: contact.email,
      fromName: `${contact.firstName} ${contact.lastName}`,
      to: ['info@experviser.com'],
      subject: `Richiesta informazioni da ${contact.firstName} ${contact.lastName}`,
      body: `<p>Gentile Experviser,</p><p>sono interessato ai vostri servizi. Potrebbe inviarmi maggiori informazioni?</p><p>Cordiali saluti,<br>${contact.firstName} ${contact.lastName}</p>`,
      date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Data casuale negli ultimi 7 giorni
      isRead: Math.random() > 0.5, // Casualmente letta o non letta
      hasAttachments: false,
      folder: 'inbox',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Email inviata al contatto
    emailsList.push({
      accountId,
      from: 'info@experviser.com',
      fromName: 'Experviser CRM',
      to: [contact.email],
      subject: `RE: Richiesta informazioni da ${contact.firstName} ${contact.lastName}`,
      body: `<p>Gentile ${contact.firstName} ${contact.lastName},</p><p>grazie per l'interesse nei nostri servizi. Alleghiamo la brochure con tutte le informazioni richieste.</p><p>Restiamo a disposizione per qualsiasi chiarimento.</p><p>Cordiali saluti,<br>Team Experviser</p>`,
      date: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)), // Data casuale negli ultimi 5 giorni
      isRead: true,
      hasAttachments: true,
      folder: 'sent',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const emailsData = [];
  for (const email of emailsList) {
    const [insertedEmail] = await db.insert(emails).values(email).returning();
    emailsData.push(insertedEmail);
  }

  return emailsData;
}

/**
 * Funzione principale che pulisce e reinizializza i dati di test
 */
export async function resetAndGenerateTestData() {
  console.log('Inizio reset e generazione dati di test...');
  
  // 1. Rimozione di tutti i dati esistenti
  const removed = await removeAllTestData();
  if (!removed) {
    console.error('Errore durante la rimozione dei dati esistenti');
    return false;
  }
  
  // 2. Generazione nuovi dati di test
  const generated = await generateTestData();
  if (!generated) {
    console.error('Errore durante la generazione dei nuovi dati di test');
    return false;
  }
  
  console.log('Reset e generazione dati di test completati con successo!');
  return true;
}