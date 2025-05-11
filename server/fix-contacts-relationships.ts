import { db } from "./db-simple";
import { contacts, companies, areasOfActivity } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to fix relationships between contacts and companies
 * 1. Removes associations of "fake" contacts
 * 2. Ensures that every company has at least one associated contact
 */
async function fixContactsRelationships() {
  try {
    console.log("Starting correction of relationships between contacts and companies...");
    
    // Use direct database select to avoid relational queries
    // that could cause problems with the new implementation
    const allContacts = await db.select().from(contacts);
    const allCompanies = await db.select().from(companies);
    
    console.log(`Found ${allContacts.length} contacts and ${allCompanies.length} companies`);
    
    // Get all areas of activity
    const allAreas = await db.select().from(areasOfActivity);
    
    // For each company, identify the associated contacts
    const companyContacts = new Map<number, any[]>();
    
    // Group areas of activity by company
    for (const company of allCompanies) {
      const contactsForCompany = allAreas
        .filter(area => area.companyId === company.id)
        .map(area => {
          const contact = allContacts.find(c => c.id === area.contactId);
          return contact;
        })
        .filter(Boolean); // Remove null/undefined values
      
      companyContacts.set(company.id, contactsForCompany);
      console.log(`Company "${company.name}" has ${contactsForCompany.length} associated contacts`);
    }
    
    // Now for each company without contacts, assign a "fake" contact
    let fakeContactIndex = 0;
    const fakeContacts = allContacts.filter(contact => {
      // Identify "fake" contacts (using more detailed heuristic rules)
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
    
    console.log(`Found ${fakeContacts.length} "fake" contacts`);
    
    // Remove all associations of fake contacts
    for (const fakeContact of fakeContacts) {
      const contactAreas = allAreas.filter(area => area.contactId === fakeContact.id);
      
      for (const area of contactAreas) {
        // Delete the area of activity directly from the DB
        await db.delete(areasOfActivity).where(eq(areasOfActivity.id, area.id));
        console.log(`Removed association of fake contact ${fakeContact.firstName} ${fakeContact.lastName} from company with ID ${area.companyId}`);
      }
    }
    
    // Ensure that each company has at least one contact
    for (const company of allCompanies) {
      const contactsForCompany = companyContacts.get(company.id) || [];
      
      if (contactsForCompany.length === 0) {
        // If there are no contacts, assign a fake contact
        if (fakeContacts.length > 0) {
          const fakeContact = fakeContacts[fakeContactIndex % fakeContacts.length];
          fakeContactIndex++;
          
          // Create the area of activity to connect this contact to the company
          await db.insert(areasOfActivity).values({
            contactId: fakeContact.id,
            companyId: company.id,
            companyName: company.name,
            role: "Contact Person",
            isPrimary: true,
            jobDescription: `Contact person for ${company.name}`
          });
          
          console.log(`Associated fake contact ${fakeContact.firstName} ${fakeContact.lastName} with company "${company.name}"`);
        } else {
          console.log(`WARNING: No fake contacts available for company "${company.name}"`);
        }
      }
    }
    
    console.log("Correction of relationships between contacts and companies completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during relationship correction:", error);
    return false;
  }
}

// We can't use require.main === module in ES modules
// We simply export the function to use it elsewhere
export { fixContactsRelationships };