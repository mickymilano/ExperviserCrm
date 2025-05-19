import express from 'express';
import { format } from 'date-fns';

const router = express.Router();

// Dati mockup per gli account email
const mockEmailAccounts = [
  {
    id: 1,
    name: 'Account principale',
    email: 'mario.rossi@experviser.com',
    isPrimary: true,
    userId: 1,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date(2024, 0, 1).toISOString()
  },
  {
    id: 2,
    name: 'Account secondario',
    email: 'support@experviser.com',
    isPrimary: false,
    userId: 1,
    createdAt: new Date(2024, 0, 5).toISOString(),
    updatedAt: new Date(2024, 0, 5).toISOString()
  }
];

// Dati mockup per le firme email
const mockEmailSignatures = [
  {
    id: 1,
    name: 'Firma standard',
    content: '<p>Cordiali saluti,</p><p>Mario Rossi</p><p>Experviser CRM</p><p>Tel: +39 123 456 7890</p>',
    isDefault: true,
    userId: 1,
    createdAt: new Date(2024, 0, 1).toISOString(),
    updatedAt: new Date(2024, 0, 1).toISOString()
  },
  {
    id: 2,
    name: 'Firma breve',
    content: '<p>Saluti,</p><p>Mario</p>',
    isDefault: false,
    userId: 1,
    createdAt: new Date(2024, 0, 10).toISOString(),
    updatedAt: new Date(2024, 0, 10).toISOString()
  }
];

// Dati mockup per le email
const mockEmails = [
  {
    id: 1,
    from: 'mario.rossi@example.com',
    fromName: 'Mario Rossi',
    to: ['utente@experviser.com'],
    subject: 'Richiesta informazioni prodotto',
    body: '<p>Buongiorno,</p><p>Sarei interessato a ricevere maggiori informazioni sul vostro prodotto XYZ. Potremmo organizzare una chiamata la prossima settimana?</p><p>Cordiali saluti,<br>Mario Rossi</p>',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ieri
    read: true,
    hasAttachments: false,
    accountId: 1
  },
  {
    id: 2,
    from: 'laura.bianchi@example.com',
    fromName: 'Laura Bianchi',
    to: ['utente@experviser.com'],
    subject: 'Conferma appuntamento',
    body: '<p>Gentile utente,</p><p>Confermo l\'appuntamento per il giorno 25 maggio alle ore 15:00 presso la nostra sede.</p><p>Cordiali saluti,<br>Laura Bianchi</p>',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 ore fa
    read: false,
    hasAttachments: false,
    accountId: 1
  },
  {
    id: 3,
    from: 'giovanni.verdi@example.com',
    fromName: 'Giovanni Verdi',
    to: ['utente@experviser.com'],
    cc: ['responsabile@example.com'],
    subject: 'Documentazione richiesta',
    body: '<p>Buongiorno,</p><p>In allegato troverà la documentazione richiesta per il progetto.</p><p>Rimango a disposizione per qualsiasi chiarimento.</p><p>Cordiali saluti,<br>Giovanni Verdi</p>',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minuti fa
    read: false,
    hasAttachments: true,
    accountId: 1
  },
  {
    id: 4,
    from: 'utente@experviser.com',
    fromName: 'Utente Experviser',
    to: ['cliente@example.com'],
    subject: 'Re: Richiesta informazioni',
    body: '<p>Gentile Cliente,</p><p>In risposta alla sua richiesta, le confermo che i nostri prodotti sono disponibili con consegna in 3-5 giorni lavorativi.</p><p>Per ulteriori informazioni, non esiti a contattarci.</p><p>Cordiali saluti,<br>Utente Experviser</p>',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 ore fa
    read: true,
    hasAttachments: false,
    accountId: 1
  },
  {
    id: 5,
    from: 'newsletter@tech-news.com',
    fromName: 'Tech News',
    to: ['utente@experviser.com'],
    subject: 'Newsletter settimanale: Novità tecnologiche',
    body: '<p>Scopri le ultime novità nel mondo della tecnologia:</p><ul><li>Intelligenza artificiale: nuovi sviluppi</li><li>Cloud computing: tendenze emergenti</li><li>Sicurezza informatica: consigli pratici</li></ul><p>Grazie per essere iscritto alla nostra newsletter!</p>',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 giorni fa
    read: true,
    hasAttachments: false,
    accountId: 1
  }
];

// Route per ottenere tutti gli account email
router.get('/accounts', (req, res) => {
  res.json(mockEmailAccounts);
});

// Route per creare un nuovo account email
router.post('/accounts', (req, res) => {
  const newAccount = {
    id: mockEmailAccounts.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockEmailAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

// Route per aggiornare un account email
router.patch('/accounts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const accountIndex = mockEmailAccounts.findIndex(acc => acc.id === id);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  mockEmailAccounts[accountIndex] = {
    ...mockEmailAccounts[accountIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(mockEmailAccounts[accountIndex]);
});

// Route per eliminare un account email
router.delete('/accounts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const accountIndex = mockEmailAccounts.findIndex(acc => acc.id === id);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  mockEmailAccounts.splice(accountIndex, 1);
  res.json({ success: true });
});

// Route per ottenere le firme email
router.get('/sign', (req, res) => {
  res.json(mockEmailSignatures);
});

// Route per creare una nuova firma email
router.post('/sign', (req, res) => {
  const newSignature = {
    id: mockEmailSignatures.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockEmailSignatures.push(newSignature);
  res.status(201).json(newSignature);
});

// Route per ottenere le email filtrate
router.get('/', (req, res) => {
  const { entityId, entityType, read, unread, hasAttachments, searchText } = req.query;
  
  let filteredEmails = [...mockEmails];
  
  // Applica filtri in base ai parametri
  if (read === 'true') {
    filteredEmails = filteredEmails.filter(email => email.read);
  }
  
  if (unread === 'true') {
    filteredEmails = filteredEmails.filter(email => !email.read);
  }
  
  if (hasAttachments === 'true') {
    filteredEmails = filteredEmails.filter(email => email.hasAttachments);
  }
  
  if (searchText) {
    const searchLower = String(searchText).toLowerCase();
    filteredEmails = filteredEmails.filter(email => 
      email.subject.toLowerCase().includes(searchLower) ||
      email.body.toLowerCase().includes(searchLower) ||
      email.from.toLowerCase().includes(searchLower) ||
      (email.fromName && email.fromName.toLowerCase().includes(searchLower))
    );
  }
  
  res.json(filteredEmails);
});

// Route per inviare una nuova email
router.post('/send', (req, res) => {
  const newEmailId = mockEmails.length + 1;
  
  const newEmail = {
    id: newEmailId,
    from: req.body.from || 'utente@experviser.com',
    fromName: req.body.fromName || 'Utente Experviser',
    to: req.body.to || [],
    cc: req.body.cc || [],
    bcc: req.body.bcc || [],
    subject: req.body.subject || '(Nessun oggetto)',
    body: req.body.body || '',
    date: new Date().toISOString(),
    read: true, // le email inviate sono già lette
    hasAttachments: false,
    accountId: req.body.accountId || 1
  };
  
  mockEmails.push(newEmail);
  
  res.status(201).json({
    success: true,
    emailId: newEmailId,
    message: 'Email inviata con successo'
  });
});

// Route per marcare le email come lette
router.post('/mark-read', (req, res) => {
  const { emailIds } = req.body;
  
  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'Nessun ID email fornito' });
  }
  
  emailIds.forEach(id => {
    const email = mockEmails.find(e => e.id === id);
    if (email) {
      email.read = true;
    }
  });
  
  res.json({ success: true });
});

// Route per eliminare le email
router.post('/delete', (req, res) => {
  const { emailIds } = req.body;
  
  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'Nessun ID email fornito' });
  }
  
  emailIds.forEach(id => {
    const index = mockEmails.findIndex(e => e.id === id);
    if (index !== -1) {
      mockEmails.splice(index, 1);
    }
  });
  
  res.json({ success: true });
});

// Route per generare una risposta AI
router.post('/ai-reply', (req, res) => {
  const { emailBody, emailSubject } = req.body;
  
  // Simulazione risposta generata da AI
  const aiReply = `
<p>Gentile cliente,</p>
<p>Grazie per averci contattato riguardo a "${emailSubject}".</p>
<p>Abbiamo ricevuto la sua richiesta e siamo lieti di fornirle le informazioni necessarie. Apprezziamo il suo interesse nei nostri servizi.</p>
<p>Saremo felici di organizzare una chiamata la prossima settimana per discutere in dettaglio delle vostre esigenze. Potrebbe indicarci la sua disponibilità?</p>
<p>Rimaniamo a disposizione per qualsiasi ulteriore chiarimento.</p>
<p>Cordiali saluti,<br>Team Experviser</p>
  `;
  
  setTimeout(() => {
    res.json({ generatedReply: aiReply });
  }, 1000); // Aggiungiamo un ritardo per simulare l'elaborazione dell'AI
});

// Route per sincronizzare gli account email
router.post('/sync', (req, res) => {
  // Simulazione sincronizzazione
  const syncResults = mockEmailAccounts.map(account => ({
    accountId: account.id,
    success: true,
    newEmails: Math.floor(Math.random() * 5), // 0-4 nuove email
    message: `Account ${account.email} sincronizzato con successo`
  }));
  
  setTimeout(() => {
    res.json({
      success: true,
      syncResults
    });
  }, 1500); // Ritardo simulato
});

export default router;