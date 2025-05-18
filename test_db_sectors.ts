import { db } from './server/db';
import { sql } from 'drizzle-orm';
import { sectors, sub_sectors, job_titles } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testSectorTables() {
  try {
    console.log("=== Test delle tabelle di settori, sottosettori e job titles ===\n");
    
    // Test 1: Inserimento di un settore
    console.log("--- Test 1: Inserimento di un settore ---");
    const [sector] = await db
      .insert(sectors)
      .values({ name: "Informatica" })
      .returning();
    console.log("Settore inserito:", sector);
    
    // Test 2: Recupero di tutti i settori
    console.log("\n--- Test 2: Recupero di tutti i settori ---");
    const sectorsList = await db
      .select()
      .from(sectors);
    console.log("Settori recuperati:", sectorsList);
    
    // Test 3: Inserimento di un sottosettore
    console.log("\n--- Test 3: Inserimento di un sottosettore ---");
    const [subSector] = await db
      .insert(sub_sectors)
      .values({ 
        sectorId: sector.id, 
        name: "Sviluppo Software" 
      })
      .returning();
    console.log("Sottosettore inserito:", subSector);
    
    // Test 4: Recupero dei sottosettori per un settore
    console.log("\n--- Test 4: Recupero dei sottosettori per un settore ---");
    const subSectorsList = await db
      .select()
      .from(sub_sectors)
      .where(eq(sub_sectors.sectorId, sector.id));
    console.log("Sottosettori recuperati:", subSectorsList);
    
    // Test 5: Inserimento di un job title
    console.log("\n--- Test 5: Inserimento di un job title ---");
    const [jobTitle] = await db
      .insert(job_titles)
      .values({ 
        subSectorId: subSector.id, 
        name: "Senior Developer" 
      })
      .returning();
    console.log("Job title inserito:", jobTitle);
    
    // Test 6: Recupero dei job titles per un sottosettore
    console.log("\n--- Test 6: Recupero dei job titles per un sottosettore ---");
    const jobTitlesList = await db
      .select()
      .from(job_titles)
      .where(eq(job_titles.subSectorId, subSector.id));
    console.log("Job titles recuperati:", jobTitlesList);
    
    console.log("\n=== Test completati con successo! ===");
  } catch (error) {
    console.error("Errore durante i test:", error);
  } finally {
    // Chiudiamo la connessione dopo i test
    await db.end();
  }
}

testSectorTables();