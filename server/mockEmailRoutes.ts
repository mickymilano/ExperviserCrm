import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Mock per i dati di email, account e firme
 * Questi dati simulati verranno utilizzati fino a quando l'implementazione reale non sarà completata
 */

// Account email simulati
const mockEmailAccounts = [
  {
    id: 1,
    name: 'Account Aziendale',
    email: 'info@experviser.com',
    provider: 'gmail',
    isActive: true,
    lastSyncedAt: new Date().toISOString(),
    syncFrequency: 15 // minuti
  },
  {
    id: 2,
    name: 'Account Supporto',
    email: 'support@experviser.com',
    provider: 'outlook',
    isActive: true,
    lastSyncedAt: new Date().toISOString(),
    syncFrequency: 30 // minuti
  }
];

// Genera email di test per un'entità specifica
const generateMockEmails = (entityType: string, entityId: number) => {
  const currentDate = new Date();
  return [
    {
      id: 1001,
      from: 'cliente@example.com',
      fromName: 'Cliente Demo',
      to: ['info@experviser.com'],
      cc: [],
      bcc: [],
      subject: `Richiesta informazioni - ${entityType.toUpperCase()} ${entityId}`,
      body: `<p>Gentile team,</p><p>Sono interessato a sapere di più sul vostro servizio. Potreste fornirmi ulteriori dettagli?</p><p>Grazie,<br>Cliente Demo</p>`,
      date: new Date(currentDate.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 giorno fa
      read: false,
      hasAttachments: false,
      accountId: 1
    },
    {
      id: 1002,
      from: 'info@experviser.com',
      fromName: 'Experviser Team',
      to: ['cliente@example.com'],
      cc: ['supporto@experviser.com'],
      bcc: [],
      subject: `Re: Richiesta informazioni - ${entityType.toUpperCase()} ${entityId}`,
      body: `<p>Gentile Cliente,</p><p>Grazie per il suo interesse. Saremmo lieti di organizzare una demo per mostrarle i nostri servizi.</p><p>Cordiali saluti,<br>Team Experviser</p>`,
      date: new Date(currentDate.getTime() - 1000 * 60 * 60 * 12).toISOString(), // 12 ore fa
      read: true,
      hasAttachments: true,
      accountId: 1
    },
    {
      id: 1003,
      from: 'marketing@competitor.com',
      fromName: 'Marketing Team',
      to: ['info@experviser.com'],
      cc: [],
      bcc: [],
      subject: `Proposta di collaborazione - ${entityType.toUpperCase()} ${entityId}`,
      body: `<p>Salve,</p><p>Vi scriviamo per proporvi una potenziale collaborazione che potrebbe interessare entrambe le nostre aziende.</p><p>Restiamo in attesa di un vostro riscontro.</p><p>Cordiali saluti,<br>Marketing Team</p>`,
      date: new Date(currentDate.getTime() - 1000 * 60 * 60 * 3).toISOString(), // 3 ore fa
      read: true,
      hasAttachments: false,
      accountId: 2
    }
  ];
};

// Endpoint per recuperare gli account email
router.get('/accounts', (req: Request, res: Response) => {
  res.json(mockEmailAccounts);
});

// Endpoint per recuperare un account email specifico
router.get('/accounts/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const account = mockEmailAccounts.find(acc => acc.id === id);
  
  if (!account) {
    return res.status(404).json({ error: 'Account non trovato' });
  }
  
  res.json(account);
});

// Endpoint per recuperare le email di un account
router.get('/accounts/:id/messages', (req: Request, res: Response) => {
  const accountId = parseInt(req.params.id);
  const folder = req.query.folder || 'INBOX';
  
  // Genera email casuali per questo account
  const emails = [
    {
      id: 1001 + accountId,
      from: 'cliente@example.com',
      fromName: 'Cliente Demo',
      to: [`account${accountId}@experviser.com`],
      cc: [],
      bcc: [],
      subject: 'Richiesta informazioni',
      body: `<p>Gentile team,</p><p>Sono interessato a sapere di più sul vostro servizio. Potreste fornirmi ulteriori dettagli?</p><p>Grazie,<br>Cliente Demo</p>`,
      date: new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 giorno fa
      read: false,
      hasAttachments: false,
      accountId
    },
    {
      id: 2001 + accountId,
      from: `account${accountId}@experviser.com`,
      fromName: 'Experviser Team',
      to: ['cliente@example.com'],
      cc: ['supporto@experviser.com'],
      bcc: [],
      subject: 'Re: Richiesta informazioni',
      body: `<p>Gentile Cliente,</p><p>Grazie per il suo interesse. Saremmo lieti di organizzare una demo per mostrarle i nostri servizi.</p><p>Cordiali saluti,<br>Team Experviser</p>`,
      date: new Date(new Date().getTime() - 1000 * 60 * 60 * 12).toISOString(), // 12 ore fa
      read: true,
      hasAttachments: true,
      accountId
    }
  ];
  
  res.json(emails);
});

// Endpoint per filtrare le email per entità
router.get('/filter/:entityType/:entityId', (req: Request, res: Response) => {
  const entityType = req.params.entityType;
  const entityId = parseInt(req.params.entityId);
  
  // Genera email simulate specifiche per questa entità
  const emails = generateMockEmails(entityType, entityId);
  
  res.json(emails);
});

// Endpoint per inviare un'email
router.post('/send', (req: Request, res: Response) => {
  // Simula un ritardo di invio
  setTimeout(() => {
    res.status(201).json({
      id: Math.floor(Math.random() * 1000) + 1000,
      success: true,
      message: "Email inviata con successo"
    });
  }, 1000);
});

// Endpoint per le firme email
router.get('/signatures', (req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      name: 'Firma Predefinita',
      content: '<p>Cordiali saluti,<br>Team Experviser</p>',
      isDefault: true,
      userId: 1,
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 giorni fa
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Firma Marketing',
      content: '<p>Cordiali saluti,<br>Marketing Team Experviser<br><small>Seguici sui social!</small></p>',
      isDefault: false,
      userId: 1,
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 giorni fa
      updatedAt: new Date().toISOString()
    }
  ]);
});

// Endpoint per recuperare la firma predefinita
router.get('/signatures/default', (req: Request, res: Response) => {
  res.json({
    id: 1,
    name: 'Firma Predefinita',
    content: '<p>Cordiali saluti,<br>Team Experviser</p>',
    isDefault: true,
    userId: 1,
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 giorni fa
    updatedAt: new Date().toISOString()
  });
});

export default router;