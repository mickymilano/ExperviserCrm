/**
 * Script per risolvere definitivamente il problema di John Smith vs Michele Ardoni
 * 
 * Questo script:
 * 1. Elimina tutte le sessioni (già fatto con clear-sessions.ts)
 * 2. Aggiorna tutti i riferimenti a John Smith in Michele Ardoni
 * 3. Genera un nuovo token di accesso per Michele Ardoni
 */

import { pool } from "./db";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, userSessions } from "../shared/schema";
import { eq, like } from "drizzle-orm";
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function fixUsers() {
  try {
    console.log("Iniziando la correzione degli utenti...");
    
    const db = drizzle(pool);
    
    // 1. Elimina tutte le sessioni
    await db.delete(userSessions);
    console.log("Sessioni eliminate");
    
    // 2. Aggiorna tutti i riferimenti a John Smith
    const [john] = await db.select().from(users).where(like(users.fullName, "%John%"));
    
    if (john) {
      console.log(`Trovato utente John Smith con ID: ${john.id}`);
      
      // Aggiorna John Smith in Michele Ardoni
      await db.update(users)
        .set({
          username: "michele",
          fullName: "Michele Ardoni",
          email: "michele@experviser.com",
          role: "super_admin",
          status: "active",
          timezone: "Europe/Rome",
          language: "English",
          phone: "+39 123 456 7890",
          jobTitle: "CEO"
        })
        .where(eq(users.id, john.id));
      
      console.log("Utente aggiornato con successo");
    } else {
      console.log("Utente John Smith non trovato");
    }
    
    // 3. Crea un nuovo token di accesso per Michele Ardoni
    const [michele] = await db.select().from(users).where(eq(users.username, "michele"));
    
    if (michele) {
      // Genera un nuovo token di sessione
      const token = uuidv4();
      
      // Inserisci nella tabella delle sessioni
      await db.insert(userSessions).values({
        token,
        userId: michele.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 giorni
        ipAddress: "127.0.0.1",
        userAgent: "fix-script"
      });
      
      console.log("Nuovo token di accesso generato per Michele Ardoni");
      console.log("Token:", token);
      console.log("Per utilizzare questo token:");
      console.log("1. Apri la console del browser");
      console.log("2. Esegui: localStorage.setItem('auth_token', '" + token + "')");
      console.log("3. Ricarica la pagina");
    } else {
      console.log("Utente Michele Ardoni non trovato");
    }
    
    console.log("Correzione degli utenti completata!");
    
  } catch (error) {
    console.error("Errore durante la correzione degli utenti:", error);
  } finally {
    await pool.end();
  }
}

// Esegui la funzione
fixUsers();