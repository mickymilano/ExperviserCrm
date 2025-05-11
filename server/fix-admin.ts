import { storage } from "./storage";
import bcrypt from "bcrypt";

async function fixSuperAdmin() {
  try {
    // Find the super admin
    const superAdmin = await storage.getUserByEmail("michele@experviser.com");
    if (!superAdmin) {
      console.log("Super admin not found, cannot update");
      return;
    }
    
    console.log("Found super admin:", superAdmin.username);
    
    // Update the super admin's username and password
    const hashedPassword = await bcrypt.hash("admin_admin_69", 10);
    
    const updatedAdmin = await storage.updateUser(superAdmin.id, {
      username: "michele.ardoni",
      password: hashedPassword
    });
    
    if (updatedAdmin) {
      console.log("Super admin updated successfully");
      
      // Test the password
      const passwordMatch = await bcrypt.compare("admin_admin_69", updatedAdmin.password);
      console.log("Password test after update:", passwordMatch);
    } else {
      console.log("Failed to update super admin");
    }
  } catch (error) {
    console.error("Error fixing super admin:", error);
  }
}

// Run the function
fixSuperAdmin().then(() => {
  console.log("Super admin fix completed");
});