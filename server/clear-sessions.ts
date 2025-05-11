/**
 * Script to completely delete all user sessions and force re-authentication
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./db";
import { userSessions } from "../shared/schema";

async function clearAllSessions() {
  console.log("Starting session cleanup...");
  
  try {
    const db = drizzle(pool);
    
    // Delete all user sessions to force re-login
    const result = await db.delete(userSessions);
    
    console.log("All sessions have been deleted successfully.");
    console.log("Users will need to log in again with their credentials.");
    console.log("Super admin credentials:");
    console.log("Email: michele@experviser.com");
    console.log("Password: admin_admin_69");
    
  } catch (error) {
    console.error("Error clearing sessions:", error);
  } finally {
    await pool.end();
    console.log("Session cleanup completed.");
  }
}

// Run the function
clearAllSessions();