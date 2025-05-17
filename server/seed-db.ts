/**
 * Script ottimizzato per popolamento database
 * Compatibile con lo schema esistente nel database
 */

import { db } from './db';
import {
  users, contacts, companies, deals, leads, pipelineStages, areasOfActivity, synergies
} from '../shared/schema';

async function seedDatabase() {
  try {
    console.log('='.repeat(50));
    console.log('INIZIALIZZAZIONE DATI DI TEST');
    console.log('='.repeat(50));

    // Verifica gli stage della pipeline
    const existingStages = await db.select().from(pipelineStages);
    let stageIds: { id: number }[] = [];
    
    if (existingStages.length === 0) {
      console.log('Creazione stages della pipeline...');
      // Crea gli stage della pipeline (solo con le colonne esistenti: id, name, order)
      const stages = [
        { name: "Lead", order: 1 },
        { name: "Qualifica", order: 2 },
        { name: "Contatto", order: 3 },
        { name: "Analisi", order: 4 },
        { name: "Proposta", order: 5 },
        { name: "Negoziazione", order: 6 },
        { name: "Chiuso vinto", order: 7 },
        { name: "Chiuso perso", order: 8 },
      ];

      for (const stage of stages) {
        const result = await db.insert(pipelineStages).values(stage).returning({ id: pipelineStages.id });
        stageIds.push(result[0]);
      }
      console.log(`Creati ${stageIds.length} stage della pipeline`);
    } else {
      console.log(`Trovati ${existingStages.length} stage della pipeline esistenti`);
      stageIds = existingStages.map(stage => ({ id: stage.id }));
    }

    // 1. Crea aziende di test
    console.log('Creazione aziende di test...');
    
    const company1 = await db.insert(companies).values({
      name: "FranchisingPlus SpA",
      industry: "Franchising",
      website: "https://franchisingplus.it",
      email: "info@franchisingplus.it",
      phone: "+39 02 1234567",
      address: "Via Roma 123, Milano",
      full_address: "Via Roma 123, 20121 Milano, Italia",
      country: "Italia",
      tags: ["franchising", "retail"],
      notes: "Azienda di franchising attiva nel settore retail",
      status: "active"
    }).returning();
    
    const company2 = await db.insert(companies).values({
      name: "Ristoranti Italiani Srl",
      industry: "Ristorazione",
      website: "https://ristorantiitaliani.it",
      email: "info@ristorantiitaliani.it",
      phone: "+39 06 7654321",
      address: "Via Veneto 456, Roma",
      full_address: "Via Veneto 456, 00187 Roma, Italia",
      country: "Italia",
      tags: ["ristorazione", "food"],
      notes: "Catena di ristoranti italiani",
      status: "active"
    }).returning();
    
    console.log(`✓ Create ${company1.length + company2.length} aziende di test`);
    
    // 2. Crea contatti di test
    console.log('Creazione contatti di test...');
    
    const contact1 = await db.insert(contacts).values({
      firstName: "Marco",
      lastName: "Rossi",
      email: "marco.rossi@franchisingplus.it",
      mobile: "+39 333 1234567",
      phone: "+39 02 1234567",
      address: "Via Roma 123, Milano",
      city: "Milano",
      region: "Lombardia",
      country: "Italia",
      postalCode: "20121",
      tags: ["vip", "decision maker"],
      notes: "CEO di FranchisingPlus",
      status: "active"
    }).returning();
    
    const contact2 = await db.insert(contacts).values({
      firstName: "Laura",
      lastName: "Bianchi",
      email: "laura.bianchi@franchisingplus.it",
      mobile: "+39 335 9876543",
      phone: "+39 02 1234568",
      address: "Via Montenapoleone 10, Milano",
      city: "Milano",
      region: "Lombardia",
      country: "Italia",
      postalCode: "20121",
      tags: ["marketing", "franchising"],
      notes: "Direttore Marketing di FranchisingPlus",
      status: "active"
    }).returning();
    
    const contact3 = await db.insert(contacts).values({
      firstName: "Giuseppe",
      lastName: "Verdi",
      email: "giuseppe.verdi@ristorantiitaliani.it",
      mobile: "+39 338 1122334",
      phone: "+39 06 7654322",
      address: "Via Veneto 456, Roma",
      city: "Roma",
      region: "Lazio",
      country: "Italia",
      postalCode: "00187",
      tags: ["ristorazione", "chef"],
      notes: "Responsabile sviluppo di Ristoranti Italiani",
      status: "active"
    }).returning();
    
    console.log(`✓ Creati ${contact1.length + contact2.length + contact3.length} contatti di test`);
    
    // 3. Crea aree di attività (associazione contatti-aziende)
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
    
    // 4. Crea lead di test
    console.log('Creazione lead di test...');
    
    await db.insert(leads).values({
      firstName: "Anna",
      lastName: "Neri",
      email: "anna.neri@retailsolutions.it",
      phone: "+39 340 1234567",
      company: "Retail Solutions",
      role: "Direttore Commerciale",
      source: "LinkedIn",
      status: "new",
      notes: "Interessata a soluzioni di franchising"
    });
    
    await db.insert(leads).values({
      firstName: "Paolo",
      lastName: "Gialli",
      email: "paolo.gialli@foodinnovation.it",
      phone: "+39 342 7654321",
      company: "Food Innovation",
      role: "Fondatore",
      source: "Referral",
      status: "qualified",
      notes: "Ha una catena di ristoranti in espansione"
    });
    
    console.log('✓ Creati 2 lead di test');
    
    // 5. Crea deal di test
    console.log('Creazione deal di test...');
    
    const deal1 = await db.insert(deals).values({
      name: "Consulenza strategica FranchisingPlus",
      value: "15000",
      stageId: stageIds[1].id, // Seconda fase (qualifica)
      contactId: contact1[0].id,
      companyId: company1[0].id,
      expectedCloseDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 giorni da oggi
      notes: "Proposta di consulenza strategica per l'espansione della rete",
      tags: ["franchising", "consulenza", "strategia"],
      status: "active",
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 giorni da oggi
    }).returning();
    
    const deal2 = await db.insert(deals).values({
      name: "Ristrutturazione menu Ristoranti Italiani",
      value: "8000",
      stageId: stageIds[3].id, // Quarta fase (analisi)
      contactId: contact3[0].id,
      companyId: company2[0].id,
      expectedCloseDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)), // 15 giorni da oggi
      notes: "Ristrutturazione completa del menu e identity della catena",
      tags: ["ristorazione", "menu", "brand"],
      status: "active",
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)) // 3 giorni da oggi
    }).returning();
    
    console.log('✓ Creati 2 deal di test');
    
    // 6. Crea sinergie di test
    console.log('Creazione sinergie di test...');
    
    await db.insert(synergies).values({
      contactId: contact1[0].id,
      companyId: company1[0].id,
      type: "Leadership",
      description: "CEO dell'azienda, responsabile delle decisioni strategiche",
      status: "Active",
      startDate: new Date().toISOString().split('T')[0],
      dealId: deal1[0].id
    });
    
    await db.insert(synergies).values({
      contactId: contact3[0].id,
      companyId: company2[0].id,
      type: "Business Development",
      description: "Responsabile delle strategie di sviluppo della catena",
      status: "Active",
      startDate: new Date().toISOString().split('T')[0],
      dealId: deal2[0].id
    });
    
    console.log('✓ Create 2 sinergie di test');
    
    console.log('='.repeat(50));
    console.log('INIZIALIZZAZIONE DATI DI TEST COMPLETATA CON SUCCESSO');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('ERRORE DURANTE LA CREAZIONE DEI DATI DI TEST:', error);
    throw error;
  }
}

// Esegui lo script
seedDatabase()
  .then(() => {
    console.log('Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore durante l\'esecuzione dello script:', error);
    process.exit(1);
  });