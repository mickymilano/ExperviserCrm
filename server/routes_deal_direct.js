// Implementazione diretta della rotta /api/deals/:id con PostgreSQL puro
const { pool } = require('./db');

async function getDealById(req, res) {
  console.log(`[DIRECT] Retrieving deal ${req.params.id}`);
  
  try {
    const dealId = parseInt(req.params.id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({ message: 'ID deal non valido' });
    }
    
    // Query per il deal
    const dealResult = await pool.query('SELECT * FROM deals WHERE id = $1', [dealId]);
    
    if (dealResult.rows.length === 0) {
      console.log(`[DIRECT] Deal ${dealId} not found`);
      return res.status(404).json({ message: 'Deal non trovato' });
    }
    
    const deal = dealResult.rows[0];
    
    // Convertiamo in camelCase
    const dealData = {
      id: deal.id,
      name: deal.name,
      value: deal.value,
      stageId: deal.stage_id,
      contactId: deal.contact_id,
      companyId: deal.company_id,
      expectedCloseDate: deal.expected_close_date,
      notes: deal.notes,
      tags: deal.tags,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
      status: deal.status,
      lastContactedAt: deal.last_contacted_at,
      nextFollowUpAt: deal.next_follow_up_at,
      branchId: deal.branch_id
    };
    
    // Ottieni informazioni di contatto
    let contactData = null;
    if (dealData.contactId) {
      const contactResult = await pool.query('SELECT * FROM contacts WHERE id = $1', [dealData.contactId]);
      
      if (contactResult.rows.length > 0) {
        const contact = contactResult.rows[0];
        contactData = {
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          status: contact.status
        };
      }
    }
    
    // Ottieni informazioni di azienda
    let companyData = null;
    if (dealData.companyId) {
      const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [dealData.companyId]);
      
      if (companyResult.rows.length > 0) {
        const company = companyResult.rows[0];
        companyData = {
          id: company.id,
          name: company.name,
          status: company.status,
          address: company.address,
          fullAddress: company.full_address,
          email: company.email,
          phone: company.phone,
          tags: company.tags
        };
      }
    }
    
    // Ottieni informazioni di stage
    let stageData = null;
    if (dealData.stageId) {
      const stageResult = await pool.query('SELECT * FROM pipeline_stages WHERE id = $1', [dealData.stageId]);
      
      if (stageResult.rows.length > 0) {
        const stage = stageResult.rows[0];
        stageData = {
          id: stage.id,
          name: stage.name,
          order: stage.order
        };
      }
    }
    
    // Assembla l'oggetto finale
    const responseData = {
      ...dealData,
      contact: contactData,
      company: companyData,
      stage: stageData
    };
    
    console.log(`[DIRECT] Successfully retrieved deal ${dealId}`);
    return res.json(responseData);
    
  } catch (error) {
    console.error('[DIRECT] Error retrieving deal:', error);
    return res.status(500).json({ message: 'Errore durante il recupero del deal' });
  }
}

module.exports = { getDealById };