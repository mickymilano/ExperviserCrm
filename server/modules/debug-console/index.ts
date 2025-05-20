/**
 * Debug Console Module
 * 
 * Fornisce funzionalità di debug e monitoraggio per il sistema CRM.
 * Questo modulo è progettato per essere collegato a Replit per il monitoraggio remoto
 * delle problematiche in produzione.
 */

import express from 'express';
// Utilizziamo un'implementazione semplificata dell'autenticazione per evitare dipendenze circolari
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In modalità sviluppo, bypassiamo l'autenticazione
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // In produzione, controlliamo il token di autenticazione
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Autenticazione richiesta' });
  }
  
  next();
};

// Log storage per conservare i messaggi di debug
interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  source?: string;
}

// Classe che gestisce la funzionalità della Debug Console
class DebugConsole {
  private logs: LogEntry[] = [];
  private maxLogEntries: number = 1000; // Numero massimo di log da conservare in memoria
  
  constructor() {
    // Inizializza con un messaggio di avvio
    this.addLog('info', 'Debug Console inizializzata', { module: 'debug-console' });
    
    // Intercetta gli errori non gestiti per registrarli
    process.on('uncaughtException', (error) => {
      this.addLog('error', `Uncaught Exception: ${error.message}`, { 
        stack: error.stack,
        module: 'global-error-handler' 
      });
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.addLog('error', `Unhandled Rejection: ${reason}`, { 
        module: 'global-error-handler',
        promise: String(promise)
      });
    });
  }
  
  // Aggiunge un nuovo messaggio di log
  public addLog(level: 'info' | 'warning' | 'error' | 'debug', message: string, context?: Record<string, any>, source?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      source
    };
    
    // Aggiungi il log all'inizio dell'array (più recenti in cima)
    this.logs.unshift(entry);
    
    // Se superiamo il limite, rimuovi i log più vecchi
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(0, this.maxLogEntries);
    }
    
    // Stampa anche sulla console del server per il debugging locale
    const formattedMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, context);
        break;
      case 'warning':
        console.warn(formattedMessage, context);
        break;
      case 'debug':
        console.debug(formattedMessage, context);
        break;
      default:
        console.log(formattedMessage, context);
    }
  }
  
  // Recupera i log, con possibilità di filtraggio
  public getLogs(options?: { 
    level?: 'info' | 'warning' | 'error' | 'debug',
    limit?: number,
    startTime?: Date,
    endTime?: Date,
    source?: string
  }): LogEntry[] {
    let filtered = [...this.logs];
    
    if (options) {
      if (options.level) {
        filtered = filtered.filter(log => log.level === options.level);
      }
      
      if (options.startTime) {
        filtered = filtered.filter(log => log.timestamp >= options.startTime!);
      }
      
      if (options.endTime) {
        filtered = filtered.filter(log => log.timestamp <= options.endTime!);
      }
      
      if (options.source) {
        filtered = filtered.filter(log => log.source === options.source);
      }
      
      if (options.limit && options.limit > 0) {
        filtered = filtered.slice(0, options.limit);
      }
    }
    
    return filtered;
  }
  
  // Cancella tutti i log
  public clearLogs(): void {
    this.logs = [];
    this.addLog('info', 'Log cancellati', { module: 'debug-console' });
  }
  
  // Registra lo stato attuale del sistema
  public captureSystemState(additionalInfo?: Record<string, any>): Record<string, any> {
    const systemState = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'not-set',
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      ...additionalInfo
    };
    
    this.addLog('info', 'Stato del sistema catturato', systemState, 'system-monitor');
    
    return systemState;
  }
}

// Istanza singleton della debug console
export const debugConsole = new DebugConsole();

// Router Express per esporre le API della Debug Console
const router = express.Router();

// Middleware per controllare se la Debug Console è abilitata
const checkDebugEnabled = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In produzione, puoi aggiungere controlli addizionali
  // Ad esempio, richiedere un token speciale o limitare l'accesso a certi IP
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_CONSOLE_ENABLED) {
    return res.status(403).json({ 
      success: false, 
      message: 'Debug Console non è abilitata in produzione. Imposta DEBUG_CONSOLE_ENABLED=true per attivarla.' 
    });
  }
  
  next();
};

// Ottiene tutti i log (con opzioni di filtro)
router.get('/logs', authenticate, checkDebugEnabled, (req, res) => {
  const options: any = {};
  
  if (req.query.level) {
    options.level = req.query.level;
  }
  
  if (req.query.limit) {
    options.limit = parseInt(req.query.limit as string, 10);
  }
  
  if (req.query.source) {
    options.source = req.query.source;
  }
  
  if (req.query.startTime) {
    options.startTime = new Date(req.query.startTime as string);
  }
  
  if (req.query.endTime) {
    options.endTime = new Date(req.query.endTime as string);
  }
  
  const logs = debugConsole.getLogs(options);
  
  res.json({
    success: true,
    count: logs.length,
    logs
  });
});

// Aggiunge un log manualmente
router.post('/logs', authenticate, checkDebugEnabled, (req, res) => {
  const { level, message, context, source } = req.body;
  
  if (!level || !message) {
    return res.status(400).json({
      success: false,
      message: 'I campi level e message sono obbligatori'
    });
  }
  
  if (!['info', 'warning', 'error', 'debug'].includes(level)) {
    return res.status(400).json({
      success: false,
      message: 'Il livello di log deve essere uno tra: info, warning, error, debug'
    });
  }
  
  debugConsole.addLog(level as any, message, context, source);
  
  res.json({
    success: true,
    message: 'Log aggiunto con successo'
  });
});

// Cancella tutti i log
router.delete('/logs', authenticate, checkDebugEnabled, (req, res) => {
  debugConsole.clearLogs();
  
  res.json({
    success: true,
    message: 'Tutti i log sono stati cancellati'
  });
});

// Cattura lo stato del sistema
router.get('/system-state', authenticate, checkDebugEnabled, (req, res) => {
  const systemState = debugConsole.captureSystemState();
  
  res.json({
    success: true,
    systemState
  });
});

// Utilità per verificare il funzionamento della Debug Console
router.get('/ping', authenticate, checkDebugEnabled, (req, res) => {
  debugConsole.addLog('info', 'Ping ricevuto', { 
    ip: req.ip, 
    userAgent: req.headers['user-agent'] 
  }, 'api-endpoint');
  
  res.json({
    success: true,
    message: 'Debug Console è funzionante',
    timestamp: new Date()
  });
});

export default router;