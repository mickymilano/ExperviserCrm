import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { initializePostgresDb, closeDbConnections } from './initPostgresDb';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import { 
  initializeErrorTracking,
  sentryRequestHandler,
  sentryErrorHandler,
  errorHandler as sentryCustomErrorHandler
} from './errorHandling';

const app = express();
const port = process.env.PORT || 5000;

// Inizializza Sentry per il tracciamento degli errori
// Nota: non bloccante, continuerà anche se Sentry non è configurato
initializeErrorTracking();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));

// Sentry request handler (prima di qualsiasi middleware)
app.use(sentryRequestHandler());

// Gestione degli errori globale
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Traccia l'errore con Sentry prima di rispondere
  try {
    sentryErrorHandler()(err, req, res, () => {
      // Poi utilizza il nostro custom error handler
      sentryCustomErrorHandler(err, req, res, next);
    });
  } catch (sentryError) {
    console.error('Error in Sentry error handling:', sentryError);
    // Fallback sul comportamento originale
    console.error('Server error:', err);
    res.status(500).json({ message: 'Errore interno del server', error: err.message });
  }
});

// Inizializzazione del database
async function initialize() {
  try {
    // Inizializza il database PostgreSQL
    await initializePostgresDb();
    
    // Registra le rotte API
    const server = registerRoutes(app);
    
    // Configurazione client in base all'ambiente
    if (process.env.NODE_ENV === 'development') {
      // In development, configura Vite per il client
      await setupVite(app, server);
    } else {
      // In production, servi i file statici
      console.log('Running in production mode, serving static files');
      try {
        serveStatic(app);
      } catch (staticError) {
        console.error('Error serving static files:', staticError);
      }
    }
    
    // Avvia il server
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    
    // Gestione terminazione
    process.on('SIGTERM', async () => {
      console.log('SIGTERM ricevuto, chiusura del server...');
      await closeDbConnections();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT ricevuto, chiusura del server...');
      await closeDbConnections();
      process.exit(0);
    });
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error);
    process.exit(1);
  }
}

// Avvia il server
initialize();