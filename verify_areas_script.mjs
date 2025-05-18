// Script per verificare lo stato delle aree di attività
// Usage: node verify_areas_script.mjs

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Crea token di autenticazione
const token = jwt.sign(
  { id: 1, username: 'debug', role: 'super_admin' },
  'experviser-dev-secret',
  { expiresIn: '1h' }
);

async function main() {
  try {
    // 1. Recupera tutti i contatti
    const contactsResponse = await fetch('http://localhost:5000/api/contacts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const contacts = await contactsResponse.json();
    
    console.log(`Trovati ${contacts.length} contatti totali`);
    
    // 2. Recupera l'azienda EasyPoke
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
    
    // 3. Verifica le aree di attività create recentemente
    for (let i = 62; i <= 70; i++) {
      try {
        const areasResponse = await fetch(`http://localhost:5000/api/contacts/${i}/areas-of-activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (areasResponse.status === 404) {
          console.log(`Il contatto ${i} non esiste.`);
          continue;
        }
        
        const areas = await areasResponse.json();
        console.log(`Contatto ${i} ha ${areas.length} aree di attività.`);
        
        if (areas.length > 0) {
          console.log('  Dettagli:', JSON.stringify(areas, null, 2));
        }
      } catch (err) {
        console.error(`Errore verificando il contatto ${i}:`, err.message);
      }
    }
    
    // 4. Recupera i contatti dell'azienda
    const companyContactsResponse = await fetch(`http://localhost:5000/api/companies/${easyPoke.id}/contacts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const companyContacts = await companyContactsResponse.json();
    console.log(`Azienda EasyPoke ha ${companyContacts.length} contatti associati:`);
    companyContacts.forEach(c => {
      console.log(` - ${c.id}: ${c.firstName} ${c.lastName} (${c.companyEmail})`);
    });
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

main();
