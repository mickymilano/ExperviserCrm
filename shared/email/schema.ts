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
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nome descrittivo dell'account
  email: varchar("email", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // gmail, outlook, imap, ecc.
  
  // Dati di configurazione SMTP/IMAP
  imapHost: varchar("imap_host", { length: 255 }),
  imapPort: integer("imap_port"),
  imapSecure: boolean("imap_secure").default(true),
  
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: integer("smtp_port"),
  smtpSecure: boolean("smtp_secure").default(true),
  
  // Credenziali - in produzione andrebbero criptate
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  
  // Supporto per OAuth2
  oauthEnabled: boolean("oauth_enabled").default(false),
  oauthRefreshToken: text("oauth_refresh_token"),
  oauthAccessToken: text("oauth_access_token"),
  oauthExpiry: timestamp("oauth_expiry"),
  
  // Stato e configurazioni
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  syncFrequency: integer("sync_frequency").default(5), // Minuti tra una sincronizzazione e l'altra
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella per memorizzare i messaggi email
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(), // Riferimento all'account da cui è stato ricevuto/inviato
  messageId: varchar("message_id", { length: 255 }), // ID univoco dell'email (header Message-ID)
  conversationId: varchar("conversation_id", { length: 255 }), // ID della conversazione (thread)
  
  // Mittente e destinatari
  from: jsonb("from"), // {name: "Nome", address: "email"}
  to: jsonb("to"), // Array di {name, address}
  cc: jsonb("cc"), // Array di {name, address}
  bcc: jsonb("bcc"), // Array di {name, address}
  
  // Contenuto
  subject: text("subject"),
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  
  // Metadati
  receivedDate: timestamp("received_date"),
  sentDate: timestamp("sent_date"),
  isRead: boolean("is_read").default(false),
  isFlagged: boolean("is_flagged").default(false),
  hasAttachments: boolean("has_attachments").default(false),
  attachments: jsonb("attachments"), // Array di {filename, contentType, size, content}
  
  // Dati estratti dalla firma e informazioni aggiuntive
  extractedData: jsonb("extracted_data"), // Dati estratti dalla firma dell'email
  rawHeaders: jsonb("raw_headers"), // Tutti gli header originali dell'email
  
  // Tipo e stato
  direction: varchar("direction", { length: 10 }).notNull(), // "inbound" o "outbound"
  status: varchar("status", { length: 20 }).default("received"), // received, sent, draft, etc.
  
  // Associazione con CRM (può essere null se non associato)
  dealId: integer("deal_id"),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella per memorizzare le associazioni tra email e entità CRM
export const emailAssociations = pgTable("email_associations", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull(),
  
  // Entità CRM associata (solo uno di questi sarà popolato)
  dealId: integer("deal_id"),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  leadId: integer("lead_id"),
  
  // Tipo di associazione
  associationType: varchar("association_type", { length: 50 }).notNull(), // primary, mentioned, etc.
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema Zod per validazione dati
export const insertEmailAccountSchema = createInsertSchema(emailAccounts, {
  email: z.string().email("Indirizzo email non valido"),
  imapPort: z.number().optional(),
  smtpPort: z.number().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertEmailSchema = createInsertSchema(emails).omit({ 
  id: true, createdAt: true, updatedAt: true 
});

export const insertEmailAssociationSchema = createInsertSchema(emailAssociations).omit({ 
  id: true, createdAt: true, updatedAt: true 
});

// Tipi inferiti
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

export type EmailAssociation = typeof emailAssociations.$inferSelect;
export type InsertEmailAssociation = typeof emailAssociations.$inferInsert;