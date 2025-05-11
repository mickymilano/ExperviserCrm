import { storage } from "./storage";
import bcrypt from "bcrypt";

async function resetAdminPassword() {
  try {
    // Try to find by email first
    let admin = await storage.getUserByEmail("michele@experviser.com");
    
    if (!admin) {
      console.log("Admin not found by email, trying username");
      admin = await storage.getUserByUsername("michele.ardoni");
    }
    
    if (!admin) {
      console.log("Admin not found by username either, trying michele");
      admin = await storage.getUserByUsername("michele");
    }
    
    if (!admin) {
      console.log("No admin account found!");
      return;
    }
    
    console.log("Found admin:", { 
      id: admin.id, 
      username: admin.username, 
      email: admin.email 
    });

    // Create a plain text password without any hashing 
    // (the updateUser function will handle the hashing)
    const newPassword = "admin_admin_69";
    
    // Create a fresh hash with bcrypt directly
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Created new password hash for admin");
    
    // Update the user with the new password hash directly
    const updated = await storage.updateUser(admin.id, {
      password: hashedPassword
    });
    
    if (updated) {
      console.log("Admin password reset successful!");
      
      // Verify the password directly
      const match = await bcrypt.compare(newPassword, updated.password);
      console.log("Password verification test:", match);
    } else {
      console.log("Admin password reset failed!");
    }
    
    // Create a test user with a simple password for testing
    const testUser = await storage.createUser({
      username: "test",
      password: await bcrypt.hash("test123", 10),
      fullName: "Test User",
      email: "test@example.com",
      role: "user",
      status: "active"
    });
    
    console.log("Created test user:", testUser.username);
    
  } catch (error) {
    console.error("Error resetting admin password:", error);
  }
}

resetAdminPassword().then(() => {
  console.log("Admin password reset process completed");
});