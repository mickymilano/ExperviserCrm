/**
 * Script per eseguire un reset totale con seed minimo come richiesto:
 * - 2 aziende (1 Active Rep, 1 standard)
 * - 2-3 contatti con email multiple
 * - 2 Lead
 * - 1-2 Deal
 * - Nessuna sinergia
 */

import { db } from "./db";
import { companies, contacts, deals, leads, pipelineStages, areasOfActivity, contactEmails } from "@shared/schema";

async function createMinimalSeed() {
  console.log("Iniziando il seed minimale dei dati...");

  try {
    // Verificare che tutti i dati siano stati eliminati
    const existingCompanies = await db.select().from(companies);
    if (existingCompanies.length > 0) {
      console.log("Attenzione: esistono ancora aziende nel database, potrebbe essere necessario un reset totale");
    }

    // 1. Creare gli stage della pipeline
    console.log("Creazione degli stage della pipeline...");
    const stageIds = [];
    const stages = [
      { name: "Lead", order: 1, color: "#6E56CF" },
      { name: "Qualifica", order: 2, color: "#6E56CF" },
      { name: "Contatto", order: 3, color: "#3E63DD" },
      { name: "Analisi", order: 4, color: "#3E63DD" },
      { name: "Proposta", order: 5, color: "#3E63DD" },
      { name: "Negoziazione", order: 6, color: "#F29D38" },
      { name: "Chiuso vinto", order: 7, color: "#66C61C" },
      { name: "Chiuso perso", order: 8, color: "#E5484D" },
    ];

    for (const stage of stages) {
      const [newStage] = await db
        .insert(pipelineStages)
        .values(stage)
        .returning({ id: pipelineStages.id });
      stageIds.push(newStage.id);
    }
    console.log(`Creati ${stageIds.length} stage della pipeline`);

    // 2. Creare le aziende (1 Active Rep, 1 standard)
    console.log("Creazione delle aziende...");
    const [company1] = await db
      .insert(companies)
      .values({
        name: "FranchisingPlus SpA",
        industry: "Servizi",
        website: "https://franchisingplus.it",
        email: "info@franchisingplus.it",
        phone: "+39 02 1234567",
        address: "Via Roma 123, Milano",
        tags: ["franchising", "consulenza"],
        notes: "Azienda leader nel settore del franchising",
        status: "active",
        isActiveRep: true,
        companyType: "independent",
        channels: ["retail", "online"],
        productsOrServicesTags: ["consulenza", "formazione", "sviluppo business"],
        locationTypes: ["sede centrale", "filiali"]
      })
      .returning({ id: companies.id });

    const [company2] = await db
      .insert(companies)
      .values({
        name: "Ristoranti Italiani Srl",
        industry: "Ristorazione",
        website: "https://ristorantiitaliani.it",
        email: "info@ristorantiitaliani.it",
        phone: "+39 06 7654321",
        address: "Via Veneto 456, Roma",
        tags: ["ristorazione", "food"],
        notes: "Catena di ristoranti italiani tradizionali",
        status: "active",
        isActiveRep: false,
        companyType: "client",
        channels: ["ristoranti", "catering"],
        productsOrServicesTags: ["cucina italiana", "eventi", "catering"],
        locationTypes: ["ristoranti", "cucine centrali"]
      })
      .returning({ id: companies.id });

    console.log(`Create ${2} aziende`);

    // 3. Creare 3 contatti con email multiple
    console.log("Creazione dei contatti con email multiple...");
    const [contact1] = await db
      .insert(contacts)
      .values({
        firstName: "Laura",
        lastName: "Bianchi",
        mobilePhone: "+39 333 1234567",
        companyEmail: "l.bianchi@franchisingplus.it",
        privateEmail: "laura.bianchi@gmail.com",
        officePhone: "+39 02 1234567",
        privatePhone: "+39 333 7654321",
        linkedin: "linkedin.com/in/laurabianchi",
        tags: ["manager", "marketing"],
        notes: "Responsabile marketing di FranchisingPlus",
        status: "active",
        roles: ["Marketing Manager"]
      })
      .returning({ id: contacts.id });

    // Email aggiuntive per il contatto 1
    await db.insert(contactEmails).values([
      {
        contactId: contact1.id,
        email: "l.bianchi@franchisingplus.it",
        label: "Lavoro principale",
        isPrimary: true
      },
      {
        contactId: contact1.id,
        email: "laura.bianchi@gmail.com",
        label: "Personale",
        isPrimary: false
      },
      {
        contactId: contact1.id,
        email: "marketing@franchisingplus.it",
        label: "Dipartimento",
        isPrimary: false
      }
    ]);

    // Associazione del contatto 1 all'azienda 1
    await db.insert(areasOfActivity).values({
      contactId: contact1.id,
      companyId: company1.id,
      isPrimary: true,
      role: "Marketing Manager",
      jobDescription: "Responsabile delle strategie di marketing"
    });

    const [contact2] = await db
      .insert(contacts)
      .values({
        firstName: "Giuseppe",
        lastName: "Rossi",
        mobilePhone: "+39 333 2233445",
        companyEmail: "g.rossi@ristorantiitaliani.it",
        privateEmail: "giuseppe.rossi@gmail.com",
        officePhone: "+39 06 7654321",
        linkedin: "linkedin.com/in/giusepperossi",
        tags: ["direttore", "ristorazione"],
        notes: "Direttore operativo di Ristoranti Italiani",
        status: "active",
        roles: ["Direttore Operativo"]
      })
      .returning({ id: contacts.id });

    // Email aggiuntive per il contatto 2
    await db.insert(contactEmails).values([
      {
        contactId: contact2.id,
        email: "g.rossi@ristorantiitaliani.it",
        label: "Lavoro principale",
        isPrimary: true
      },
      {
        contactId: contact2.id,
        email: "giuseppe.rossi@gmail.com",
        label: "Personale",
        isPrimary: false
      }
    ]);

    // Associazione del contatto 2 all'azienda 2
    await db.insert(areasOfActivity).values({
      contactId: contact2.id,
      companyId: company2.id,
      isPrimary: true,
      role: "Direttore Operativo",
      jobDescription: "Responsabile delle operazioni di tutti i ristoranti"
    });

    const [contact3] = await db
      .insert(contacts)
      .values({
        firstName: "Marco",
        lastName: "Verdi",
        mobilePhone: "+39 333 5566778",
        companyEmail: "m.verdi@franchisingplus.it",
        privateEmail: "marco.verdi@gmail.com",
        officePhone: "+39 02 1234568",
        linkedin: "linkedin.com/in/marcoverdi",
        tags: ["sales", "consulente"],
        notes: "Consulente commerciale di FranchisingPlus",
        status: "active",
        roles: ["Sales Consultant"]
      })
      .returning({ id: contacts.id });

    // Email aggiuntive per il contatto 3
    await db.insert(contactEmails).values([
      {
        contactId: contact3.id,
        email: "m.verdi@franchisingplus.it",
        label: "Lavoro principale",
        isPrimary: true
      },
      {
        contactId: contact3.id,
        email: "marco.verdi@gmail.com",
        label: "Personale",
        isPrimary: false
      },
      {
        contactId: contact3.id,
        email: "marco.consulente@franchisingplus.it",
        label: "Consulenza",
        isPrimary: false
      }
    ]);

    // Associazione del contatto 3 all'azienda 1
    await db.insert(areasOfActivity).values({
      contactId: contact3.id,
      companyId: company1.id,
      isPrimary: true,
      role: "Sales Consultant",
      jobDescription: "Consulente per lo sviluppo commerciale"
    });

    console.log(`Creati ${3} contatti con email multiple`);

    // 4. Creare 2 lead
    console.log("Creazione dei lead...");
    await db.insert(leads).values([
      {
        firstName: "Antonio",
        lastName: "Neri",
        email: "antonio.neri@example.com",
        phone: "+39 333 8877665",
        company: "Ristorante Da Antonio",
        jobTitle: "Proprietario",
        source: "Referral",
        status: "new",
        notes: "Interessato a diventare franchisee",
        tags: ["ristorante", "potenziale franchisee"]
      },
      {
        firstName: "Sofia",
        lastName: "Gialli",
        email: "s.gialli@innovafood.com",
        phone: "+39 333 1122334",
        company: "InnovaFood Srl",
        jobTitle: "CEO",
        source: "Website",
        status: "in_progress",
        notes: "Interessata a collaborazione per nuova catena",
        tags: ["food tech", "innovazione"]
      }
    ]);
    console.log(`Creati ${2} lead`);

    // 5. Creare 2 deal
    console.log("Creazione dei deal...");
    await db.insert(deals).values([
      {
        name: "Consulenza strategica FranchisingPlus",
        value: 15000,
        stageId: stageIds[4], // Proposta
        contactId: contact1.id,
        companyId: company1.id,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni da oggi
        notes: "Proposta di consulenza strategica per l'espansione",
        tags: ["strategia", "espansione"],
        status: "active"
      },
      {
        name: "Ristrutturazione menu Ristoranti Italiani",
        value: 8500,
        stageId: stageIds[5], // Negoziazione
        contactId: contact2.id,
        companyId: company2.id,
        expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 giorni da oggi
        notes: "Proposta per la ristrutturazione completa del menu di tutti i ristoranti della catena",
        tags: ["menu", "consulenza"],
        status: "active"
      }
    ]);
    console.log(`Creati ${2} deal`);

    // Verificare che non ci siano sinergie nel database
    const synergies = await db.query.synergies.findMany();
    console.log(`Sinergie nel database: ${synergies.length}`);
    
    if (synergies.length === 0) {
      console.log("Confermato: nessuna sinergia nel database");
    } else {
      console.error("ERRORE: Esistono ancora sinergie nel database!");
    }

    console.log("Seed minimale completato con successo!");
  } catch (error) {
    console.error("Errore durante il seed minimale:", error);
    throw error;
  }
}

createMinimalSeed()
  .then(() => {
    console.log("Script completato con successo");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Errore durante l'esecuzione dello script:", error);
    process.exit(1);
  });