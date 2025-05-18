// Script per testare le associazioni tra contatti e aziende
// Utilizzo: NODE_OPTIONS=--experimental-fetch node test_easy_poke_contacts.js

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Crea token di autenticazione
const token = jwt.sign(
  { id: 1, username: 'debug', role: 'super_admin' },
  'experviser-dev-secret',
  { expiresIn: '1h' }
);

// Funzione per attesa
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  try {
    // 1. Recupera l'azienda EasyPoke
    console.log("Cercando azienda EasyPoke...");
    const companiesResponse = await fetch('http://localhost:5000/api/companies', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const companies = await companiesResponse.json();
    const easyPoke = companies.find(c => c.name === 'EasyPoke');
    
    if (!easyPoke) {
      console.error('Azienda EasyPoke non trovata!');
      return;
    }
    
    console.log(`Azienda EasyPoke trovata con ID: ${easyPoke.id}`);
    
    // 2. Crea un nuovo contatto associato all'azienda EasyPoke
    const contactName = `TestContact_${Date.now().toString().slice(-6)}`;
    console.log(`Creazione contatto ${contactName}...`);
    
    const contactData = {
      firstName: contactName,
      lastName: "Test",
      companyEmail: `${contactName.toLowerCase()}@example.com`,
      mobilePhone: "+39 333 1234567",
      areasOfActivity: [
        {
          companyId: easyPoke.id,
          companyName: easyPoke.name,
          isPrimary: true,
          role: "Tester",
          jobDescription: "Test di integrazione"
        }
      ]
    };
    
    const contactResponse = await fetch('http://localhost:5000/api/contacts', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error(`Errore creazione contatto: ${contactResponse.status} - ${errorText}`);
      return;
    }
    
    const contact = await contactResponse.json();
    console.log(`Contatto creato con ID: ${contact.id}`);
    
    // 3. Attendi un attimo e verifica che il contatto sia associato all'azienda
    console.log("Attendo la propagazione dell'associazione...");
    await sleep(1000);
    
    // 4. Verifica associazione tramite l'endpoint dedicato
    let found = false;
    let attempt = 1;
    const maxAttempts = 5;
    
    while (!found && attempt <= maxAttempts) {
      console.log(`Tentativo ${attempt}/${maxAttempts} di verifica associazione...`);
      
      const companyContactsResponse = await fetch(`http://localhost:5000/api/companies/${easyPoke.id}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!companyContactsResponse.ok) {
        console.error(`Errore recuperando contatti dell'azienda: ${companyContactsResponse.status}`);
        break;
      }
      
      const companyContacts = await companyContactsResponse.json();
      
      found = companyContacts.some(c => c.id === contact.id);
      
      if (found) {
        console.log(`✅ Contatto ${contactName} trovato correttamente nell'elenco dell'azienda!`);
      } else {
        console.log(`❌ Contatto ${contactName} NON trovato nell'elenco dell'azienda (${companyContacts.length} contatti totali)`);
        
        // Controllo dettagliato aree di attività
        console.log("Verifico aree di attività per diagnosi...");
        const areasResponse = await fetch(`http://localhost:5000/api/areas-of-activity?contactId=${contact.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (areasResponse.ok) {
          const areas = await areasResponse.json();
          console.log(`Aree di attività per il contatto ${contact.id}:`, areas);
        }
        
        await sleep(1000);
        attempt++;
      }
    }
    
    if (!found) {
      console.error("❌ Test fallito! Il contatto non è stato associato all'azienda dopo multipli tentativi.");
      
      // Diagnosi finale
      console.log("\n=== DIAGNOSI FINALE ===");
      
      console.log("\n1. Verifica implementazione createContact in postgresStorage.ts");
      console.log("2. Verifica implementazione getContactsByCompany in postgresStorage.ts");
      console.log("3. Verifica che le aree di attività vengano create con i valori corretti");
      console.log("4. Verifica che le query SQL usino i nomi di colonna e tabella corretti");
    }
    
  } catch (error) {
    console.error('Errore fatale:', error);
  }
}

main();
