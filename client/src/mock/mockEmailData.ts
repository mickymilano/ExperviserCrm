/**
 * Dati di esempio per email usati solo nei test e demo
 * Da sostituire con implementazione API reale in produzione
 */

export interface MockEmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  isDefault: boolean;
}

export interface MockEmailSignature {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface MockEmail {
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
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  accountId: number;
}

// Account email di esempio
export const mockEmailAccounts: MockEmailAccount[] = [
  {
    id: 1,
    name: 'Gmail',
    email: 'user@gmail.com',
    provider: 'gmail',
    isDefault: true
  },
  {
    id: 2,
    name: 'Outlook Aziendale',
    email: 'user@azienda.com',
    provider: 'outlook',
    isDefault: false
  }
];

// Firme email di esempio
export const mockEmailSignatures: MockEmailSignature[] = [
  {
    id: 1,
    name: 'Firma Aziendale',
    content: `<div style="font-family: Arial, sans-serif;">
      <p>Mario Rossi</p>
      <p style="color: #666; margin: 0;">Account Manager</p>
      <p style="color: #666; margin: 0;">Experviser CRM</p>
      <p style="color: #666; margin: 0;">Tel: +39 02 1234567</p>
      <p style="color: #666; margin: 0;">Email: mario.rossi@experviser.com</p>
    </div>`,
    isDefault: true
  },
  {
    id: 2,
    name: 'Firma Personale',
    content: `<div style="font-family: Arial, sans-serif;">
      <p>Mario Rossi</p>
      <p style="color: #666; margin: 0;">Email: mario.rossi@gmail.com</p>
      <p style="color: #666; margin: 0;">Tel: +39 333 1234567</p>
    </div>`,
    isDefault: false
  }
];

// Funzione per generare email di esempio per un'entità specifica
export function generateMockEmails(entityType: string, entityId: number, count = 3): MockEmail[] {
  const entityTypes: Record<string, { label: string; prefix: string }> = {
    contact: { label: 'Contatto', prefix: 'ID' },
    lead: { label: 'Lead', prefix: 'LEAD' },
    company: { label: 'Azienda', prefix: 'COMPANY' },
    branch: { label: 'Filiale', prefix: 'BRANCH' },
    deal: { label: 'Opportunità', prefix: 'DEAL' }
  };
  
  const currentDate = new Date();
  const entityInfo = entityTypes[entityType] || { label: 'Entità', prefix: 'ID' };
  
  return Array(count).fill(0).map((_, index) => {
    const daysAgo = index * 2; // Ogni email è separata di 2 giorni
    const emailDate = new Date(currentDate);
    emailDate.setDate(emailDate.getDate() - daysAgo);
    
    const account = mockEmailAccounts[index % mockEmailAccounts.length];
    const hasAttachments = index % 3 === 0; // Ogni terza email ha allegati
    
    let attachments = undefined;
    if (hasAttachments) {
      attachments = [
        {
          name: 'documento.pdf',
          size: 256000,
          type: 'application/pdf'
        }
      ];
    }
    
    return {
      id: 1000 + index,
      from: index % 2 === 0 ? 'cliente@example.com' : account.email,
      fromName: index % 2 === 0 ? 'Cliente Demo' : `Account ${account.name}`,
      to: index % 2 === 0 ? [account.email] : ['cliente@example.com', 'altro@example.com'],
      cc: index % 3 === 0 ? ['cc@example.com'] : [],
      bcc: index % 4 === 0 ? ['bcc@example.com'] : [],
      subject: `${index === 0 ? 'RE: ' : ''}${entityInfo.label} ${entityId} - ${
        index === 0 ? 'Risposta a richiesta informazioni' : 
        index === 1 ? 'Aggiornamento stato' : 
        'Dettagli progetto'
      }`,
      body: `<p>Gentile utente,</p>
             <p>Questa è un'email di esempio per ${entityInfo.label} con ID ${entityId}.</p>
             <p>Il riferimento a questa entità è ${entityInfo.prefix}-${entityId}.</p>
             <p>Cordiali saluti,<br />Team CRM</p>`,
      date: emailDate.toISOString(),
      read: index > 0, // Solo la prima email è non letta
      hasAttachments,
      attachments,
      accountId: account.id
    };
  });
}