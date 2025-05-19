import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  boolean, 
  jsonb 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabella per memorizzare gli account email configurati
// NOTA: Questo schema riflette la struttura reale del database
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  displayName: text("display_name").notNull(), // Nome descrittivo dell'account
  email: text("email").notNull(),
  
  // Dati di configurazione SMTP/IMAP
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  imapSecure: boolean("imap_secure").default(true),
  
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpSecure: boolean("smtp_secure").default(true),
  
  // Credenziali - in produzione andrebbero criptate
  username: text("username").notNull(),
  password: text("password").notNull(),
  
  // Stato e configurazioni
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  status: text("status").default("unknown"),
  lastSyncTime: timestamp("last_sync_time"),
  lastError: text("last_error"),
});

// Tabella per memorizzare i messaggi email
// NOTA: Questo schema riflette la struttura reale del database
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  from: text("from").notNull(),
  to: text("to").array(),
  cc: text("cc").array(),
  bcc: text("bcc").array(),
  date: timestamp("date").notNull(),
  read: boolean("read").default(false),
  accountId: integer("account_id").notNull(),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  dealId: integer("deal_id"),
  messageId: text("message_id"),
});

// NOTA: La tabella email_associations non esiste ancora nel database
// Questa definizione è pronta per quando verrà creata la tabella
/*
export const emailAssociations = pgTable("email_associations", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull(),
  
  // Entità CRM associata (solo uno di questi sarà popolato)
  dealId: integer("deal_id"),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  leadId: integer("lead_id"),
  
  // Tipo di associazione
  associationType: text("association_type").notNull(), // primary, mentioned, etc.
});
*/

// Schema Zod per validazione dati
export const insertEmailAccountSchema = createInsertSchema(emailAccounts, {
  email: z.string().email("Indirizzo email non valido"),
  imapPort: z.number(),
  smtpPort: z.number(),
  imapHost: z.string().min(1, "Server IMAP obbligatorio"),
  smtpHost: z.string().min(1, "Server SMTP obbligatorio"),
  username: z.string().min(1, "Username obbligatorio"),
  password: z.string().min(1, "Password obbligatoria"),
}).omit({ id: true })
// Aggiungiamo name per retrocompatibilità con il frontend
.extend({
  name: z.string().min(1, "Il nome dell'account è obbligatorio"),
  
  // Campi virtuali per il frontend
  provider: z.string().default("imap").optional(),
  imapSecurity: z.enum(["ssl", "tls", "none"]).optional(),
  smtpSecurity: z.enum(["ssl", "tls", "none"]).optional(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({ 
  id: true
});

// Tipi inferiti
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;