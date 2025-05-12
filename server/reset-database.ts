/**
 * Script per il reset completo del database
 * 
 * Questo script:
 * 1. Mantiene solo l'utente admin (michele@experviser.com)
 * 2. Elimina tutti i dati da tutte le altre tabelle
 * 3. Resetta le sequenze di auto-increment
 * 4. Ricrea un seed minimo per i test
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

import {
  users, contacts, companies, deals, 
  areasOfActivity, leads, pipelineStages, 
  tasks, activities, synergies
} from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function resetDatabase() {
  try {
    console.log('='.repeat(50));
    console.log('AVVIO RESET COMPLETO DEL DATABASE');
    console.log('='.repeat(50));
    
    // Disattiva temporaneamente i vincoli di chiave esterna per eliminare i dati senza errori
    await db.execute(sql`SET session_replication_role = 'replica'`);
    
    console.log('1. Eliminazione dati da tutte le tabelle (tranne utente admin)...');
    
    // Elimina tutte le sinergie
    await db.execute(sql`DELETE FROM synergies`);
    console.log('✓ Tabella synergies svuotata');
    
    // Elimina tutte le attività
    await db.execute(sql`DELETE FROM activities`);
    console.log('✓ Tabella activities svuotata');
    
    // Elimina tutti i task
    await db.execute(sql`DELETE FROM tasks`);
    console.log('✓ Tabella tasks svuotata');
    
    // Elimina tutti i deal
    await db.execute(sql`DELETE FROM deals`);
    console.log('✓ Tabella deals svuotata');
    
    // Elimina tutte le aree di attività
    await db.execute(sql`DELETE FROM areas_of_activity`);
    console.log('✓ Tabella areas_of_activity svuotata');
    
    // Elimina tutti i lead
    await db.execute(sql`DELETE FROM leads`);
    console.log('✓ Tabella leads svuotata');
    
    // Elimina tutti i contatti
    await db.execute(sql`DELETE FROM contacts`);
    console.log('✓ Tabella contacts svuotata');
    
    // Elimina tutte le aziende
    await db.execute(sql`DELETE FROM companies`);
    console.log('✓ Tabella companies svuotata');
    
    // Mantieni solo l'utente admin (michele@experviser.com)
    await db.execute(sql`DELETE FROM users WHERE username != 'michele' AND email != 'michele@experviser.com'`);
    await db.execute(sql`DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)`);
    console.log('✓ Tabella users filtrata (mantenuto solo michele@experviser.com)');
    
    console.log('2. Reset sequenze di auto-increment...');
    
    // Reset delle sequenze di auto-increment
    const sequences = [
      'synergies_id_seq',
      'activities_id_seq',
      'tasks_id_seq',
      'deals_id_seq',
      'areas_of_activity_id_seq',
      'leads_id_seq',
      'contacts_id_seq',
      'companies_id_seq'
    ];
    
    for (const sequence of sequences) {
      try {
        await db.execute(sql`ALTER SEQUENCE ${sql.identifier(sequence)} RESTART WITH 1`);
      } catch (error) {
        console.error(`Errore nel reset della sequenza ${sequence}:`, error);
      }
    }
    
    console.log('✓ Sequenze di auto-increment resettate');
    
    // Riattiva i vincoli di chiave esterna
    await db.execute(sql`SET session_replication_role = 'origin'`);
    
    console.log('3. Creazione seed minimo per test...');
    
    // Crea aziende di test
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
      isActiveRep: true, // Active Rep
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
      isActiveRep: false, // Standard
      companyType: "independent",
      brands: ["RistoItaliano"],
      channels: ["physical"],
      productsOrServicesTags: ["food", "catering"],
      locationTypes: ["urban", "mall", "travel"]
    }).returning();
    
    console.log('✓ Create 2 aziende (una Active Rep, una standard)');
    
    // Crea contatti di test
    const contact1 = await db.insert(contacts).values({
      firstName: "Marco",
      lastName: "Rossi",
      mobilePhone: "+39 333 1234567",
      companyEmail: "", // Campo svuotato per migrazione a contact_emails
      privateEmail: "", // Campo svuotato per migrazione a contact_emails
      officePhone: "+39 02 1234567",
      privatePhone: "",
      linkedin: "https://linkedin.com/in/marcorossi",
      tags: ["vip", "decision maker"],
      notes: "CEO di FranchisingPlus",
      status: "active",
      roles: ["executive", "board member"],
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 giorni da oggi
    }).returning();
    
    const contact2 = await db.insert(contacts).values({
      firstName: "Laura",
      lastName: "Bianchi",
      mobilePhone: "+39 335 9876543",
      companyEmail: "", // Campo svuotato per migrazione a contact_emails
      privateEmail: "", // Campo svuotato per migrazione a contact_emails
      officePhone: "+39 02 1234568",
      privatePhone: "",
      linkedin: "https://linkedin.com/in/laurabianchi",
      tags: ["marketing", "franchising"],
      notes: "Direttore Marketing di FranchisingPlus",
      status: "active",
      roles: ["marketing", "management"],
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)) // 5 giorni da oggi
    }).returning();
    
    const contact3 = await db.insert(contacts).values({
      firstName: "Giuseppe",
      lastName: "Verdi",
      mobilePhone: "+39 338 1122334",
      companyEmail: "", // Campo svuotato per migrazione a contact_emails
      privateEmail: "", // Campo svuotato per migrazione a contact_emails
      officePhone: "+39 06 7654322",
      privatePhone: "",
      linkedin: "https://linkedin.com/in/giuseppeverdi",
      tags: ["ristorazione", "chef"],
      notes: "Responsabile sviluppo di Ristoranti Italiani",
      status: "active",
      roles: ["operations", "business development"],
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)) // 3 giorni da oggi
    }).returning();
    
    console.log('✓ Creati 3 contatti di test');
    
    // Crea aree di attività (associazione contatti-aziende)
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
    
    console.log('✓ Create relazioni tra contatti e aziende');
    
    // Crea lead di test
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
    const stageResponse = await db.select().from(pipelineStages).orderBy(pipelineStages.order);
    const stages = stageResponse;
    
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
    console.log('RESET DATABASE COMPLETATO CON SUCCESSO');
    console.log('='.repeat(50));
    console.log('Dati creati per il test:');
    console.log('- 2 aziende (una Active Rep, una standard)');
    console.log('- 3 contatti con relazioni alle aziende');
    console.log('- 2 lead');
    console.log('- 2 deal');
    console.log('- 0 sinergie (verranno create tramite Deal)');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('ERRORE DURANTE IL RESET DEL DATABASE:', error);
  } finally {
    // Chiudi la connessione al database
    await pool.end();
  }
}

// Esegui lo script
resetDatabase();