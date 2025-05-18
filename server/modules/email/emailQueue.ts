import Bull from 'bull';
import { db } from '../../db';
import { emailAccounts } from '../../../shared/email/schema';
import { EmailReceiver, ImapConfig } from './emailReceiver';
import { extractSignatureData } from './signatureParser';
import { eq } from 'drizzle-orm';

// In modalità sviluppo, utilizziamo una versione semplificata senza Redis
// In produzione, questo andrebbe configurato con un server Redis reale

// Implementa una versione mock di Bull per lo sviluppo
class MockQueue {
  private jobs: any[] = [];
  private handlers: any = {};
  private listeners: Record<string, Function[]> = {
    'completed': [], 
    'failed': []
  };
  
  constructor(private name: string) {
    console.log(`MockQueue '${name}' creata in modalità di sviluppo (senza Redis)`);
  }
  
  process(handler: Function) {
    this.handlers.process = handler;
    return this;
  }
  
  async add(data: any, options: any = {}) {
    console.log(`Job aggiunto alla coda ${this.name} con dati:`, data);
    const job = {
      id: `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      data,
      options
    };
    
    this.jobs.push(job);
    
    try {
      if (this.handlers.process) {
        const result = await this.handlers.process(job);
        this.emit('completed', job, result);
        return job;
      }
    } catch (error) {
      console.error(`Errore durante l'elaborazione del job ${job.id}:`, error);
      this.emit('failed', job, error);
    }
    
    return job;
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }
  
  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(callback => callback(...args));
  }
  
  async getRepeatableJobs() {
    return this.jobs.filter(job => job.options?.repeat);
  }
  
  async removeRepeatableByKey(key: string) {
    console.log(`Rimozione job ripetuto con chiave ${key} dalla coda ${this.name}`);
    return true;
  }
}

// Usa MockQueue in modalità sviluppo
export const emailSyncQueue = process.env.NODE_ENV === 'production' 
  ? new Bull('email-sync', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    })
  : new MockQueue('email-sync') as any;

export const emailProcessQueue = process.env.NODE_ENV === 'production'
  ? new Bull('email-process', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    })
  : new MockQueue('email-process') as any;

// Processor per la sincronizzazione email
emailSyncQueue.process(async (job) => {
  const { accountId } = job.data;
  
  try {
    console.log(`Avvio sincronizzazione email per account ${accountId}`);
    
    // Recupera i dati dell'account
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId))
      .limit(1);
    
    if (!account) {
      console.error(`Account email con ID ${accountId} non trovato`);
      throw new Error(`Account email con ID ${accountId} non trovato`);
    }
    
    if (!account.isActive) {
      console.error(`Account email con ID ${accountId} non è attivo`);
      throw new Error(`Account email con ID ${accountId} non è attivo`);
    }
    
    // Configura il client IMAP
    const imapConfig: ImapConfig = {
      user: account.username || '',
      password: account.password || '',
      host: account.imapHost || '',
      port: account.imapPort || 993,
      tls: account.imapSecure || true,
      authTimeout: 10000,
      tlsOptions: {
        rejectUnauthorized: false
      }
    };
    
    // Crea il receiver email
    const receiver = new EmailReceiver(imapConfig, account.id);
    
    // Sincronizza le email non lette
    const fetchedCount = await receiver.fetchUnreadEmails();
    
    // Aggiorna la data dell'ultima sincronizzazione
    await db
      .update(emailAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(emailAccounts.id, accountId));
    
    console.log(`Sincronizzazione completata per account ${accountId}: ${fetchedCount} nuove email`);
    
    return { success: true, count: fetchedCount };
  } catch (error) {
    console.error(`Errore durante la sincronizzazione dell'account ${accountId}:`, error);
    throw error;
  }
});

// Processor per l'elaborazione delle email (per estrarre dati dalla firma, associare contatti, ecc.)
emailProcessQueue.process(async (job) => {
  const { emailId } = job.data;
  
  try {
    console.log(`Avvio elaborazione dell'email ${emailId}`);
    
    // Qui implementerai il codice per processare le email
    // Estrazione informazioni aggiuntive, analisi machine learning, ecc.
    
    return { success: true };
  } catch (error) {
    console.error(`Errore durante l'elaborazione dell'email ${emailId}:`, error);
    throw error;
  }
});

// Funzioni di utilità per pianificare i job

/**
 * Pianifica sincronizzazione per tutti gli account attivi
 */
export async function scheduleAllAccountsSync() {
  try {
    // Recupera tutti gli account attivi
    const activeAccounts = await db
      .select({ id: emailAccounts.id, syncFrequency: emailAccounts.syncFrequency })
      .from(emailAccounts)
      .where(eq(emailAccounts.isActive, true));
    
    // Pianifica job per ogni account
    for (const account of activeAccounts) {
      await scheduleSyncJob(account.id, account.syncFrequency || 5);
    }
    
    return activeAccounts.length;
  } catch (error) {
    console.error('Errore durante la pianificazione delle sincronizzazioni:', error);
    throw error;
  }
}

/**
 * Pianifica sincronizzazione per un account specifico
 */
export async function scheduleSyncJob(accountId: number, intervalMinutes: number = 5) {
  try {
    // Rimuove eventuali job ripetuti esistenti per questo account
    const existingJobs = await emailSyncQueue.getRepeatableJobs();
    for (const job of existingJobs) {
      if (job.name === `sync-account-${accountId}`) {
        await emailSyncQueue.removeRepeatableByKey(job.key);
      }
    }
    
    // Aggiunge il nuovo job ripetuto
    await emailSyncQueue.add(
      { accountId },
      {
        jobId: `sync-account-${accountId}`,
        repeat: {
          every: intervalMinutes * 60 * 1000 // Converti minuti in millisecondi
        }
      }
    );
    
    console.log(`Sincronizzazione pianificata per account ${accountId} ogni ${intervalMinutes} minuti`);
    return true;
  } catch (error) {
    console.error(`Errore durante la pianificazione della sincronizzazione per account ${accountId}:`, error);
    throw error;
  }
}

/**
 * Esegue immediatamente la sincronizzazione di un account
 */
export async function syncAccountNow(accountId: number) {
  try {
    const job = await emailSyncQueue.add(
      { accountId },
      { 
        jobId: `sync-now-${accountId}-${Date.now()}`,
        attempts: 1 
      }
    );
    
    return job.id;
  } catch (error) {
    console.error(`Errore durante l'avvio immediato della sincronizzazione per account ${accountId}:`, error);
    throw error;
  }
}

// Gestione degli eventi della coda
emailSyncQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completato con successo:`, result);
});

emailSyncQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} fallito:`, error);
});

emailProcessQueue.on('completed', (job, result) => {
  console.log(`Job di elaborazione ${job.id} completato con successo:`, result);
});

emailProcessQueue.on('failed', (job, error) => {
  console.error(`Job di elaborazione ${job.id} fallito:`, error);
});