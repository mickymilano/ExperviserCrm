// Script per diagnosticare il problema delle associazioni tra contatti e aziende
// Usage: node debug_company_contacts.js

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
    // 1. Recupera l'azienda EasyPoke
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

    // 2. Interroga direttamente aree di attività per questa azienda
    const areasResponse = await fetch(`http://localhost:5000/api/areas-of-activity?companyId=${easyPoke.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!areasResponse.ok) {
      console.error(`Errore recuperando aree di attività: ${areasResponse.status}`);
      return;
    }
    
    const areas = await areasResponse.json();
    console.log(`Trovate ${areas.length} aree di attività per l'azienda EasyPoke`);
    
    if (areas.length > 0) {
      console.log('Dettagli delle aree di attività:');
      areas.forEach(area => {
        console.log(`- Area ID ${area.id}: ContactID=${area.contactId}, CompanyID=${area.companyId}, Primary=${area.isPrimary}, Role=${area.role || 'N/A'}`);
      });
      
      // 3. Verifica i contatti direttamente dal DB
      for (const area of areas) {
        const contactResponse = await fetch(`http://localhost:5000/api/contacts/${area.contactId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (contactResponse.ok) {
          const contact = await contactResponse.json();
          console.log(`Contatto ${area.contactId} trovato: ${contact.firstName} ${contact.lastName}`);
        } else {
          console.error(`Contatto ${area.contactId} NON trovato! Status: ${contactResponse.status}`);
        }
      }
    }
    
    // 4. Recupera i contatti dell'azienda usando l'endpoint dedicato
    const companyContactsResponse = await fetch(`http://localhost:5000/api/companies/${easyPoke.id}/contacts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!companyContactsResponse.ok) {
      console.error(`Errore recuperando contatti dell'azienda: ${companyContactsResponse.status}`);
      return;
    }
    
    const companyContacts = await companyContactsResponse.json();
    console.log(`L'API ha restituito ${companyContacts.length} contatti per l'azienda EasyPoke`);
    
    if (companyContacts.length > 0) {
      console.log('Contatti dell\'azienda:');
      companyContacts.forEach(c => {
        console.log(`- ${c.id}: ${c.firstName} ${c.lastName} (${c.companyEmail})`);
      });
    }
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

main();
