import express, { Request, Response, NextFunction } from "express";
import { initializePostgresDb } from "./initPostgresDb";
import { registerRoutes } from "./routes";
import { Server } from "http";
import { setupVite } from "./vite";

// Avvio dell'applicazione
async function main() {
  const app = express();
  
  // Inizializzazione del database PostgreSQL
  console.log("Initializing PostgreSQL database...");
  await initializePostgresDb();
  console.log("PostgreSQL database initialization completed");

  // Middleware di base
  app.use(express.json());
  
  // Registrazione delle routes
  const httpServer: Server = await registerRoutes(app);
  
  // Configurazione di Vite in modalità sviluppo
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, httpServer);
  }
  
  // Middleware per la gestione degli errori
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
    });
  });
  
  // Avvio del server
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}

main().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});