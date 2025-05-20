/**
 * Debug Console Module
 * 
 * Fornisce funzionalità di debug e monitoraggio per il sistema CRM.
 * Questo modulo è progettato per essere collegato a Replit per il monitoraggio remoto
 * delle problematiche in produzione.
 */

import express from 'express';
import { isAdmin } from '../../routes';
import os from 'os';
import process from 'process';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  source?: string;
}

interface LogOptions {
  level?: 'info' | 'warning' | 'error' | 'debug';
  startTime?: Date;
  endTime?: Date;
  source?: string;
  limit?: number;
}

/**
 * Classe Debug Console per la registrazione e il monitoraggio degli eventi di sistema
 */
class DebugConsole {
  private logs: LogEntry[] = [];
  private maxLogEntries: number = 1000; // Numero massimo di log da conservare in memoria
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.addLog('info', 'Debug Console inizializzata', { startTime: this.startTime });
    
    // Intercetta gli errori non gestiti a livello di processo
    process.on('uncaughtException', (error) => {
      this.addLog('error', 'Eccezione non gestita', { 
        error: error.message,
        stack: error.stack 
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.addLog('error', 'Promise rejection non gestita', { 
        reason: String(reason),
        promise: String(promise) 
      });
    });
  }

  /**
   * Aggiunge un log alla console di debug
   */
  public addLog(level: 'info' | 'warning' | 'error' | 'debug', message: string, context?: Record<string, any>, source?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      source
    };

    this.logs.unshift(entry); // Aggiungi all'inizio per avere i log più recenti in cima
    
    // Limita il numero di log in memoria
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(0, this.maxLogEntries);
    }
    
    // Log console solo per errori e warning in ambiente di produzione
    if (process.env.NODE_ENV === 'production' && (level === 'error' || level === 'warning')) {
      console.error(`[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`);
      if (context) {
        console.error('Context:', JSON.stringify(context, null, 2));
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // In ambiente di sviluppo, mostra tutti i log
      console.log(`[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`);
      if (context) {
        console.log('Context:', JSON.stringify(context, null, 2));
      }
    }
  }

  /**
   * Ottiene i log in base ai filtri specificati
   */
  public getLogs(options?: LogOptions): LogEntry[] {
    let filteredLogs = this.logs;

    // Filtra per livello
    if (options?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === options.level);
    }

    // Filtra per data di inizio
    if (options?.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startTime!);
    }

    // Filtra per data di fine
    if (options?.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endTime!);
    }

    // Filtra per sorgente
    if (options?.source) {
      filteredLogs = filteredLogs.filter(log => log.source === options.source);
    }

    // Limita il numero di risultati
    if (options?.limit && options.limit > 0) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }

    return filteredLogs;
  }

  /**
   * Pulisce tutti i log
   */
  public clearLogs(): void {
    this.logs = [];
    this.addLog('info', 'Log cancellati');
  }

  /**
   * Cattura lo stato del sistema
   */
  public captureSystemState(additionalInfo?: Record<string, any>): Record<string, any> {
    const state = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        process: process.memoryUsage()
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length
      },
      platform: {
        type: os.type(),
        release: os.release(),
        platform: os.platform()
      },
      processInfo: {
        pid: process.pid,
        version: process.version,
        nodeEnv: process.env.NODE_ENV || 'development',
        argv: process.argv
      },
      additionalInfo
    };

    this.addLog('info', 'Stato del sistema catturato', { systemState: state });
    return state;
  }
}

// Istanza singleton del DebugConsole
export const debugConsole = new DebugConsole();

// Router Express per le API di debug
const router = express.Router();

// Ottieni tutti i log con filtri opzionali
router.get('/logs', isAdmin, (req, res) => {
  const level = req.query.level as 'info' | 'warning' | 'error' | 'debug' | undefined;
  const startTime = req.query.startTime ? new Date(req.query.startTime as string) : undefined;
  const endTime = req.query.endTime ? new Date(req.query.endTime as string) : undefined;
  const source = req.query.source as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  const logs = debugConsole.getLogs({
    level,
    startTime,
    endTime,
    source,
    limit
  });

  res.json(logs);
});

// Aggiungi un nuovo log
router.post('/logs', isAdmin, (req, res) => {
  const { level, message, context, source } = req.body;
  
  if (!level || !message) {
    return res.status(400).json({ error: 'Livello e messaggio richiesti' });
  }
  
  debugConsole.addLog(level, message, context, source);
  res.status(201).json({ success: true });
});

// Cancella tutti i log
router.delete('/logs', isAdmin, (req, res) => {
  debugConsole.clearLogs();
  res.json({ success: true });
});

// Ottieni lo stato del sistema
router.get('/system-state', isAdmin, (req, res) => {
  const additionalInfo = req.query.additionalInfo ? 
    JSON.parse(req.query.additionalInfo as string) : undefined;
  
  const systemState = debugConsole.captureSystemState(additionalInfo);
  res.json(systemState);
});

// API di controllo
router.get('/health', (req, res) => {
  const health = {
    status: 'online',
    timestamp: new Date(),
    uptime: process.uptime()
  };
  res.json(health);
});

export default router;