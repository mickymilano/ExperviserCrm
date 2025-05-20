/**
 * Script di test per la gestione dei dati campione
 * 
 * Questo script può essere eseguito per:
 * 1. Rimuovere tutti i dati campione esistenti
 * 2. Generare nuovi dati campione per il testing
 * 3. Eseguire entrambe le operazioni in sequenza
 */

const { resetAndGenerateTestData } = require('./server/test-data-manager');

async function main() {
  console.log('='.repeat(50));
  console.log('AVVIO GESTIONE DATI CAMPIONE');
  console.log('='.repeat(50));
  
  try {
    console.log('Rimozione e rigenerazione dati campione in corso...');
    const success = await resetAndGenerateTestData();
    
    if (success) {
      console.log('✅ Dati campione rimossi e rigenerati con successo!');
    } else {
      console.error('❌ Si è verificato un errore durante la gestione dei dati campione');
    }
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione:', error);
  }
  
  console.log('='.repeat(50));
}

main().catch(console.error);