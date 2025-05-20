import { storage } from '../../storage';

/**
 * Calcola la similarità tra due stringhe (algoritmo Levenshtein distance)
 * @param str1 Prima stringa
 * @param str2 Seconda stringa
 * @returns Valore di similarità tra 0 e 1 (1 = perfettamente uguale)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;
  
  // Normalizza le stringhe
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Calcolo della distanza di Levenshtein
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Cancellazione
        matrix[i][j - 1] + 1, // Inserimento
        matrix[i - 1][j - 1] + cost // Sostituzione
      );
    }
  }
  
  // Calcola la similarità (1 - distanza normalizzata)
  const maxLength = Math.max(len1, len2);
  if (maxLength === 0) return 1;
  return 1 - matrix[len1][len2] / maxLength;
}

/**
 * Calcola la similarità complessiva tra due record
 * @param record1 Primo record
 * @param record2 Secondo record
 * @param fields Campi da considerare per il calcolo della similarità
 * @returns Valore di similarità tra 0 e 1
 */
function calculateRecordSimilarity(record1: any, record2: any, fields: string[]): number {
  let totalSimilarity = 0;
  let fieldsCount = 0;
  
  for (const field of fields) {
    if (record1[field] && record2[field]) {
      const similarity = calculateStringSimilarity(record1[field].toString(), record2[field].toString());
      totalSimilarity += similarity;
      fieldsCount++;
    }
  }
  
  return fieldsCount > 0 ? totalSimilarity / fieldsCount : 0;
}

/**
 * Rileva i duplicati nei dati di importazione confrontandoli con i record esistenti
 * @param items Elementi da controllare
 * @param entityType Tipo di entità (contacts, companies, leads)
 * @param threshold Soglia di similarità (default 0.7)
 * @returns Array di elementi con potenziali duplicati
 */
export async function detectDuplicates(items: any[], entityType: string, threshold = 0.7) {
  try {
    const duplicates = [];
    
    // Definizione dei campi di confronto per ogni tipo di entità
    const fieldsMap = {
      contacts: ['firstName', 'lastName', 'email', 'phone', 'mobilePhone'],
      companies: ['name', 'email', 'vatNumber', 'website'],
      leads: ['firstName', 'lastName', 'email', 'company']
    };
    
    // Ottiene i campi appropriati per il tipo di entità
    const fields = fieldsMap[entityType] || [];
    
    // Carica i record esistenti dal database
    let existingRecords = [];
    
    switch (entityType) {
      case 'contacts':
        existingRecords = await storage.getContacts();
        break;
      case 'companies':
        existingRecords = await storage.getCompanies();
        break;
      case 'leads':
        existingRecords = await storage.getLeads();
        break;
    }
    
    // Per ogni elemento, cerca duplicati confrontandolo con i record esistenti
    for (const item of items) {
      const potentialDuplicates = [];
      
      for (const existingRecord of existingRecords) {
        const similarity = calculateRecordSimilarity(item, existingRecord, fields);
        
        if (similarity >= threshold) {
          potentialDuplicates.push({
            record: existingRecord,
            similarity: similarity.toFixed(2)
          });
        }
      }
      
      if (potentialDuplicates.length > 0) {
        duplicates.push({
          item,
          duplicates: potentialDuplicates.sort((a, b) => b.similarity - a.similarity)
        });
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error('Errore nel rilevamento dei duplicati:', error);
    throw error;
  }
}