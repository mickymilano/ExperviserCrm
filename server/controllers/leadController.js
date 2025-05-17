import { storage } from '../postgresStorage.js';

export async function listLeads(req, res, next) {
  try {
    const leads = await storage.getLeads();
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei lead' });
  }
}

export async function getLead(req, res, next) {
  try {
    const lead = await storage.getLead(+req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead non trovato' });
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Errore durante il recupero del lead' });
  }
}

export async function createLead(req, res, next) {
  try {
    const lead = await storage.createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Errore durante la creazione del lead' });
  }
}

export async function updateLead(req, res, next) {
  try {
    const leadId = +req.params.id;
    const lead = await storage.getLead(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead non trovato' });
    
    const updatedLead = await storage.updateLead(leadId, req.body);
    res.json(updatedLead || { id: leadId, ...req.body });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento del lead' });
  }
}

export async function deleteLead(req, res, next) {
  try {
    const leadId = +req.params.id;
    const lead = await storage.getLead(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead non trovato' });
    
    await storage.deleteLead(leadId);
    res.status(200).json({ message: 'Lead eliminato con successo' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione del lead' });
  }
}

export async function convertLead(req, res, next) {
  try {
    const leadId = +req.params.id;
    const lead = await storage.getLead(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead non trovato' });

    let companyId = null;
    let contact = null;

    // Se il lead ha un'azienda, crearla prima
    if (lead.company) {
      const company = await storage.createCompany({ 
        name: lead.company,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        website: lead.website
      });
      companyId = company.id;
    }
    
    // Crea il contatto
    contact = await storage.createContact({
      firstName: lead.firstName,
      lastName: lead.lastName,
      status: "active", // Il contatto convertito è attivo per default
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
      customFields: lead.customFields
    });
    
    // Se abbiamo creato un'azienda, associa il contatto all'azienda
    if (companyId) {
      await storage.createAreaOfActivity({
        contactId: contact.id,
        companyId: companyId,
        role: lead.role || "Convertito da lead"
      });
    }
    
    // Aggiorna lo stato del lead a "converted"
    await storage.updateLead(leadId, { status: 'converted' });
    
    res.status(200).json({ 
      message: 'Lead convertito con successo', 
      contact: contact,
      companyId: companyId
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ message: 'Errore durante la conversione del lead' });
  }
}

export default {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead
};