import { Router } from 'express';
import { makeGenericId } from './utils';

const router = Router();

// Dati di esempio per account email
const mockEmailAccounts = [
  {
    id: 1,
    userId: 1,
    name: 'Lavoro',
    email: 'user@example.com',
    isPrimary: true,
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: 'user@example.com',
    imapHost: 'imap.example.com',
    imapPort: 993,
    imapUsername: 'user@example.com',
    useSSL: true,
    lastSynced: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    userId: 1,
    name: 'Personale',
    email: 'personal@example.com',
    isPrimary: false,
    smtpHost: 'smtp.personal.com',
    smtpPort: 587,
    smtpUsername: 'personal@example.com',
    imapHost: 'imap.personal.com',
    imapPort: 993,
    imapUsername: 'personal@example.com',
    useSSL: true,
    lastSynced: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Dati di esempio per firme email
const mockEmailSignatures = [
  {
    id: 1,
    userId: 1,
    name: 'Firma professionale',
    content: '<p>Cordiali saluti,</p><p>Nome Cognome</p><p>Responsabile Vendite | Azienda ABC</p><p>Tel: +39 123 456 7890</p>',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    userId: 1,
    name: 'Firma breve',
    content: '<p>Saluti,</p><p>Nome Cognome</p>',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Funzione per generare email di esempio per un'entità
function generateMockEmails(entityType: string, entityId: number, count = 5) {
  const emails = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const isIncoming = i % 2 === 0;
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    emails.push({
      id: makeGenericId(),
      accountId: 1,
      subject: `Email ${i+1} riguardo ${entityType} #${entityId}`,
      body: `<p>Questa è un'email di esempio ${i+1} per ${entityType} con ID ${entityId}.</p><p>Potrebbe contenere dettagli importanti sul ${entityType} in questione.</p><p>Cordiali saluti,</p><p>${isIncoming ? 'Cliente Esterno' : 'Il tuo nome'}</p>`,
      bodyType: 'text/html',
      from: isIncoming ? 'cliente@esempio.com' : 'user@example.com',
      fromName: isIncoming ? 'Cliente Esterno' : 'Il tuo nome',
      to: isIncoming ? ['user@example.com'] : ['cliente@esempio.com'],
      cc: [],
      bcc: [],
      messageId: `msg_${makeGenericId()}@mail.example.com`,
      date: date.toISOString(),
      receivedDate: isIncoming ? date.toISOString() : null,
      sentDate: !isIncoming ? date.toISOString() : null,
      isRead: i > 1,
      isSent: !isIncoming,
      isDraft: false,
      isStarred: i === 0,
      isTrash: false,
      isSpam: false,
      folder: isIncoming ? 'inbox' : 'sent',
      hasAttachments: i === 1,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    });
  }
  
  return emails;
}

// Endpoint per ottenere gli account email dell'utente
router.get('/accounts', (req, res) => {
  res.json(mockEmailAccounts);
});

// Endpoint per creare un nuovo account email
router.post('/accounts', (req, res) => {
  const newAccount = {
    id: mockEmailAccounts.length + 1,
    userId: 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockEmailAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

// Endpoint per aggiornare un account email
router.patch('/accounts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const accountIndex = mockEmailAccounts.findIndex(acc => acc.id === id);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account email non trovato' });
  }
  
  const updatedAccount = {
    ...mockEmailAccounts[accountIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  mockEmailAccounts[accountIndex] = updatedAccount;
  res.json(updatedAccount);
});

// Endpoint per eliminare un account email
router.delete('/accounts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const accountIndex = mockEmailAccounts.findIndex(acc => acc.id === id);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account email non trovato' });
  }
  
  mockEmailAccounts.splice(accountIndex, 1);
  res.json({ success: true });
});

// Endpoint per impostare un account email come primario
router.post('/accounts/:id/set-primary', (req, res) => {
  const id = parseInt(req.params.id);
  
  // Rimuovi lo stato primario da tutti gli account
  mockEmailAccounts.forEach(account => {
    account.isPrimary = false;
  });
  
  // Imposta come primario l'account specificato
  const account = mockEmailAccounts.find(acc => acc.id === id);
  if (!account) {
    return res.status(404).json({ error: 'Account email non trovato' });
  }
  
  account.isPrimary = true;
  res.json(account);
});

// Endpoint per ottenere le firme email dell'utente
router.get('/signatures', (req, res) => {
  res.json(mockEmailSignatures);
});

// Endpoint per creare una nuova firma email
router.post('/signatures', (req, res) => {
  const newSignature = {
    id: mockEmailSignatures.length + 1,
    userId: 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockEmailSignatures.push(newSignature);
  res.status(201).json(newSignature);
});

// Endpoint per ottenere email filtrate per entità
router.get('/', (req, res) => {
  const entityId = parseInt(req.query.entityId as string);
  const entityType = req.query.entityType as string;
  
  if (!entityId || !entityType) {
    return res.status(400).json({ error: 'Sono richiesti entityId e entityType' });
  }
  
  const emails = generateMockEmails(entityType, entityId);
  
  // Applica filtri se presenti
  let filteredEmails = [...emails];
  
  if (req.query.read === 'true') {
    filteredEmails = filteredEmails.filter(email => email.isRead);
  }
  
  if (req.query.unread === 'true') {
    filteredEmails = filteredEmails.filter(email => !email.isRead);
  }
  
  if (req.query.hasAttachments === 'true') {
    filteredEmails = filteredEmails.filter(email => email.hasAttachments);
  }
  
  if (req.query.sentByMe === 'true') {
    filteredEmails = filteredEmails.filter(email => email.isSent);
  }
  
  if (req.query.receivedByMe === 'true') {
    filteredEmails = filteredEmails.filter(email => !email.isSent);
  }
  
  if (req.query.searchText) {
    const searchText = (req.query.searchText as string).toLowerCase();
    filteredEmails = filteredEmails.filter(email => 
      email.subject.toLowerCase().includes(searchText) || 
      email.body.toLowerCase().includes(searchText) ||
      email.from.toLowerCase().includes(searchText) ||
      email.fromName?.toLowerCase().includes(searchText)
    );
  }
  
  res.json(filteredEmails);
});

// Endpoint per inviare una nuova email
router.post('/send', (req, res) => {
  const { to, cc, bcc, subject, body, accountId, entityType, entityId } = req.body;
  
  if (!to || !subject || !body || !accountId) {
    return res.status(400).json({ error: 'Destinatario, oggetto, corpo e accountId sono campi obbligatori' });
  }
  
  const newEmail = {
    id: makeGenericId(),
    accountId,
    subject,
    body,
    bodyType: 'text/html',
    from: mockEmailAccounts.find(acc => acc.id === accountId)?.email || 'user@example.com',
    fromName: 'Il tuo nome',
    to,
    cc: cc || [],
    bcc: bcc || [],
    messageId: `msg_${makeGenericId()}@mail.example.com`,
    date: new Date().toISOString(),
    sentDate: new Date().toISOString(),
    isRead: true,
    isSent: true,
    isDraft: false,
    isStarred: false,
    isTrash: false,
    isSpam: false,
    folder: 'sent',
    hasAttachments: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json(newEmail);
});

// Endpoint per marcare le email come lette
router.post('/mark-read', (req, res) => {
  const { emailIds } = req.body;
  
  if (!emailIds || !Array.isArray(emailIds)) {
    return res.status(400).json({ error: 'emailIds deve essere un array di ID email' });
  }
  
  res.json({ success: true, markedCount: emailIds.length });
});

// Endpoint per eliminare le email
router.post('/delete', (req, res) => {
  const { emailIds } = req.body;
  
  if (!emailIds || !Array.isArray(emailIds)) {
    return res.status(400).json({ error: 'emailIds deve essere un array di ID email' });
  }
  
  res.json({ success: true, deletedCount: emailIds.length });
});

// Endpoint per generare una risposta automatica con AI
router.post('/generate-ai-reply', async (req, res) => {
  const { emailContent } = req.body;
  
  if (!emailContent) {
    return res.status(400).json({ error: 'emailContent è un campo obbligatorio' });
  }
  
  // Simula una risposta AI senza usare effettivamente OpenAI
  const aiReply = `Grazie per il tuo messaggio riguardo "${emailContent.subject}".
  
Ho esaminato attentamente quanto mi hai scritto e vorrei risponderti punto per punto.

${emailContent.body.length > 50 ? 'Da quanto ho capito, stai chiedendo informazioni specifiche su un nostro prodotto/servizio. Ti confermo che...' : 'Ho preso nota della tua richiesta e provvederò a gestirla al più presto.'}

Rimango a disposizione per qualsiasi chiarimento o informazione aggiuntiva.

Cordiali saluti,
[Il tuo nome]`;

  // Simula un leggero ritardo per rendere più realistica la risposta AI
  setTimeout(() => {
    res.json({ reply: aiReply });
  }, 1500);
});

// Endpoint per sincronizzare gli account email
router.post('/sync', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Sincronizzazione avviata', 
    newEmails: Math.floor(Math.random() * 5) // Simula da 0 a 4 nuove email
  });
});

export default router;