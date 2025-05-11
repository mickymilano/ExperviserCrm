import { db } from "./db";
import { users, pipelineStages } from "@shared/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

/**
 * Inizializza il database PostgreSQL con i dati fondamentali
 * Viene eseguito all'avvio del server
 */
export async function initializePostgresDb() {
  console.log("Inizializzazione del database PostgreSQL...");
  
  // Verifica la presenza dell'utente super admin
  let superAdminExists = false;
  try {
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "super_admin"));
    
    superAdminExists = adminUsers.length > 0;
    
    if (superAdminExists) {
      console.log("Super admin già esistente");
    } else {
      console.log("Creazione utente super admin...");
      
      // Crea l'utente super admin
      const hashedPassword = await bcrypt.hash("adminpassword", 10);
      await db.insert(users).values({
        username: "michele",
        password: hashedPassword,
        fullName: "Michele Ardoni",
        email: "michele@experviser.com",
        role: "super_admin",
        status: "active"
      });
      
      console.log("Utente super admin creato con successo");
    }
  } catch (error) {
    console.error("Errore durante la verifica/creazione del super admin:", error);
  }
  
  // Verifica e crea le fasi della pipeline
  try {
    const existingStages = await db.select().from(pipelineStages);
    
    if (existingStages.length === 0) {
      console.log("Creazione pipeline stages...");
      
      // Crea le fasi della pipeline
      await db.insert(pipelineStages).values([
        { name: "Qualifica Lead", order: 1 },
        { name: "Primo Contatto", order: 2 },
        { name: "Analisi Esigenze", order: 3 },
        { name: "Proposta", order: 4 },
        { name: "Negoziazione", order: 5 },
        { name: "Contratto", order: 6 },
        { name: "Chiuso (Vinto)", order: 7 },
        { name: "Chiuso (Perso)", order: 8 }
      ]);
      
      console.log("Pipeline stages create con successo");
    } else {
      console.log(`${existingStages.length} pipeline stages già esistenti`);
    }
  } catch (error) {
    console.error("Errore durante la verifica/creazione delle pipeline stages:", error);
  }
  
  console.log("Inizializzazione del database PostgreSQL completata");
}