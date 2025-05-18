import { db } from "../../db";
import { contacts, areasOfActivity } from "../../../shared/schema";
import { eq, and, or, like } from "drizzle-orm";

interface EmailSender {
  name?: string;
  address: string;
}

interface SignatureData {
  name?: string;
  position?: string;
  company?: string;
  phone?: string;
  mobilePhone?: string;
  officePhone?: string;
  email?: string;
  website?: string;
  address?: string;
  linkedin?: string;
  rawText?: string;
}

interface ContactMatch {
  id: number;
  firstName: string;
  lastName: string;
  score: number; // 0-100 punteggio di confidenza
}

/**
 * Elabora un mittente email per trovare un contatto corrispondente o crearne uno nuovo
 * @param sender Dati del mittente
 * @param signatureData Dati estratti dalla firma email
 * @returns ID del contatto o null
 */
export async function processContactFromEmail(
  sender: EmailSender, 
  signatureData: SignatureData
): Promise<number | null> {
  try {
    // 1. Verifica se l'indirizzo email corrisponde a un contatto esistente
    const contactByEmail = await findContactByEmail(sender.address);
    
    if (contactByEmail) {
      // Abbiamo trovato un contatto con questa email
      return contactByEmail.id;
    }
    
    // 2. Estrai nome e cognome dal mittente
    let firstName = "";
    let lastName = "";
    
    // Usa la firma se disponibile, altrimenti il campo From
    if (signatureData.name) {
      const nameParts = signatureData.name.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = signatureData.name;
      }
    } else if (sender.name) {
      const nameParts = sender.name.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = sender.name;
      }
    } else {
      // Usa la parte dell'email prima della @
      firstName = sender.address.split('@')[0];
    }
    
    // 3. Cerca un contatto con nome e cognome simili
    if (firstName && lastName) {
      const matchingContacts = await findContactsByName(firstName, lastName);
      
      if (matchingContacts.length > 0) {
        // Abbiamo trovato un contatto con nome simile
        return matchingContacts[0].id;
      }
    }
    
    // 4. Nessun contatto trovato, crea un nuovo contatto
    // In un sistema reale questo passaggio potrebbe richiedere approvazione umana
    return await createContactFromEmail(sender, signatureData, firstName, lastName);
  } catch (error) {
    console.error('Errore durante l\'elaborazione del contatto:', error);
    return null;
  }
}

/**
 * Trova un contatto in base all'email
 */
async function findContactByEmail(email: string): Promise<{ id: number } | null> {
  // Cerca nel campo companyEmail
  const companyEmailMatches = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(eq(contacts.companyEmail, email));
  
  if (companyEmailMatches.length > 0) {
    return companyEmailMatches[0];
  }
  
  // Cerca nel campo privateEmail
  const privateEmailMatches = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(eq(contacts.privateEmail, email));
    
  if (privateEmailMatches.length > 0) {
    return privateEmailMatches[0];
  }
  
  return null;
}

/**
 * Trova contatti in base al nome
 */
async function findContactsByName(firstName: string, lastName: string): Promise<ContactMatch[]> {
  // Se i nomi sono troppo corti, salta la ricerca per evitare falsi positivi
  if (firstName.length < 2 || lastName.length < 2) return [];
  
  const nameMatches = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName
    })
    .from(contacts)
    .where(
      and(
        like(contacts.firstName, `%${firstName}%`),
        like(contacts.lastName, `%${lastName}%`)
      )
    )
    .limit(5);
  
  // Calcola un punteggio di somiglianza per ogni match
  return nameMatches.map(match => {
    // Punteggio di base
    let score = 50;
    
    // Aumenta il punteggio se c'è corrispondenza esatta
    if (match.firstName.toLowerCase() === firstName.toLowerCase()) score += 25;
    if (match.lastName.toLowerCase() === lastName.toLowerCase()) score += 25;
    
    return {
      ...match,
      score
    };
  }).sort((a, b) => b.score - a.score); // Ordina per punteggio decrescente
}

/**
 * Crea un nuovo contatto dai dati email
 */
async function createContactFromEmail(
  sender: EmailSender,
  signatureData: SignatureData,
  firstName: string,
  lastName: string
): Promise<number | null> {
  try {
    // Preparazione dei dati del contatto
    const contactData = {
      firstName,
      lastName,
      status: 'active',
      companyEmail: sender.address,
      mobilePhone: signatureData.mobilePhone || signatureData.phone || null,
      officePhone: signatureData.officePhone || null,
      linkedin: signatureData.linkedin || null,
      notes: `Contatto creato automaticamente da email. Firma originale:\n${signatureData.rawText || ''}`,
      tags: ['email-import'],
      roles: JSON.stringify(signatureData.position ? [{ title: signatureData.position }] : [])
    };
    
    // Inserimento nel database
    const [newContact] = await db.insert(contacts).values(contactData).returning();
    
    // Se abbiamo informazioni sull'azienda, crea una relazione
    if (signatureData.company) {
      await db.insert(areasOfActivity).values({
        contactId: newContact.id,
        companyName: signatureData.company,
        role: signatureData.position || null,
        isPrimary: true
      });
    }
    
    console.log(`Creato nuovo contatto (ID: ${newContact.id}) da email: ${sender.address}`);
    return newContact.id;
  } catch (error) {
    console.error('Errore durante la creazione del contatto:', error);
    return null;
  }
}