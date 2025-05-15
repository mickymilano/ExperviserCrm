import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// Inizializza Sentry per il backend se c'è un DSN configurato
export function initializeErrorTracking() {
  // Controlliamo se c'è una configurazione per Sentry
  const dsn = process.env.SENTRY_DSN;
  
  if (dsn) {
    console.log('Initializing Sentry for error tracking');
    
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      
      // Configura la percentuale di transazioni da tracciare
      // In produzione si può abbassare, in development teniamo al 100%
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      
      // In Sentry 7.x le integrazioni sono gestite automaticamente
      
      // Configurazioni aggiuntive
      maxBreadcrumbs: 50,
      debug: process.env.NODE_ENV === 'development',
      
      // Funzione che viene eseguita prima di inviare un evento
      beforeSend(event) {
        // Filtra gli errori interni o indesiderati
        if (event.exception && event.exception.values && event.exception.values[0]) {
          const errorValue = event.exception.values[0].value || '';
          
          // Ignora errori di connessione client
          if (errorValue.includes('ECONNRESET') || 
              errorValue.includes('socket hang up') ||
              errorValue.includes('client disconnected')) {
            return null;
          }
        }
        
        return event;
      }
    });
    
    console.log('Sentry initialized successfully');
    return true;
  } else {
    console.log('No Sentry DSN configured, error tracking disabled');
    return false;
  }
}

// Middleware per aggiungere il tracciamento di Sentry alle richieste
export function sentryRequestHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    // In versioni recenti di Sentry, il middleware va creato manualmente
    try {
      // Traccia l'inizio della richiesta
      Sentry.captureMessage(`API Request: ${req.method} ${req.url}`, {
        level: 'info',
        extra: {
          headers: req.headers,
          query: req.query,
          method: req.method,
          url: req.url,
          ip: req.ip
        }
      });
      next();
    } catch (error) {
      // Non blocchiamo l'elaborazione della richiesta se il tracciamento fallisce
      console.error('Error in Sentry request handler:', error);
      next();
    }
  };
}

// Middleware per tracciare gli errori con Sentry
export function sentryErrorHandler(): ErrorRequestHandler {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    try {
      // Determina se l'errore dovrebbe essere tracciato
      const shouldCapture = !error.status || error.status >= 500;
      
      if (shouldCapture) {
        const eventId = Sentry.captureException(error);
        // Aggiungiamo l'ID dell'evento alla richiesta per riferimento
        (req as any).sentryEventId = eventId;
      }
      
      next(error);
    } catch (sentryError) {
      console.error('Error in Sentry error handler:', sentryError);
      next(error);
    }
  };
}

// Middleware per la gestione degli errori
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Gli errori possono essere già gestiti dal middleware di Sentry
  console.error('Server error:', err);
  
  // Evita di esporre i dettagli dell'errore al client in produzione
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Si è verificato un errore durante l\'elaborazione della richiesta.'
    : err.message;
  
  res.status(500).json({ 
    message: 'Errore interno del server', 
    error: errorMessage,
    // Includi l'ID di tracciamento solo se Sentry è configurato
    ...((req as any).sentryEventId ? { eventId: (req as any).sentryEventId } : {})
  });
}

// Utility per registrare un errore manualmente
export function logServerError(error: Error, context: Record<string, any> = {}) {
  console.error('Error:', error, context);
  
  try {
    Sentry.captureException(error, {
      extra: context
    });
  } catch (sentryError) {
    console.error('Failed to log error to Sentry:', sentryError);
  }
}

// Utility per registrare un messaggio
export function logServerMessage(message: string, context: Record<string, any> = {}) {
  console.log(message, context);
  
  try {
    Sentry.captureMessage(message, {
      level: 'info',
      extra: context
    });
  } catch (sentryError) {
    console.error('Failed to log message to Sentry:', sentryError);
  }
}