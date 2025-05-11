import { db } from "./db";
import { contacts, companies, areasOfActivity } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script per correggere le relazioni tra contatti e aziende
 * 1. Rimuove le associazioni dei contatti "fake"
 * 2. Assicura che ogni azienda abbia almeno un contatto associato
 */
async function fixContactsRelationships() {
  try {
    console.log("Inizio correzione relazioni tra contatti e aziende...");
    
    // Utilizzo select diretta dal database per evitare query con relazioni
    // che potrebbero causare problemi con la nuova implementazione
    const allContacts = await db.select().from(contacts);
    const allCompanies = await db.select().from(companies);
    
    console.log(`Trovati ${allContacts.length} contatti e ${allCompanies.length} aziende`);
    
    // Otteniamo tutte le aree di attività
    const allAreas = await db.select().from(areasOfActivity);
    
    // Per ogni azienda, identifichiamo i contatti associati
    const companyContacts = new Map<number, any[]>();
    
    // Raggruppiamo le aree di attività per azienda
    for (const company of allCompanies) {
      const contactsForCompany = allAreas
        .filter(area => area.companyId === company.id)
        .map(area => {
          const contact = allContacts.find(c => c.id === area.contactId);
          return contact;
        })
        .filter(Boolean); // Rimuoviamo valori null/undefined
      
      companyContacts.set(company.id, contactsForCompany);
      console.log(`Azienda "${company.name}" ha ${contactsForCompany.length} contatti associati`);
    }
    
    // Ora per ogni azienda che non ha contatti, assegniamo un contatto "fake"
    let fakeContactIndex = 0;
    const fakeContacts = allContacts.filter(contact => {
      // Identifica i contatti "fake" (usando regole euristiche più dettagliate)
      const isFake = 
        (contact.firstName === "Test" && contact.lastName === "Contact") ||
        (contact.firstName?.toLowerCase().includes("test") || contact.lastName?.toLowerCase().includes("test")) ||
        (contact.firstName?.toLowerCase().includes("fake") || contact.lastName?.toLowerCase().includes("fake")) ||
        (contact.firstName?.toLowerCase().includes("demo") || contact.lastName?.toLowerCase().includes("demo")) ||
        (contact.companyEmail && (
          contact.companyEmail.toLowerCase().includes("fake") || 
          contact.companyEmail.toLowerCase().includes("test") || 
          contact.companyEmail.toLowerCase().includes("demo")
        )) ||
        (contact.privateEmail && (
          contact.privateEmail.toLowerCase().includes("fake") || 
          contact.privateEmail.toLowerCase().includes("test") || 
          contact.privateEmail.toLowerCase().includes("demo")
        )) ||
        (contact.notes && (
          contact.notes.toLowerCase().includes("test") ||
          contact.notes.toLowerCase().includes("fake") ||
          contact.notes.toLowerCase().includes("demo")
        ));
      
      return isFake;
    });
    
    console.log(`Trovati ${fakeContacts.length} contatti "fake"`);
    
    // Rimuoviamo tutte le associazioni dei contatti fake
    for (const fakeContact of fakeContacts) {
      const contactAreas = allAreas.filter(area => area.contactId === fakeContact.id);
      
      for (const area of contactAreas) {
        // Eliminiamo l'area di attività direttamente dal DB
        await db.delete(areasOfActivity).where(eq(areasOfActivity.id, area.id));
        console.log(`Rimossa associazione del contatto fake ${fakeContact.firstName} ${fakeContact.lastName} dall'azienda con ID ${area.companyId}`);
      }
    }
    
    // Assicuriamoci che ogni azienda abbia almeno un contatto
    for (const company of allCompanies) {
      const contactsForCompany = companyContacts.get(company.id) || [];
      
      if (contactsForCompany.length === 0) {
        // Se non ci sono contatti, assegna un contatto fake
        if (fakeContacts.length > 0) {
          const fakeContact = fakeContacts[fakeContactIndex % fakeContacts.length];
          fakeContactIndex++;
          
          // Crea l'area di attività per collegare questo contatto all'azienda
          await db.insert(areasOfActivity).values({
            contactId: fakeContact.id,
            companyId: company.id,
            companyName: company.name,
            role: "Contact Person",
            isPrimary: true,
            jobDescription: `Contact person for ${company.name}`
          });
          
          console.log(`Associato contatto fake ${fakeContact.firstName} ${fakeContact.lastName} all'azienda "${company.name}"`);
        } else {
          console.log(`ATTENZIONE: Nessun contatto fake disponibile per l'azienda "${company.name}"`);
        }
      }
    }
    
    console.log("Correzione relazioni tra contatti e aziende completata con successo!");
    return true;
  } catch (error) {
    console.error("Errore durante la correzione delle relazioni:", error);
    return false;
  }
}

// Non possiamo utilizzare require.main === module nei moduli ES
// Esportiamo semplicemente la funzione per poterla utilizzare altrove
export { fixContactsRelationships };