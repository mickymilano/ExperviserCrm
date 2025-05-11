import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * This is a simplified database connection that completely avoids the relational
 * query functionality of Drizzle ORM which was causing the
 * "Cannot read properties of undefined (reading 'map')" error
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Use explicit tables instead of the entire schema to avoid relation definitions
export const db = drizzle(pool, {
  schema: {
    users: schema.users,
    userSessions: schema.userSessions,
    securityLogs: schema.securityLogs,
    leads: schema.leads,
    areasOfActivity: schema.areasOfActivity,
    contacts: schema.contacts,
    companies: schema.companies,
    pipelineStages: schema.pipelineStages,
    deals: schema.deals,
    tasks: schema.tasks,
    emailAccounts: schema.emailAccounts,
    emails: schema.emails,
    activities: schema.activities,
    meetings: schema.meetings,
    signatures: schema.signatures,
    accountSignatures: schema.accountSignatures,
  },
  // Force simple queries without relational features
  logger: false,
});