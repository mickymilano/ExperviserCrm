/**
 * Script per creare dati di seed iniziali dopo la pulizia del database
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

import {
  companies, contacts, areasOfActivity, leads, deals,
  pipelineStages, contactEmails, contactEmailTypeEnum
} from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function createSeedData() {
  try {
    console.log('='.repeat(50));
    console.log('AVVIO CREAZIONE DATI DI SEED');
    console.log('='.repeat(50));
    
    // Recupera le fasi della pipeline esistenti
    const stages = await db.select().from(pipelineStages);
    if (stages.length === 0) {
      console.error('Errore: Le fasi della pipeline non esistono. Eseguire prima initPostgresDb.ts');
      return;
    }
    
    // Crea aziende di test
    console.log('Creazione aziende di test...');
    const company1 = await db.insert(companies).values({
      name: "FranchisingPlus SpA",
      industry: "Franchising",
      website: "https://franchisingplus.it",
      email: "info@franchisingplus.it",
      phone: "+39 02 1234567",
      address: "Via Roma 123, Milano",
      tags: ["franchising", "retail"],
      notes: "Azienda di franchising attiva nel settore retail",
      status: "active",
      isActiveRep: true,
      companyType: "basket_company_franchisor",
      brands: ["Brand1", "Brand2"],
      channels: ["retail", "online"],
      productsOrServicesTags: ["franchise", "consulting"],
      locationTypes: ["urban", "mall"]
    }).returning();
    
    const company2 = await db.insert(companies).values({
      name: "Ristoranti Italiani Srl",
      industry: "Ristorazione",
      website: "https://ristorantiitaliani.it",
      email: "info@ristorantiitaliani.it",
      phone: "+39 06 7654321",
      address: "Via Veneto 456, Roma",
      tags: ["ristorazione", "food"],
      notes: "Catena di ristoranti italiani",
      status: "active",
      isActiveRep: false,
      companyType: "independent",
      brands: ["RistoItaliano"],
      channels: ["physical"],
      productsOrServicesTags: ["food", "catering"],
      locationTypes: ["urban", "mall", "travel"]
    }).returning();
    
    console.log(`✓ Create ${company1.length + company2.length} aziende di test`);
    
    // Crea contatti di test
    console.log('Creazione contatti di test...');
    const contact1 = await db.insert(contacts).values({
      firstName: "Marco",
      lastName: "Rossi",
      mobilePhone: "+39 333 1234567",
      companyEmail: "", // Svuotato per migrazione a contact_emails
      privateEmail: "", // Svuotato per migrazione a contact_emails
      officePhone: "+39 02 1234567",
      privatePhone: "",
      linkedin: "https://linkedin.com/in/marcorossi",
      tags: ["vip", "decision maker"],
      notes: "CEO di FranchisingPlus",
      status: "active",
      roles: ["executive", "board member"]
    }).returning();
    
    const contact2 = await db.insert(contacts).values({
      firstName: "Laura",
      lastName: "Bianchi",
      mobilePhone: "+39 335 9876543",
      companyEmail: "", // Svuotato per migrazione a contact_emails
      privateEmail: "", // Svuotato per migrazione a contact_emails
      officePhone: "+39 02 1234568",
      privatePhone: "",
      linkedin: "https://linkedin.com/in/laurabianchi",
      tags: ["marketing", "franchising"],
      notes: "Direttore Marketing di FranchisingPlus",
      status: "active",
      roles: ["marketing", "management"]
    }).returning();
    
    const contact3 = await db.insert(contacts).values({
      firstName: "Giuseppe",
      lastName: "Verdi",
      mobilePhone: "+39 338 1122334",
      companyEmail: "", // Svuotato per migrazione a contact_emails
      privateEmail: "", // Svuotato per migrazione a contact_emails
      officePhone: "+39 06 7654322",
      privatePhone: "",
      linkedin: "https://linkedin.com/in/giuseppeverdi",
      tags: ["ristorazione", "chef"],
      notes: "Responsabile sviluppo di Ristoranti Italiani",
      status: "active",
      roles: ["operations", "business development"]
    }).returning();
    
    console.log(`✓ Creati ${contact1.length + contact2.length + contact3.length} contatti di test`);
    
    // Crea email di contatto
    console.log('Creazione email di contatto...');
    
    // Email per il primo contatto
    await db.insert(contactEmails).values({
      contactId: contact1[0].id,
      emailAddress: "marco.rossi@franchisingplus.it",
      type: "work",
      isPrimary: true,
      status: "active"
    });
    
    await db.insert(contactEmails).values({
      contactId: contact1[0].id,
      emailAddress: "marco.rossi@gmail.com",
      type: "personal",
      isPrimary: false,
      status: "active"
    });
    
    // Email per il secondo contatto
    await db.insert(contactEmails).values({
      contactId: contact2[0].id,
      emailAddress: "laura.bianchi@franchisingplus.it",
      type: "work",
      isPrimary: true,
      status: "active"
    });
    
    // Email per il terzo contatto
    await db.insert(contactEmails).values({
      contactId: contact3[0].id,
      emailAddress: "giuseppe.verdi@ristorantiitaliani.it",
      type: "work",
      isPrimary: true,
      status: "active"
    });
    
    await db.insert(contactEmails).values({
      contactId: contact3[0].id,
      emailAddress: "g.verdi@hotmail.com",
      type: "personal",
      isPrimary: false,
      status: "active"
    });
    
    console.log('✓ Create 5 email di contatto');
    
    // Crea aree di attività (associazione contatti-aziende)
    console.log('Creazione aree di attività...');
    
    await db.insert(areasOfActivity).values({
      contactId: contact1[0].id,
      companyId: company1[0].id,
      companyName: company1[0].name,
      jobDescription: "Amministratore Delegato",
      role: "CEO",
      isPrimary: true
    });
    
    await db.insert(areasOfActivity).values({
      contactId: contact2[0].id,
      companyId: company1[0].id,
      companyName: company1[0].name,
      jobDescription: "Direttore Marketing",
      role: "CMO",
      isPrimary: true
    });
    
    await db.insert(areasOfActivity).values({
      contactId: contact3[0].id,
      companyId: company2[0].id,
      companyName: company2[0].name,
      jobDescription: "Responsabile sviluppo",
      role: "Direttore Sviluppo",
      isPrimary: true
    });
    
    console.log('✓ Create 3 aree di attività');
    
    // Crea lead di test
    console.log('Creazione lead di test...');
    
    await db.insert(leads).values({
      firstName: "Anna",
      lastName: "Neri",
      companyName: "Retail Solutions",
      role: "Direttore Commerciale",
      mobilePhone: "+39 340 1234567",
      companyEmail: "anna.neri@retailsolutions.it",
      source: "LinkedIn",
      status: "new",
      notes: "Interessata a soluzioni di franchising"
    });
    
    await db.insert(leads).values({
      firstName: "Paolo",
      lastName: "Gialli",
      companyName: "Food Innovation",
      role: "Fondatore",
      mobilePhone: "+39 342 7654321",
      companyEmail: "paolo.gialli@foodinnovation.it",
      source: "Referral",
      status: "qualified",
      notes: "Ha una catena di ristoranti in espansione"
    });
    
    console.log('✓ Creati 2 lead di test');
    
    // Crea deal di test
    console.log('Creazione deal di test...');
    
    await db.insert(deals).values({
      name: "Consulenza strategica FranchisingPlus",
      value: 15000,
      stageId: stages[1].id, // Seconda fase (qualifica)
      contactId: contact1[0].id,
      companyId: company1[0].id,
      expectedCloseDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 giorni da oggi
      notes: "Proposta di consulenza strategica per l'espansione della rete",
      tags: ["franchising", "consulenza", "strategia"],
      status: "active",
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 giorni da oggi
    });
    
    await db.insert(deals).values({
      name: "Ristrutturazione menu Ristoranti Italiani",
      value: 8000,
      stageId: stages[3].id, // Quarta fase (proposta)
      contactId: contact3[0].id,
      companyId: company2[0].id,
      expectedCloseDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)), // 15 giorni da oggi
      notes: "Ristrutturazione completa del menu e identity della catena",
      tags: ["ristorazione", "menu", "brand"],
      status: "active",
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)) // 3 giorni da oggi
    });
    
    console.log('✓ Creati 2 deal di test');
    
    console.log('='.repeat(50));
    console.log('CREAZIONE DATI DI SEED COMPLETATA CON SUCCESSO');
    console.log('='.repeat(50));
    console.log('Dati creati:');
    console.log('- 2 aziende (una Active Rep, una standard)');
    console.log('- 3 contatti con 5 email');
    console.log('- 3 aree di attività (relazioni contatti-aziende)');
    console.log('- 2 lead');
    console.log('- 2 deal');
    console.log('- 0 sinergie (verranno create tramite Deal)');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('ERRORE DURANTE LA CREAZIONE DEI DATI DI SEED:', error);
  } finally {
    // Chiudi la connessione al database
    await pool.end();
  }
}

// Esegui lo script
createSeedData();