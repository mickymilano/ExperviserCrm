import { seedTestData } from "./seedTestData";

async function runTestSeed() {
  try {
    console.log("Avvio del seeding dei dati di test...");
    await seedTestData();
    console.log("Seeding dei dati di test completato con successo!");
    process.exit(0);
  } catch (error) {
    console.error("Errore durante l'esecuzione del seeding:", error);
    process.exit(1);
  }
}

runTestSeed();