import { storage } from "./storage";
import bcrypt from "bcrypt";

async function debugAuth() {
  try {
    // 1. Check if super admin exists
    const superAdmin = await storage.getUserByEmail("michele@experviser.com");
    console.log("Super admin exists:", !!superAdmin);
    if (superAdmin) {
      console.log("Super admin details:", {
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
        hasPassword: !!superAdmin.password
      });
    }

    // 2. Create a test user with a simple password
    const hashedPassword = await bcrypt.hash("test123", 10);
    
    const testUser = await storage.createUser({
      username: "testuser",
      password: hashedPassword,
      fullName: "Test User",
      email: "test@example.com",
      role: "user",
      status: "active"
    });

    console.log("Test user created:", {
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role,
      status: testUser.status
    });

    // 3. Test password verification
    const passwordToTest = "admin_admin_69";
    if (superAdmin) {
      const isPasswordValid = await bcrypt.compare(passwordToTest, superAdmin.password);
      console.log(`Password '${passwordToTest}' is valid for super admin:`, isPasswordValid);
    }

    const isPasswordValidForTest = await bcrypt.compare("test123", testUser.password);
    console.log("Password 'test123' is valid for test user:", isPasswordValidForTest);

  } catch (error) {
    console.error("Error in debug auth:", error);
  }
}

// Run the debug function
debugAuth().then(() => {
  console.log("Auth debugging completed");
});