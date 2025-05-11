/**
 * Script to update Michele Ardoni's user information as well as add timezone, language, phone, 
 * and jobTitle fields to all users
 */
import { pool } from "./db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

async function updateUserFields() {
  try {
    console.log("Updating Michele Ardoni's user information...");
    
    const db = drizzle(pool);
    
    // First, update Michele Ardoni
    const [micheleUser] = await db.select()
      .from(users)
      .where(sql`${users.email} = 'michele@experviser.com'`);
    
    if (micheleUser) {
      console.log("Found Michele Ardoni, updating profile...");
      
      await db.update(users)
        .set({
          fullName: "Michele Ardoni",
          timezone: "Europe/Rome",
          language: "English",
          phone: "+39 123 456 7890",
          jobTitle: "CEO",
          // Make sure Michele has admin privileges
          role: "super_admin"
        })
        .where(sql`${users.id} = ${micheleUser.id}`);
      
      console.log("Michele Ardoni profile updated successfully!");
    } else {
      console.log("Michele Ardoni not found, creating account...");
      
      // Create Michele if he doesn't exist
      await db.insert(users).values({
        username: "michele",
        password: "$2b$10$8r0qPVaJeLAUwP8C5NTxB.bHdZkj.xIX5joMAt9UtdYt5JyVjLmYS", // hashed admin_admin_69
        fullName: "Michele Ardoni",
        email: "michele@experviser.com",
        timezone: "Europe/Rome",
        language: "English",
        phone: "+39 123 456 7890",
        jobTitle: "CEO",
        role: "super_admin"
      });
      
      console.log("Michele Ardoni account created successfully!");
    }
    
    // Update all other users with default timezone and language
    await db.update(users)
      .set({
        timezone: sql`COALESCE(${users.timezone}, 'Europe/Rome')`,
        language: sql`COALESCE(${users.language}, 'English')`
      })
      .where(sql`${users.timezone} IS NULL OR ${users.language} IS NULL`);
    
    console.log("All users updated with timezone and language preferences!");
    
  } catch (error) {
    console.error("Error updating user fields:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
updateUserFields().then(() => {
  console.log("User fields update completed!");
});