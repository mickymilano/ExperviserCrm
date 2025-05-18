import { PostgresStorage } from './server/postgresStorage.js';

const storage = new PostgresStorage();

async function testSectorAPI() {
  try {
    console.log("=== Test della gerarchia Settori/Sottosettori/Job Titles ===\n");
    
    // Test 1: Creazione di un settore
    console.log("--- Test 1: Creazione di un settore ---");
    const sector = await storage.createSector({ name: "Informatica" });
    console.log("Settore creato:", sector);
    
    // Test 2: Recupero di tutti i settori
    console.log("\n--- Test 2: Recupero di tutti i settori ---");
    const sectors = await storage.getSectors();
    console.log("Settori recuperati:", sectors);
    
    // Test 3: Creazione di un sottosettore
    console.log("\n--- Test 3: Creazione di un sottosettore ---");
    const subSector = await storage.createSubSector({ 
      sectorId: sector.id, 
      name: "Sviluppo Software" 
    });
    console.log("Sottosettore creato:", subSector);
    
    // Test 4: Recupero dei sottosettori per un settore
    console.log("\n--- Test 4: Recupero dei sottosettori per un settore ---");
    const subSectors = await storage.getSubSectors({ 
      sectorId: sector.id, 
      search: "" 
    });
    console.log("Sottosettori recuperati:", subSectors);
    
    // Test 5: Creazione di un job title
    console.log("\n--- Test 5: Creazione di un job title ---");
    const jobTitle = await storage.createJobTitle({ 
      subSectorId: subSector.id, 
      name: "Senior Developer" 
    });
    console.log("Job title creato:", jobTitle);
    
    // Test 6: Recupero dei job titles per un sottosettore
    console.log("\n--- Test 6: Recupero dei job titles per un sottosettore ---");
    const jobTitles = await storage.getJobTitles({ 
      subSectorId: subSector.id, 
      search: "" 
    });
    console.log("Job titles recuperati:", jobTitles);
    
    console.log("\n=== Test completati con successo! ===");
  } catch (error) {
    console.error("Errore durante i test:", error);
  }
}

testSectorAPI();