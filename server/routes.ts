import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "experviser-development-secret";

// Middleware di autenticazione
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Estrazione del token dall'header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      console.log("Authentication attempt failed: No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log("Authentication attempt with token from header:", token.substring(0, 10) + "...");
    
    // Verifica del token
    console.log("Verifying token:", token.substring(0, 10) + "...");
    validateSession(token)
      .then(session => {
        if (!session) {
          console.log("No session found for token");
          return res.status(401).json({ error: "Invalid or expired token" });
        }
        
        // Recupera l'utente associato alla sessione
        return storage.getUser(session.userId)
          .then(user => {
            if (!user) {
              console.log("No user found for session");
              return res.status(401).json({ error: "User not found" });
            }
            
            // Aggiungi l'utente alla richiesta
            (req as any).user = user;
            console.log("User authenticated successfully:", { id: user.id, username: user.username, role: user.role });
            next();
          });
      })
      .catch(error => {
        console.error("Authentication failed:", error);
        res.status(401).json({ error: "Invalid or expired token" });
      });
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
}

// Validazione della sessione
async function validateSession(token: string): Promise<{ userId: number, expiresAt: Date } | null> {
  try {
    // Verifica con JWT
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number, exp: number };
    
    if (!payload || !payload.userId) {
      return null;
    }
    
    const expiresAt = new Date(payload.exp * 1000);
    
    // Verifica la scadenza
    if (expiresAt < new Date()) {
      return null;
    }
    
    // Verifica la sessione nel database
    return await storage.validateSession(token);
  } catch (error) {
    console.error("Error validating session:", error);
    return null;
  }
}

// Registrazione delle routes
export async function registerRoutes(app: Express): Promise<Server> {
  // Routes di autenticazione
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Autenticazione dell'utente
      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Creazione della sessione
      const session = await storage.createSession(user.id);
      
      res.json({
        token: session.token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      
      if (token) {
        await storage.clearSession(token);
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });
  
  // Informazioni utente corrente
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      console.log("Authentication successful for user:", user.username, ", ID:", user.id);
      console.log("GET /auth/me - Sending user data:", { id: user.id, username: user.username, role: user.role });
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Error retrieving user info:", error);
      res.status(500).json({ error: "Failed to retrieve user information" });
    }
  });
  
  // Creazione HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}