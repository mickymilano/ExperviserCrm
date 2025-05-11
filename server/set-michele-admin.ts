/**
 * Script to set Michele Ardoni as the main super admin
 * This script will:
 * 1. Check if Michele exists and create/update as needed
 * 2. Reset user sessions to ensure clean login
 */
import { pool } from "./db";
import { users, userSessions } from "../shared/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

async function setMicheleAsAdmin() {
  try {
    console.log("Setting Michele Ardoni as main super admin...");
    
    const db = drizzle(pool);
    
    // Hash password for Michele
    const hashedPassword = await bcrypt.hash('admin_admin_69', 10);
    
    // Find Michele account
    const [micheleUser] = await db.select()
      .from(users)
      .where(sql`${users.email} = 'michele@experviser.com'`);
    
    if (micheleUser) {
      console.log("Found Michele Ardoni (ID:", micheleUser.id, "), updating to super_admin...");
      
      // Update Michele to ensure it's a super_admin with correct details
      await db.update(users)
        .set({
          username: "michele",
          fullName: "Michele Ardoni",
          role: "super_admin",
          status: "active",
          password: hashedPassword,
          timezone: "Europe/Rome",
          language: "English",
          phone: "+39 123 456 7890",
          jobTitle: "CEO",
          updatedAt: new Date()
        })
        .where(eq(users.id, micheleUser.id));
      
      console.log("Michele Ardoni updated to super_admin!");
      
      // Delete any existing sessions for Michele 
      // to ensure clean login with new data
      await db.delete(userSessions)
        .where(eq(userSessions.userId, micheleUser.id));
      
      console.log("Michele's sessions cleared for clean login");
    } else {
      console.log("Michele account not found, creating new super_admin account...");
      
      // Create new Michele account
      const [newMichele] = await db.insert(users)
        .values({
          username: "michele",
          password: hashedPassword,
          fullName: "Michele Ardoni",
          email: "michele@experviser.com",
          role: "super_admin",
          status: "active",
          timezone: "Europe/Rome",
          language: "English",
          phone: "+39 123 456 7890",
          jobTitle: "CEO",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log("Michele Ardoni created as super_admin with ID:", newMichele.id);
    }
    
    // Clear all sessions to force re-login
    console.log("Clearing all sessions to force clean login for all users...");
    await db.delete(userSessions);
    
    console.log("Set Michele Ardoni as main super admin completed!");
    
  } catch (error) {
    console.error("Error setting Michele as admin:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
setMicheleAsAdmin().then(() => {
  console.log("Script execution completed!");
});