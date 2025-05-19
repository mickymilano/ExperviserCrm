import { useQuery } from '@tanstack/react-query';

export interface Email {
  id: number;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  date: string;
  read: boolean;
  hasAttachments: boolean;
  accountId: number;
}

interface UseEmailsOptions {
  accountId?: number;
  folder?: string;
  entityId?: number;
  entityType?: string;
}

export function useEmails(options: UseEmailsOptions = {}) {
  const { accountId, folder = 'INBOX', entityId, entityType } = options;
  
  // Se abbiamo entityId e entityType, utilizziamo l'endpoint filtrato
  const queryKey = entityId && entityType 
    ? [`/api/email/filter/${entityType}/${entityId}`]
    : [`/api/email/accounts/${accountId}/messages`, folder];

  const queryFn = async () => {
    if (entityId && entityType) {
      // In produzione, questo endpoint filtrerebbe le email nel backend
      // Qui utilizziamo una logica temporanea 
      
      // 1. Ottieni tutti gli account email disponibili
      const accountsResponse = await fetch('/api/email/accounts');
      const accounts = await accountsResponse.json();
      
      // 2. Recupera le email da tutti gli account e filtra client-side (soluzione temporanea)
      const allEmails: Email[] = [];
      
      if (accounts && accounts.length > 0) {
        for (const account of accounts) {
          try {
            const response = await fetch(`/api/email/accounts/${account.id}/messages?folder=${folder}`);
            if (response.ok) {
              const messages = await response.json();
              if (Array.isArray(messages)) {
                // Aggiungi informazioni sull'account a ciascuna email
                messages.forEach(message => {
                  allEmails.push({
                    ...message,
                    accountInfo: {
                      id: account.id,
                      name: account.name || account.email.split('@')[1] || 'Email',
                    }
                  });
                });
              }
            }
          } catch (error) {
            console.error(`Errore nel recupero delle email dall'account ${account.id}:`, error);
          }
        }
      }
      
      // In una implementazione reale, questo filtro sarebbe eseguito lato server
      // Per ora facciamo un semplice matching testuale
      return allEmails.filter(email => {
        // In base al tipo di entità, applica filtri diversi
        switch (entityType) {
          case 'contact':
          case 'lead':
            // Cerca nelle email che menzionano l'ID del contatto/lead
            return (
              email.subject?.includes(`ID-${entityId}`) ||
              email.body?.includes(`ID-${entityId}`)
            );
          
          case 'company':
            // Cerca nelle email che menzionano l'ID dell'azienda
            return (
              email.subject?.includes(`COMPANY-${entityId}`) ||
              email.body?.includes(`COMPANY-${entityId}`)
            );
            
          case 'branch':
            // Cerca nelle email che menzionano l'ID della filiale
            return (
              email.subject?.includes(`BRANCH-${entityId}`) ||
              email.body?.includes(`BRANCH-${entityId}`)
            );
            
          case 'deal':
            // Cerca nelle email che menzionano l'ID del deal
            return (
              email.subject?.includes(`DEAL-${entityId}`) ||
              email.body?.includes(`DEAL-${entityId}`)
            );
            
          default:
            return false;
        }
      });
    } else if (accountId) {
      // Recupera le email per un account specifico
      const response = await fetch(
        `/api/email/accounts/${accountId}/messages?folder=${folder}`
      );
      const data = await response.json();
      
      // Assicurati che la risposta sia un array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // Se la risposta è un oggetto, cerca property che potrebbero contenere l'array
        const arrayFields = ['messages', 'data', 'emails', 'items'];
        for (const field of arrayFields) {
          if (data[field] && Array.isArray(data[field])) {
            return data[field];
          }
        }
      }
      
      // Se nessuna delle condizioni precedenti è soddisfatta, restituisci un array vuoto
      console.warn('Risposta email non è un array:', data);
      return [];
    }
    
    return [];
  };
  
  const enabled = Boolean(
    (accountId) || (entityId && entityType)
  );
  
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minuti
    refetchOnWindowFocus: true,
  });
}