import { v4 as uuidv4 } from 'uuid';
import * as Sentry from "@sentry/react";

// Definizioni dei tipi
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'log';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
  component?: string;
  stack?: string;
}

// Singleton per il debug context
class DebugContext {
  private logs: LogEntry[] = [];
  private subscribers: Set<(logs: LogEntry[]) => void> = new Set();
  private maxLogs: number = 1000;
  
  constructor() {
    console.log('Debug Context Initialized');
    
    // Metodi override originali della console
    this.originalConsoleMethods = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      log: console.log
    };
    
    // Aggiungi log di inizializzazione
    this.addLog({ 
      level: 'info',
      message: 'Debug Context Initialized',
      component: 'DebugSystem',
      details: { timestamp: new Date().toISOString() }
    });
  }
  
  // Metodi originali della console per il ripristino
  private originalConsoleMethods: Record<LogLevel, typeof console.log>;
  
  // Metodo per aggiungere un log
  addLog(log: Omit<LogEntry, 'id' | 'timestamp'>): void {
    // Crea un nuovo log con id e timestamp
    const newLog: LogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...log,
    };
    
    // Aggiungi il log in testa all'array e rispetta il limite massimo
    this.logs = [newLog, ...this.logs].slice(0, this.maxLogs);
    
    // Notifica tutti i subscriber
    this.notifySubscribers();
  }
  
  // Metodo per registrare un errore
  logError(
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ): void {
    let stack: string | undefined;
    if (details instanceof Error) {
      stack = details.stack;
      details = details.message;
    }
    
    this.addLog({
      level: 'error',
      message,
      details,
      component: options?.component,
      stack
    });
    
    // Opzionalmente invia a Sentry
    if (options?.reportToSentry !== false) {
      Sentry.captureException(new Error(message), {
        extra: {
          details,
          component: options?.component
        }
      });
    }
  }
  
  // Metodo per registrare un warning
  logWarning(
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ): void {
    this.addLog({
      level: 'warn',
      message,
      details,
      component: options?.component
    });
    
    // Opzionalmente invia a Sentry
    if (options?.reportToSentry !== false) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: {
          details,
          component: options?.component
        }
      });
    }
  }
  
  // Metodo per registrare un'informazione
  logInfo(
    message: string, 
    details?: any, 
    options?: { component?: string, reportToSentry?: boolean }
  ): void {
    this.addLog({
      level: 'info',
      message,
      details,
      component: options?.component
    });
    
    // Opzionalmente invia a Sentry solo in casi selezionati
    if (options?.reportToSentry) {
      Sentry.captureMessage(message, {
        level: 'info',
        extra: {
          details,
          component: options?.component
        }
      });
    }
  }
  
  // Metodo per registrare un messaggio di debug
  logDebug(
    message: string, 
    details?: any, 
    options?: { component?: string }
  ): void {
    this.addLog({
      level: 'debug',
      message,
      details,
      component: options?.component
    });
  }
  
  // Metodo per ripulire i log
  clearLogs(): void {
    this.logs = [];
    this.notifySubscribers();
  }
  
  // Metodo per ottenere i log attuali
  getLogs(): LogEntry[] {
    return this.logs;
  }
  
  // Metodo per abbonati ai cambiamenti
  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Notifica immediatamente lo stato attuale
    callback(this.logs);
    
    // Restituisci una funzione per disiscriversi
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  // Metodo per notificare tutti gli abbonati
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback(this.logs);
    });
  }
  
  // Overrides della console per catturare tutti i log
  installConsoleOverrides(): () => void {
    // Salva i metodi originali
    const originalMethods = this.originalConsoleMethods;
    
    // Sostituisci i metodi della console
    console.error = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string') {
        this.logError(message, rest.length > 0 ? rest : undefined);
      } else {
        this.logError('Error object', message);
      }
      
      // Chiama il metodo originale per mantenere i log nella console del browser
      originalMethods.error.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string') {
        this.logWarning(message, rest.length > 0 ? rest : undefined);
      } else {
        this.logWarning('Warning object', message);
      }
      
      // Chiama il metodo originale
      originalMethods.warn.apply(console, args);
    };
    
    console.info = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string') {
        this.logInfo(message, rest.length > 0 ? rest : undefined);
      } else {
        this.logInfo('Info object', message);
      }
      
      // Chiama il metodo originale
      originalMethods.info.apply(console, args);
    };
    
    console.debug = (...args: any[]) => {
      const message = args[0];
      const rest = args.slice(1);
      
      if (typeof message === 'string') {
        this.logDebug(message, rest.length > 0 ? rest : undefined);
      } else {
        this.logDebug('Debug object', message);
      }
      
      // Chiama il metodo originale
      originalMethods.debug.apply(console, args);
    };
    
    // Restituisci una funzione per ripristinare i metodi originali
    return () => {
      console.error = originalMethods.error;
      console.warn = originalMethods.warn;
      console.info = originalMethods.info;
      console.debug = originalMethods.debug;
    };
  }
}

// Esporta una singola istanza del context
export const debugContext = new DebugContext();