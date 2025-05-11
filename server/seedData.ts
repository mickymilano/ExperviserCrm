import { User } from "@shared/schema";
import { authService } from "./services/authService";
import { storage } from "./storage";
import bcrypt from "bcrypt";

export async function initializeSuperAdmin(): Promise<User | null> {
  try {
    // Check if super admin already exists
    const existingAdmin = await storage.getUserByEmail("michele@experviser.com");
    if (existingAdmin) {
      console.log("Super admin already exists");
      return existingAdmin;
    }

    // Create the super admin user
    const hashedPassword = await bcrypt.hash("admin_admin_69", 10);
    
    const superAdmin = await storage.createUser({
      username: "michele.ardoni", // Consistent with the username used in the login form
      password: hashedPassword,
      fullName: "Michele Ardoni",
      email: "michele@experviser.com",
      backupEmail: "michele.ardoni@gmail.com",
      role: "super_admin",
      status: "active"
    });

    console.log("Super admin created successfully:", superAdmin.username);
    
    // Add sample pipeline stages
    await initializePipelineStages();
    
    return superAdmin;
  } catch (error) {
    console.error("Failed to initialize super admin:", error);
    return null;
  }
}

async function initializePipelineStages() {
  // Check if there are already pipeline stages
  const existingStages = await storage.getPipelineStages();
  if (existingStages.length > 0) {
    return;
  }
  
  // Create default pipeline stages
  const stages = [
    { name: "Qualification", order: 1 },
    { name: "Meeting", order: 2 },
    { name: "Proposal", order: 3 },
    { name: "Negotiation", order: 4 },
    { name: "Closed Won", order: 5 },
    { name: "Closed Lost", order: 6 }
  ];
  
  for (const stage of stages) {
    await storage.createPipelineStage(stage);
  }
  
  console.log("Pipeline stages initialized");
}