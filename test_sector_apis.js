// Script per testare le API di settori, sottosettori e job titles
import fetch from 'node-fetch';

// URL di base per le richieste API
const baseUrl = 'http://localhost:5173'; // Il server dovrebbe essere in esecuzione su questa porta

async function testSectorApis() {
  try {
    console.log('Inizio test API per settori, sottosettori e job titles');
    
    // Test 1: Creazione di un settore
    console.log('\n--- Test 1: Creazione di un settore ---');
    const sectorResponse = await fetch(`${baseUrl}/api/sectors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Informatica',
      }),
    });
    
    if (!sectorResponse.ok) {
      throw new Error(`Errore nella creazione del settore: ${sectorResponse.status} ${sectorResponse.statusText}`);
    }
    
    const sector = await sectorResponse.json();
    console.log('Settore creato con successo:', sector);
    
    // Test 2: Recupero di tutti i settori
    console.log('\n--- Test 2: Recupero di tutti i settori ---');
    const sectorsResponse = await fetch(`${baseUrl}/api/sectors`);
    
    if (!sectorsResponse.ok) {
      throw new Error(`Errore nel recupero dei settori: ${sectorsResponse.status} ${sectorsResponse.statusText}`);
    }
    
    const sectors = await sectorsResponse.json();
    console.log('Settori recuperati con successo:', sectors);
    
    // Se abbiamo creato un settore, possiamo procedere con il test per i sottosettori
    if (sector && sector.id) {
      // Test 3: Creazione di un sottosettore
      console.log(`\n--- Test 3: Creazione di un sottosettore per il settore ${sector.id} ---`);
      const subSectorResponse = await fetch(`${baseUrl}/api/sub-sectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectorId: sector.id,
          name: 'Sviluppo Software',
        }),
      });
      
      if (!subSectorResponse.ok) {
        throw new Error(`Errore nella creazione del sottosettore: ${subSectorResponse.status} ${subSectorResponse.statusText}`);
      }
      
      const subSector = await subSectorResponse.json();
      console.log('Sottosettore creato con successo:', subSector);
      
      // Test 4: Recupero dei sottosettori per un settore
      console.log(`\n--- Test 4: Recupero dei sottosettori per il settore ${sector.id} ---`);
      const subSectorsResponse = await fetch(`${baseUrl}/api/sub-sectors?sectorId=${sector.id}&search=`);
      
      if (!subSectorsResponse.ok) {
        throw new Error(`Errore nel recupero dei sottosettori: ${subSectorsResponse.status} ${subSectorsResponse.statusText}`);
      }
      
      const subSectors = await subSectorsResponse.json();
      console.log('Sottosettori recuperati con successo:', subSectors);
      
      // Se abbiamo creato un sottosettore, possiamo procedere con il test per i job titles
      if (subSector && subSector.id) {
        // Test 5: Creazione di un job title
        console.log(`\n--- Test 5: Creazione di un job title per il sottosettore ${subSector.id} ---`);
        const jobTitleResponse = await fetch(`${baseUrl}/api/job-titles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subSectorId: subSector.id,
            name: 'Senior Developer',
          }),
        });
        
        if (!jobTitleResponse.ok) {
          throw new Error(`Errore nella creazione del job title: ${jobTitleResponse.status} ${jobTitleResponse.statusText}`);
        }
        
        const jobTitle = await jobTitleResponse.json();
        console.log('Job title creato con successo:', jobTitle);
        
        // Test 6: Recupero dei job titles per un sottosettore
        console.log(`\n--- Test 6: Recupero dei job titles per il sottosettore ${subSector.id} ---`);
        const jobTitlesResponse = await fetch(`${baseUrl}/api/job-titles?subSectorId=${subSector.id}&search=`);
        
        if (!jobTitlesResponse.ok) {
          throw new Error(`Errore nel recupero dei job titles: ${jobTitlesResponse.status} ${jobTitlesResponse.statusText}`);
        }
        
        const jobTitles = await jobTitlesResponse.json();
        console.log('Job titles recuperati con successo:', jobTitles);
      }
    }
    
    console.log('\nTest completati con successo!');
  } catch (error) {
    console.error('Errore durante i test:', error);
  }
}

// Esegui i test
testSectorApis();