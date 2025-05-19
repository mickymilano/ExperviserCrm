import { pgTable, text, varchar, integer, timestamp, boolean, serial, jsonb, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Schema per le firme email
export const emailSignatures = pgTable('email_signatures', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // ID dell'utente proprietario della firma
  name: varchar('name').notNull(), // Nome della firma (es: "Professionale", "Informale", etc.)
  content: text('content').notNull(), // Contenuto HTML della firma
  isDefault: boolean('is_default').default(false), // Se questa è la firma predefinita dell'utente
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Schema per associare firme email agli account email
export const emailAccountSignatures = pgTable('email_account_signatures', {
  id: serial('id').primaryKey(),
  emailAccountId: integer('email_account_id').notNull(), // ID dell'account email
  signatureId: integer('signature_id').notNull().references(() => emailSignatures.id, { onDelete: 'cascade' }), // ID della firma
  isDefault: boolean('is_default').default(false), // Se questa è la firma predefinita per l'account
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  // Un account email può avere una sola firma predefinita
  uniqDefault: unique().on(table.emailAccountId).where(table.isDefault.equals(true))
}));

// Schema per account email
export const emailAccounts = pgTable('email_accounts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // ID dell'utente proprietario dell'account
  displayName: varchar('display_name').notNull(), // Nome visualizzato (es: "Email Aziendale")
  email: varchar('email').notNull(), // Indirizzo email
  server: varchar('server').notNull(), // Server IMAP/SMTP
  port: integer('port').notNull(), // Porta IMAP/SMTP
  username: varchar('username').notNull(), // Username per l'autenticazione
  password: varchar('password').notNull(), // Password crittografata
  provider: varchar('provider').default('other'), // Provider: gmail, outlook, other
  lastSyncedAt: timestamp('last_synced_at'), // Data dell'ultima sincronizzazione
  syncFrequency: integer('sync_frequency').default(15), // Frequenza di sincronizzazione in minuti
  isActive: boolean('is_active').default(true), // Se l'account è attivo
  settings: jsonb('settings').default({}), // Impostazioni personalizzate in formato JSON
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Schema per le email
export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => emailAccounts.id, { onDelete: 'cascade' }), // Account associato
  messageId: varchar('message_id').notNull(), // ID messaggio unico
  conversationId: varchar('conversation_id'), // ID conversazione per raggruppare messaggi correlati
  from: varchar('from').notNull(), // Mittente
  to: text('to').notNull(), // Destinatari
  cc: text('cc'), // CC
  bcc: text('bcc'), // BCC
  subject: text('subject'), // Oggetto
  body: text('body'), // Corpo del messaggio in HTML
  plainTextBody: text('plain_text_body'), // Corpo del messaggio in testo semplice
  read: boolean('read').default(false), // Se l'email è stata letta
  flagged: boolean('flagged').default(false), // Se l'email è contrassegnata
  hasAttachments: boolean('has_attachments').default(false), // Se l'email ha allegati
  date: timestamp('date').notNull(), // Data di invio/ricezione
  folderId: varchar('folder_id').notNull(), // ID della cartella (es: "inbox", "sent", "trash")
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Schema per gli allegati
export const emailAttachments = pgTable('email_attachments', {
  id: serial('id').primaryKey(),
  emailId: integer('email_id').notNull().references(() => emails.id, { onDelete: 'cascade' }), // Email associata
  filename: varchar('filename').notNull(), // Nome del file
  contentType: varchar('content_type').notNull(), // Tipo MIME
  size: integer('size').notNull(), // Dimensione in byte
  path: varchar('path'), // Percorso al file su disco o identificatore storage
  content: text('content'), // Contenuto dell'allegato (opzionale, per piccoli allegati)
  createdAt: timestamp('created_at').defaultNow()
});

// Schema per le cartelle
export const emailFolders = pgTable('email_folders', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => emailAccounts.id, { onDelete: 'cascade' }), // Account associato
  name: varchar('name').notNull(), // Nome della cartella
  path: varchar('path').notNull(), // Percorso completo
  type: varchar('type').notNull(), // Tipo: inbox, sent, draft, trash, custom
  unreadCount: integer('unread_count').default(0), // Numero messaggi non letti
  totalCount: integer('total_count').default(0), // Numero totale messaggi
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  // Un account può avere una sola cartella con un dato path
  uniqPath: unique().on(table.accountId, table.path)
}));

// Schema per le email eliminate (soft delete)
export const deletedEmails = pgTable('deleted_emails', {
  id: serial('id').primaryKey(),
  emailId: integer('email_id').notNull(), // Riferimento all'email originale
  deletedAt: timestamp('deleted_at').defaultNow(),
  deletedBy: varchar('deleted_by').notNull() // ID utente che ha eliminato
});

// Schema per i modelli di email
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // ID dell'utente proprietario del modello
  name: varchar('name').notNull(), // Nome del modello
  subject: text('subject'), // Oggetto predefinito
  content: text('content').notNull(), // Contenuto HTML del modello
  isShared: boolean('is_shared').default(false), // Se il modello è condiviso con il team
  category: varchar('category'), // Categoria (es: "followup", "welcome", "support")
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Schema Zod per validazione
export const insertEmailSignatureSchema = createInsertSchema(emailSignatures).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailAccountSignatureSchema = createInsertSchema(emailAccountSignatures).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailSchema = createInsertSchema(emails).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailAttachmentSchema = createInsertSchema(emailAttachments).omit({ id: true, createdAt: true });
export const insertEmailFolderSchema = createInsertSchema(emailFolders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });

// Tipi di inserimento
export type InsertEmailSignature = z.infer<typeof insertEmailSignatureSchema>;
export type InsertEmailAccountSignature = z.infer<typeof insertEmailAccountSignatureSchema>;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type InsertEmailAttachment = z.infer<typeof insertEmailAttachmentSchema>;
export type InsertEmailFolder = z.infer<typeof insertEmailFolderSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Tipi di selezione
export type EmailSignature = typeof emailSignatures.$inferSelect;
export type EmailAccountSignature = typeof emailAccountSignatures.$inferSelect;
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type EmailFolder = typeof emailFolders.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;