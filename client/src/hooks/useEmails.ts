import { useQuery } from '@tanstack/react-query';
import { generateMockEmails } from '../mock/mockEmailData';

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
  accountInfo?: {
    id: number;
    name: string;
  };
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
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
    console.log("Fetching emails with options:", options);
    
    // IMPLEMENTAZIONE TEMPORANEA CON DATI SIMULATI
    // In una versione di produzione, questo verrebbe sostituito con chiamate API reali
    
    if (entityId && entityType) {
      // Genera dati simulati personalizzati per questo tipo di entità
      return generateMockEmails(entityType, entityId);
    } else if (accountId) {
      // Genera dati simulati per un account specifico
      return [
        {
          id: 1001,
          from: 'cliente@example.com',
          fromName: 'Cliente Demo',
          to: [`account${accountId}@example.com`],
          subject: 'Email di prova account',
          body: '<p>Questo è il corpo dell\'email di prova per l\'account.</p>',
          date: new Date().toISOString(),
          read: false,
          hasAttachments: false,
          accountId: accountId
        }
      ];
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