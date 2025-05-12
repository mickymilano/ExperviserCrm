import { db } from "./db-simple";
import { users, pipelineStages } from "@shared/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { fixDuplicatePipelineStages } from "./fix-duplicate-pipeline-stages";

/**
 * Initialize the PostgreSQL database with essential data
 * Executed at server startup
 */
export async function initializePostgresDb() {
  console.log("Initializing PostgreSQL database...");
  
  // Check for the existence of the super admin user
  let superAdminExists = false;
  try {
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "super_admin"));
    
    superAdminExists = adminUsers.length > 0;
    
    if (superAdminExists) {
      console.log("Super admin already exists");
    } else {
      console.log("Creating super admin user...");
      
      // Create the super admin user
      const hashedPassword = await bcrypt.hash("adminpassword", 10);
      await db.insert(users).values({
        username: "michele",
        password: hashedPassword,
        fullName: "Michele Ardoni",
        email: "michele@experviser.com",
        role: "super_admin",
        status: "active"
      });
      
      console.log("Super admin user created successfully");
    }
  } catch (error) {
    console.error("Error during super admin verification/creation:", error);
  }
  
  // Check and create pipeline stages
  try {
    const existingStages = await db.select().from(pipelineStages);
    
    if (existingStages.length === 0) {
      console.log("Creating pipeline stages...");
      
      // Create the pipeline stages
      await db.insert(pipelineStages).values([
        { name: "Lead Qualification", order: 1 },
        { name: "First Contact", order: 2 },
        { name: "Needs Analysis", order: 3 },
        { name: "Proposal", order: 4 },
        { name: "Negotiation", order: 5 },
        { name: "Contract", order: 6 },
        { name: "Closed (Won)", order: 7 },
        { name: "Closed (Lost)", order: 8 }
      ]);
      
      console.log("Pipeline stages created successfully");
    } else {
      console.log(`${existingStages.length} pipeline stages already exist`);
      
      // Verifica e rimuovi eventuali stage duplicati
      if (existingStages.length > 8) {
        console.log("Rilevati possibili stage duplicati, avvio la procedura di pulizia...");
        await fixDuplicatePipelineStages();
      }
    }
  } catch (error) {
    console.error("Error during pipeline stages verification/creation:", error);
  }
  
  console.log("PostgreSQL database initialization completed");
}