import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, pipelineStages } from "@shared/schema";
import bcrypt from "bcrypt";

/**
 * Initialize the PostgreSQL database with essential data
 * Executed at server startup
 */
export async function initializePostgresDb() {
  try {
    // Check if superadmin exists
    const superAdmin = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
    
    if (superAdmin.length === 0) {
      console.log("Creating super admin user...");
      // Create default super admin
      const hashedPassword = await bcrypt.hash("admin_admin_69", 10);
      await db.insert(users).values({
        username: "michele",
        password: hashedPassword,
        fullName: "Michele Ardoni",
        email: "michele@experviser.com",
        role: "super_admin",
        status: "active"
      });
      console.log("Super admin created successfully");
    } else {
      console.log("Super admin already exists");
    }
    
    // Check if pipeline stages exist
    const stages = await db.select().from(pipelineStages);
    
    if (stages.length === 0) {
      console.log("Creating pipeline stages...");
      // Create default pipeline stages
      await db.insert(pipelineStages).values([
        { name: "Lead", order: 1 },
        { name: "Contatto", order: 2 },
        { name: "Qualificazione", order: 3 },
        { name: "Analisi", order: 4 },
        { name: "Proposta", order: 5 },
        { name: "Negoziazione", order: 6 },
        { name: "Vinta", order: 7 },
        { name: "Persa", order: 8 }
      ]);
      console.log("Pipeline stages created successfully");
    } else {
      console.log(`${stages.length} pipeline stages already exist`);
    }
  } catch (error) {
    console.error("Error initializing PostgreSQL database:", error);
    throw error;
  }
}