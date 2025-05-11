import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeSuperAdmin } from "./seedData";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { fixContactsRelationships } from "./fix-contacts-relationships";
import { initializePostgresDb } from "./initPostgresDb";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Inizializza il database PostgreSQL con i dati di base
  try {
    await initializePostgresDb();
  } catch (error) {
    console.error("Errore durante l'inizializzazione del database PostgreSQL:", error);
  }
  
  // Per retrocompatibilità, manteniamo anche il codice del seed precedente
  const superAdmin = await initializeSuperAdmin();
  
  if (superAdmin) {
    // Force update the password to ensure it works
    try {
      const hashedPassword = await bcrypt.hash("admin_admin_69", 10);
      const updated = await storage.updateUser(superAdmin.id, {
        password: hashedPassword
      });
      
      if (updated) {
        console.log("Admin password verified and reset");
      }
    } catch (error) {
      console.error("Failed to update admin password:", error);
    }
  }
  
  // Create or ensure test user
  try {
    const existingTestUser = await storage.getUserByUsername("test");
    if (!existingTestUser) {
      const hashedPassword = await bcrypt.hash("test123", 10);
      const testUser = await storage.createUser({
        username: "test",
        password: hashedPassword,
        fullName: "Test User",
        email: "test@example.com",
        role: "user",
        status: "active"
      });
      console.log("Test user created:", testUser.username);
    } else {
      // Update test user password
      const hashedPassword = await bcrypt.hash("test123", 10);
      await storage.updateUser(existingTestUser.id, {
        password: hashedPassword
      });
      console.log("Test user updated");
    }
  } catch (error) {
    console.error("Failed to create/update test user:", error);
  }
  
  // Esegue automaticamente lo script di fix delle relazioni all'avvio
  console.log("Esecuzione automatica dello script di correzione delle relazioni all'avvio...");
  try {
    await fixContactsRelationships();
    console.log("Script di correzione delle relazioni completato all'avvio.");
  } catch (error) {
    console.error("Errore nell'esecuzione dello script di correzione delle relazioni:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
