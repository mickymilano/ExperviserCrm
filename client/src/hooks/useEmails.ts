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
  accountInfo?: {
    id: number;
    name: string;
  };
}

interface UseEmailsOptions {
  accountId?: number;
  folder?: string;
  entityId?: number;
  entityType?: string;
}

// Generazione di dati fittizi per demo
const generateMockEmails = (entityType: string, entityId: number, count = 3): Email[] => {
  const mockAccounts = [
    { id: 1, name: 'Gmail', email: 'account@gmail.com' },
    { id: 2, name: 'Outlook', email: 'office@outlook.com' }
  ];
  
  const entityTypes = {
    contact: { label: 'Contatto', prefix: 'ID' },
    lead: { label: 'Lead', prefix: 'LEAD' },
    company: { label: 'Azienda', prefix: 'COMPANY' },
    branch: { label: 'Filiale', prefix: 'BRANCH' },
    deal: { label: 'Deal', prefix: 'DEAL' }
  };
  
  const currentDate = new Date();
  
  return Array(count).fill(0).map((_, index) => {
    const daysAgo = index * 2; // Ogni email è separata di 2 giorni
    const emailDate = new Date(currentDate);
    emailDate.setDate(emailDate.getDate() - daysAgo);
    
    const account = mockAccounts[index % mockAccounts.length];
    const hasAttachments = index % 3 === 0; // Ogni terza email ha allegati
    
    const entityInfo = entityTypes[entityType as keyof typeof entityTypes];
    
    return {
      id: 1000 + index,
      from: index % 2 === 0 ? 'cliente@example.com' : account.email,
      fromName: index % 2 === 0 ? 'Cliente Demo' : `Account ${account.name}`,
      to: index % 2 === 0 ? [account.email] : ['cliente@example.com', 'altro@example.com'],
      cc: index % 3 === 0 ? ['cc@example.com'] : [],
      bcc: index % 4 === 0 ? ['bcc@example.com'] : [],
      subject: `${index === 0 ? 'RE: ' : ''}${entityInfo.label} ${entityId} - ${index === 0 ? 'Risposta a richiesta informazioni' : index === 1 ? 'Aggiornamento stato' : 'Dettagli progetto'}`,
      body: `<p>Gentile utente,</p>
             <p>Questa è un'email di esempio per ${entityInfo.label} con ID ${entityId}.</p>
             <p>Il riferimento a questa entità è ${entityInfo.prefix}-${entityId}.</p>
             <p>Cordiali saluti,<br />Team CRM</p>`,
      date: emailDate.toISOString(),
      read: index > 0, // Solo la prima email è non letta
      hasAttachments,
      accountId: account.id,
      accountInfo: {
        id: account.id,
        name: account.name
      }
    };
  });
};

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