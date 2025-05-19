import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { initializePostgresDb, closeDbConnections } from './initPostgresDb';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
// Importa le rotte di autenticazione sicura
import authRoutes from './auth/authRoutes';
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
    console.log('Inizializzazione del sistema...');
    
    // Registra le rotte di autenticazione sicura prima di inizializzare il database
    app.use('/api/auth', authRoutes);
    
    // Crea il server HTTP
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
    
    // Avvia il server prima dell'inizializzazione del database
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    
    // Inizializza il database PostgreSQL in background
    initializePostgresDb().then(dbSuccess => {
      if (dbSuccess) {
        console.log('Database inizializzato con successo');
      } else {
        console.warn('Inizializzazione database fallita, alcune funzionalità potrebbero essere limitate');
      }
    }).catch(dbError => {
      console.error('Errore durante l\'inizializzazione del database:', dbError);
      console.warn('Il sistema funzionerà in modalità limitata');
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
    console.error('Errore critico durante l\'inizializzazione:', error);
    
    // In modalità sviluppo, tentiamo comunque di avviare il server
    if (process.env.NODE_ENV === 'development') {
      console.warn('Tentativo di avvio in modalità di emergenza...');
      try {
        const emergencyServer = registerRoutes(app);
        await setupVite(app, emergencyServer);
        emergencyServer.listen(port, () => {
          console.log(`Server di emergenza avviato sulla porta ${port}`);
        });
      } catch (emergencyError) {
        console.error('Impossibile avviare il server di emergenza:', emergencyError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

// Avvia il server
initialize();