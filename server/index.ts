import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { initializePostgresDb, closeDbConnections } from './initPostgresDb';
import { registerRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));

// Gestione degli errori globale
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Errore interno del server', error: err.message });
});

// Inizializzazione del database
async function initialize() {
  try {
    // Inizializza il database PostgreSQL
    await initializePostgresDb();
    
    // Registra le rotte API
    const server = registerRoutes(app);
    
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