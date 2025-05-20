/**
 * Servizio per la gestione dei dati email mock
 * Questo file fornisce dati di esempio per le email, utilizzati per lo sviluppo
 * e il testing dell'interfaccia utente prima dell'integrazione con un servizio email reale.
 */

import { format, subDays } from 'date-fns';

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface MockEmail {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  receivedAt: string;
  isRead: boolean;
  attachments: EmailAttachment[];
  starred?: boolean;
  entityId?: string;
  entityType?: 'contact' | 'company' | 'deal' | 'lead';
}

/**
 * Genera dati email di esempio per un'entità specifica
 * @param entityType Tipo di entità (contact, company, deal, lead)
 * @param entityId ID dell'entità
 * @returns Array di email di esempio
 */
export function getMockEmailsForEntity(entityType: string, entityId: string): MockEmail[] {
  console.log(`Generando email mock per ${entityType} con ID ${entityId}`);
  
  // Genera dati diversi in base al tipo di entità per rendere le email più realistiche
  let entitySpecificData = {
    fromName: 'Cliente Generico',
    fromEmail: 'cliente@esempio.com',
    toName: 'CRM Utente',
    customSubject: '',
    customBody: ''
  };
  
  if (entityType === 'contact') {
    entitySpecificData = {
      fromName: 'Mario Rossi',
      fromEmail: 'mario.rossi@esempio.com',
      toName: 'Supporto CRM',
      customSubject: 'Richiesta supporto cliente',
      customBody: 'Buongiorno,\n\nHo bisogno di assistenza per il mio account. Potete contattarmi al più presto?\n\nGrazie,\nMario Rossi'
    };
  } else if (entityType === 'company') {
    entitySpecificData = {
      fromName: 'Azienda ABC Srl',
      fromEmail: 'info@aziendaabc.it',
      toName: 'Ufficio Commerciale',
      customSubject: 'Proposta di collaborazione',
      customBody: '<p>Gentili signori,</p><p>Facendo seguito alla nostra telefonata, vi inviamo la nostra proposta di collaborazione come discusso.</p><p>Restiamo in attesa di un vostro riscontro.</p><p>Cordiali saluti,<br/>Direzione Commerciale<br/>Azienda ABC Srl</p>'
    };
  } else if (entityType === 'deal') {
    entitySpecificData = {
      fromName: 'Luca Bianchi',
      fromEmail: 'l.bianchi@clientexyz.com',
      toName: 'Ufficio Vendite',
      customSubject: 'Conferma ordine #ORD-' + entityId,
      customBody: 'Gentili signori,\n\nCon la presente confermiamo l\'ordine come da preventivo allegato.\n\nVi preghiamo di procedere con la fatturazione.\n\nCordiali saluti,\nLuca Bianchi\nResponsabile Acquisti\nCliente XYZ'
    };
  } else if (entityType === 'lead') {
    entitySpecificData = {
      fromName: 'Potenziale Cliente',
      fromEmail: 'nuovo@prospect.it',
      toName: 'Marketing CRM',
      customSubject: 'Richiesta informazioni prodotti',
      customBody: 'Salve,\n\nHo visto i vostri prodotti online e sarei interessato a ricevere maggiori informazioni e un preventivo.\n\nGrazie per l\'attenzione,\nNuovo Potenziale Cliente'
    };
  }
  
  // Genera le email di esempio
  return [
    {
      id: "1",
      fromEmail: entitySpecificData.fromEmail,
      fromName: entitySpecificData.fromName,
      toEmail: 'assistenza@miocrm.it',
      toName: entitySpecificData.toName,
      subject: entitySpecificData.customSubject || 'Richiesta informazioni',
      body: entitySpecificData.customBody || 'Buongiorno,\n\nVorrei sapere di più sui vostri servizi. Potreste inviarmi un preventivo per il pacchetto completo?\n\nCordiali saluti,\nMario Rossi',
      bodyType: entitySpecificData.customBody.includes('<p>') ? 'html' : 'text',
      isRead: false,
      receivedAt: new Date().toISOString(),
      attachments: [],
      entityId: entityId,
      entityType: entityType as any,
      starred: false
    },
    {
      id: "2",
      fromEmail: 'assistenza@miocrm.it',
      fromName: 'Supporto CRM',
      toEmail: entitySpecificData.fromEmail,
      toName: entitySpecificData.fromName,
      subject: `Re: ${entitySpecificData.customSubject || 'Richiesta informazioni'}`,
      body: `Gentile ${entitySpecificData.fromName},\n\nGrazie per averci contattato. Abbiamo ricevuto la sua richiesta e la stiamo elaborando.\n\nUn nostro consulente la contatterà entro 24 ore.\n\nCordiali saluti,\nTeam di Supporto CRM`,
      bodyType: 'text',
      isRead: true,
      receivedAt: subDays(new Date(), 1).toISOString(),
      attachments: [
        {
          id: "att1",
          filename: "preventivo.pdf",
          contentType: "application/pdf",
          size: 1024 * 1024 * 1.5 // 1.5 MB
        }
      ],
      entityId: entityId,
      entityType: entityType as any,
      starred: true
    },
    {
      id: "3",
      fromEmail: 'marketing@fornitore.it',
      fromName: 'Marketing Fornitore Spa',
      toEmail: 'assistenza@miocrm.it',
      toName: 'Supporto CRM',
      subject: 'Offerta commerciale esclusiva',
      body: '<p>Gentile cliente,</p><p>Vi inviamo la nostra <strong>migliore offerta</strong> per i prodotti richiesti.</p><p>Sono disponibili sconti speciali per ordini superiori a €5000.</p><p>Cordiali saluti,<br/>Team Marketing<br/>Fornitore Spa</p>',
      bodyType: 'html',
      isRead: false,
      receivedAt: subDays(new Date(), 3).toISOString(),
      attachments: [
        {
          id: "att2",
          filename: "catalogo_2025.pdf",
          contentType: "application/pdf",
          size: 1024 * 1024 * 3.2 // 3.2 MB
        },
        {
          id: "att3",
          filename: "listino_prezzi.xlsx",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          size: 1024 * 512 // 512 KB
        }
      ],
      entityId: entityId,
      entityType: entityType as any,
      starred: false
    }
  ];
}

/**
 * Restituisce il numero totale di email non lette per l'utente corrente
 * @returns Numero di email non lette
 */
export function getUnreadEmailCount(): number {
  // In produzione, questa funzione dovrebbe interrogare il database
  // o un servizio email per ottenere il conteggio reale
  return 4;
}

/**
 * Simula il comportamento di un'API per segnare un'email come letta
 * @param emailId ID dell'email da segnare come letta
 * @returns Oggetto con il risultato dell'operazione
 */
export function markEmailAsRead(emailId: string): { success: boolean, message: string } {
  console.log(`Segnando l'email ${emailId} come letta`);
  return {
    success: true,
    message: "Email segnata come letta con successo"
  };
}

/**
 * Simula l'invio di una risposta a un'email
 * @param emailId ID dell'email a cui rispondere
 * @param content Contenuto della risposta
 * @returns Oggetto con il risultato dell'operazione
 */
export function sendEmailReply(emailId: string, content: string): { success: boolean, message: string } {
  console.log(`Inviando risposta all'email ${emailId}`);
  return {
    success: true,
    message: "Risposta inviata con successo"
  };
}

/**
 * Simula l'invio di una nuova email
 * @param data Dati dell'email da inviare
 * @returns Oggetto con il risultato dell'operazione
 */
export function sendNewEmail(data: {
  to: string;
  subject: string;
  body: string;
  entityId: string;
  entityType: string;
}): { success: boolean, message: string } {
  console.log(`Inviando nuova email a ${data.to}`);
  return {
    success: true,
    message: "Email inviata con successo"
  };
}