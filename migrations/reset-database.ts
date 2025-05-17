import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { 
  users, 
  userRoleEnum, 
  userStatusEnum, 
  contacts, 
  contactEmails, 
  companies, 
  areasOfActivity, 
  leads, 
  pipelineStages, 
  deals 
} from "../shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

// Configurazione del client PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configurazione di Drizzle con il client
const db = drizzle(pool);

async function resetDatabase() {
  console.log("Iniziando il reset del database...");
  
  try {
    // Elimina tutti i dati dalle tabelle in ordine per rispettare i vincoli di chiave esterna
    console.log("Eliminazione dei dati esistenti...");
    
    // Prima eliminiamo le tabelle con chiavi esterne (dall'ultimo livello al primo)
    await db.delete(synergies);
    await db.delete(deals);
    await db.delete(areasOfActivity);
    await db.delete(contactEmails);
    await db.delete(leads);
    await db.delete(contacts);
    await db.delete(companies);
    await db.delete(pipelineStages);
    
    // Manteniamo l'utente superadmin
    const superAdmin = await db.select().from(users).where(eq(users.email, "michele@experviser.com")).limit(1);
    
    // Se l'utente superadmin esiste, eliminiamo tutti gli altri utenti
    if (superAdmin && superAdmin.length > 0) {
      await db.delete(users).where(neq(users.email, "michele@experviser.com"));
      console.log("Tutti gli utenti tranne il superadmin sono stati eliminati");
    } else {
      // Eliminiamo tutti gli utenti
      await db.delete(users);
      console.log("Tutti gli utenti sono stati eliminati. Creazione superadmin...");
      
      // Crea l'utente superadmin
      const hashedPassword = await bcrypt.hash("admin_admin_69", 10);
      await db.insert(users).values({
        username: "michele",
        password: hashedPassword,
        fullName: "Michele Admin",
        email: "michele@experviser.com",
        role: "super_admin",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("L'utente superadmin è stato creato con successo");
    }
    
    // Seeding dei dati iniziali
    console.log("Inserimento dei dati di base...");
    
    // Inserimento delle fasi della pipeline
    const pipelineStagesData = [
      { name: "Lead", position: 1, color: "#6366F1" },
      { name: "Contatto", position: 2, color: "#8B5CF6" },
      { name: "Proposta", position: 3, color: "#EC4899" },
      { name: "Negoziazione", position: 4, color: "#F59E0B" },
      { name: "Chiusura", position: 5, color: "#10B981" }
    ];
    
    const pipelinesResult = await db.insert(pipelineStages).values(pipelineStagesData).returning();
    console.log(`${pipelinesResult.length} fasi pipeline inserite`);
    
    // Inserimento delle aziende di esempio
    const companiesData = [
      {
        name: "ABC Consulting",
        email: "info@abcconsulting.com",
        phone: "+39 02 1234567",
        address: "Via Roma 123",
        full_address: "Via Roma 123, 20100 Milano, Italia",
        country: "Italia",
        website: "https://www.abcconsulting.com",
        industry: "Consulenza",
        description: "Azienda di consulenza strategica",
        employee_count: 50,
        annual_revenue: 7500000,
        tags: ["consulenza", "strategia", "innovazione"],
        status: "active",
        is_active_rep: true,
        company_type: "Independente",
        brands: ["ABC Consulting", "ABC Advisory"],
        channels: ["Retail", "Online"],
        products_or_services_tags: ["Consulenza Strategica", "Digital Transformation", "Change Management"]
      },
      {
        name: "XYZ Franchising",
        email: "info@xyzfranchising.com",
        phone: "+39 06 9876543",
        address: "Via Veneto 456",
        full_address: "Via Veneto 456, 00100 Roma, Italia",
        country: "Italia",
        website: "https://www.xyzfranchising.com",
        industry: "Franchising",
        description: "Catena di franchising per ristoranti",
        employee_count: 200,
        annual_revenue: 35000000,
        tags: ["franchising", "ristoranti", "food"],
        status: "active",
        is_active_rep: false,
        company_type: "Franchisor Monomarca",
        brands: ["XYZ Food", "XYZ Express"],
        channels: ["Franchising", "Direct Retail"],
        products_or_services_tags: ["Food & Beverage", "Restaurant Chain", "Fast Food"]
      }
    ];
    
    const companiesResult = await db.insert(companies).values(companiesData).returning();
    console.log(`${companiesResult.length} aziende inserite`);
    
    // Inserimento dei contatti di esempio
    const contactsData = [
      {
        firstName: "Mario",
        lastName: "Rossi",
        phone: "+39 333 1234567",
        mobile: "+39 333 7654321",
        address: "Via Garibaldi 789",
        city: "Milano",
        region: "Lombardia",
        country: "Italia",
        postalCode: "20100",
        website: "https://www.mariorossi.it",
        notes: "Contatto principale per ABC Consulting",
        tags: ["consulente", "manager"],
        source: "LinkedIn",
        roles: ["CEO", "Founder"],
        status: "active"
      },
      {
        firstName: "Laura",
        lastName: "Bianchi",
        phone: "+39 333 2345678",
        mobile: "+39 333 8765432",
        address: "Via Dante 321",
        city: "Roma",
        region: "Lazio",
        country: "Italia",
        postalCode: "00100",
        notes: "Contatto marketing per XYZ Franchising",
        tags: ["marketing", "digital"],
        source: "Referral",
        roles: ["Marketing Director", "Digital Strategist"],
        status: "active"
      },
      {
        firstName: "Giovanni",
        lastName: "Verdi",
        phone: "+39 333 3456789",
        mobile: "+39 333 9876543",
        address: "Via Manzoni 654",
        city: "Torino",
        region: "Piemonte",
        country: "Italia",
        postalCode: "10100",
        notes: "Contatto per eventuali collaborazioni",
        tags: ["partner", "consulente"],
        source: "Conference",
        roles: ["Consultant", "Business Developer"],
        status: "active"
      }
    ];
    
    const contactsResult = await db.insert(contacts).values(contactsData).returning();
    console.log(`${contactsResult.length} contatti inseriti`);
    
    // Inserimento delle email per i contatti
    const emailsData = [
      {
        contactId: contactsResult[0].id,
        emailAddress: "mario.rossi@abcconsulting.com",
        type: "work",
        isPrimary: true
      },
      {
        contactId: contactsResult[0].id,
        emailAddress: "mario.rossi@gmail.com",
        type: "personal",
        isPrimary: false
      },
      {
        contactId: contactsResult[1].id,
        emailAddress: "laura.bianchi@xyzfranchising.com",
        type: "work",
        isPrimary: true
      },
      {
        contactId: contactsResult[2].id,
        emailAddress: "g.verdi@consulenze.it",
        type: "work",
        isPrimary: true
      },
      {
        contactId: contactsResult[2].id,
        emailAddress: "giovanni.verdi@gmail.com",
        type: "personal",
        isPrimary: false
      }
    ];
    
    const emailsResult = await db.insert(contactEmails).values(emailsData).returning();
    console.log(`${emailsResult.length} email inserite`);
    
    // Associa i contatti alle aziende tramite aree di attività
    const areasData = [
      {
        contactId: contactsResult[0].id,
        companyId: companiesResult[0].id,
        companyName: companiesResult[0].name,
        role: "CEO",
        jobDescription: "Amministratore Delegato",
        isPrimary: true
      },
      {
        contactId: contactsResult[1].id,
        companyId: companiesResult[1].id,
        companyName: companiesResult[1].name,
        role: "Marketing Director",
        jobDescription: "Direttore Marketing",
        isPrimary: true
      },
      {
        contactId: contactsResult[2].id,
        companyId: companiesResult[0].id,
        companyName: companiesResult[0].name,
        role: "External Consultant",
        jobDescription: "Consulente Esterno per Progetti Strategici",
        isPrimary: true
      }
    ];
    
    const areasResult = await db.insert(areasOfActivity).values(areasData).returning();
    console.log(`${areasResult.length} aree di attività inserite`);
    
    // Inserimento di lead di esempio
    const leadsData = [
      {
        firstName: "Paolo",
        lastName: "Neri",
        email: "paolo.neri@example.com",
        phone: "+39 333 4567890",
        companyName: "Nuova Azienda Srl",
        jobTitle: "Direttore Commerciale",
        source: "Website",
        status: "New",
        notes: "Interessato ai servizi di consulenza strategica"
      },
      {
        firstName: "Francesca",
        lastName: "Gialli",
        email: "francesca.gialli@example.com",
        phone: "+39 333 5678901",
        companyName: "Start-up Innovativa SpA",
        jobTitle: "CEO",
        source: "Referral",
        status: "Qualified",
        notes: "Sta cercando partner per espandere il business"
      }
    ];
    
    const leadsResult = await db.insert(leads).values(leadsData).returning();
    console.log(`${leadsResult.length} lead inseriti`);
    
    // Inserimento di deal di esempio
    const dealsData = [
      {
        name: "Progetto Consulenza Strategica",
        description: "Consulenza per la ristrutturazione aziendale",
        value: 50000,
        pipelineStageId: pipelinesResult[2].id, // Proposta
        companyId: companiesResult[0].id,
        contactId: contactsResult[0].id,
        probability: 70,
        expectedCloseDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        notes: "Cliente molto interessato, in attesa di approvazione budget",
        tags: ["strategia", "ristrutturazione", "high-value"],
        status: "active"
      },
      {
        name: "Apertura Nuova Sede Franchising",
        description: "Consulenza per apertura nuovo punto vendita a Milano",
        value: 25000,
        pipelineStageId: pipelinesResult[3].id, // Negoziazione
        companyId: companiesResult[1].id,
        contactId: contactsResult[1].id,
        probability: 90,
        expectedCloseDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        notes: "Dettagli contrattuali in fase di definizione",
        tags: ["franchising", "expansion", "retail"],
        status: "active"
      }
    ];
    
    const dealsResult = await db.insert(deals).values(dealsData).returning();
    console.log(`${dealsResult.length} deal inseriti`);
    
    console.log("Reset e seeding del database completati con successo!");
  } catch (error) {
    console.error("Errore durante il reset del database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Importazione mancante
import { neq } from "drizzle-orm";
import { synergies } from "../shared/schema";

resetDatabase();