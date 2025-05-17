/**
 * DEPRECATED - Questo file è obsoleto.
 * 
 * Tutte le funzionalità sono state migrate al nuovo controller in leadController.js
 * che gestisce correttamente la struttura della tabella leads.
 * 
 * Non utilizzare queste funzioni - verranno rimosse in future versioni.
 */

// Funzioni vuote per evitare errori in caso di riferimenti esistenti
export const getLeads = async () => {
  console.warn('DEPRECATED: getLeads in leadFunctions.js è obsoleto. Usa il controller leadController.js');
  return [];
};

export const getLead = async (id) => {
  console.warn('DEPRECATED: getLead in leadFunctions.js è obsoleto. Usa il controller leadController.js');
  return null;
};

export const createLead = async (data) => {
  console.warn('DEPRECATED: createLead in leadFunctions.js è obsoleto. Usa il controller leadController.js');
  return null;
};

export const updateLead = async (id, updates) => {
  console.warn('DEPRECATED: updateLead in leadFunctions.js è obsoleto. Usa il controller leadController.js');
  return;
};

export const deleteLead = async (id) => {
  console.warn('DEPRECATED: deleteLead in leadFunctions.js è obsoleto. Usa il controller leadController.js');
  return;
};

export const convertLead = async (id) => {
  console.warn('DEPRECATED: convertLead in leadFunctions.js è obsoleto. Usa il controller leadController.js');
  return { companyId: null, contact: null };
};
