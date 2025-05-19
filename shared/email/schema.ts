import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  primaryKey,
  json,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../schema';

// Tipi di server email
export const emailServerTypeEnum = ['imap', 'pop3', 'smtp'] as const;

/**
 * ACCOUNT EMAIL
 * Tabella per gli account email configurati dall'utente
 */
export const emailAccounts = pgTable('email_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').default(false),
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: integer('smtp_port'),
  smtpUsername: varchar('smtp_username', { length: 255 }),
  smtpPassword: varchar('smtp_password', { length: 255 }),
  imapHost: varchar('imap_host', { length: 255 }),
  imapPort: integer('imap_port'),
  imapUsername: varchar('imap_username', { length: 255 }),
  imapPassword: varchar('imap_password', { length: 255 }),
  useSSL: boolean('use_ssl').default(true),
  lastSynced: timestamp('last_synced'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailAccountsRelations = relations(emailAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [emailAccounts.userId],
    references: [users.id],
  }),
}));

/**
 * FIRME EMAIL
 * Tabella per le firme email dell'utente
 */
export const emailSignatures = pgTable('email_signatures', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  content: text('content').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailSignaturesRelations = relations(emailSignatures, ({ one }) => ({
  user: one(users, {
    fields: [emailSignatures.userId],
    references: [users.id],
  }),
}));

/**
 * ASSOCIAZIONE FIRME-ACCOUNT
 * Tabella per associare firme email ad account specifici
 */
export const emailAccountSignatures = pgTable('email_account_signatures', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => emailAccounts.id),
  signatureId: integer('signature_id').notNull().references(() => emailSignatures.id),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailAccountSignaturesRelations = relations(emailAccountSignatures, ({ one }) => ({
  account: one(emailAccounts, {
    fields: [emailAccountSignatures.accountId],
    references: [emailAccounts.id],
  }),
  signature: one(emailSignatures, {
    fields: [emailAccountSignatures.signatureId],
    references: [emailSignatures.id],
  }),
}));

/**
 * EMAIL
 * Tabella per le email inviate e ricevute
 */
export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => emailAccounts.id),
  subject: varchar('subject', { length: 255 }),
  body: text('body'),
  bodyType: varchar('body_type', { length: 20 }).default('text/html'),
  from: varchar('from', { length: 255 }).notNull(),
  fromName: varchar('from_name', { length: 255 }),
  to: jsonb('to').notNull(), // Array di destinatari
  cc: jsonb('cc'), // Array di CC
  bcc: jsonb('bcc'), // Array di BCC
  messageId: varchar('message_id', { length: 255 }),
  inReplyTo: varchar('in_reply_to', { length: 255 }),
  references: text('references'),
  date: timestamp('date').defaultNow(),
  receivedDate: timestamp('received_date'),
  sentDate: timestamp('sent_date'),
  isRead: boolean('is_read').default(false),
  isSent: boolean('is_sent').default(false),
  isDraft: boolean('is_draft').default(false),
  isStarred: boolean('is_starred').default(false),
  isTrash: boolean('is_trash').default(false),
  isSpam: boolean('is_spam').default(false),
  folder: varchar('folder', { length: 50 }).default('inbox'),
  hasAttachments: boolean('has_attachments').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailsRelations = relations(emails, ({ one, many }) => ({
  account: one(emailAccounts, {
    fields: [emails.accountId],
    references: [emailAccounts.id],
  }),
  attachments: many(emailAttachments),
  labels: many(emailLabels, { through: emailEmailLabels }),
  entityAssociations: many(emailEntityAssociations),
}));

/**
 * ALLEGATI EMAIL
 * Tabella per gli allegati delle email
 */
export const emailAttachments = pgTable('email_attachments', {
  id: serial('id').primaryKey(),
  emailId: integer('email_id').notNull().references(() => emails.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }),
  size: integer('size'),
  content: text('content'),
  isInline: boolean('is_inline').default(false),
  contentId: varchar('content_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const emailAttachmentsRelations = relations(emailAttachments, ({ one }) => ({
  email: one(emails, {
    fields: [emailAttachments.emailId],
    references: [emails.id],
  }),
}));

/**
 * ETICHETTE EMAIL
 * Tabella per le etichette personalizzate delle email
 */
export const emailLabels = pgTable('email_labels', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailLabelsRelations = relations(emailLabels, ({ one, many }) => ({
  user: one(users, {
    fields: [emailLabels.userId],
    references: [users.id],
  }),
  emails: many(emails, { through: emailEmailLabels }),
}));

/**
 * ASSOCIAZIONE EMAIL-ETICHETTE
 * Tabella di associazione molti-a-molti tra email ed etichette
 */
export const emailEmailLabels = pgTable('email_email_labels', {
  emailId: integer('email_id').notNull().references(() => emails.id),
  labelId: integer('label_id').notNull().references(() => emailLabels.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.emailId, table.labelId] }),
  };
});

/**
 * ASSOCIAZIONE EMAIL-ENTITÀ
 * Tabella per associare le email alle diverse entità (contatti, aziende, opportunità, ecc.)
 */
export const emailEntityAssociations = pgTable('email_entity_associations', {
  id: serial('id').primaryKey(),
  emailId: integer('email_id').notNull().references(() => emails.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'contact', 'company', 'deal', 'lead', ecc.
  entityId: integer('entity_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const emailEntityAssociationsRelations = relations(emailEntityAssociations, ({ one }) => ({
  email: one(emails, {
    fields: [emailEntityAssociations.emailId],
    references: [emails.id],
  }),
}));

// Schema Zod per validazione

export const insertEmailAccountSchema = createInsertSchema(emailAccounts, {
  email: z.string().email(),
  smtpPort: z.number().int().positive().optional(),
  imapPort: z.number().int().positive().optional(),
}).omit({ id: true });

export const insertEmailSignatureSchema = createInsertSchema(emailSignatures).omit({ id: true });

export const insertEmailAccountSignatureSchema = createInsertSchema(emailAccountSignatures).omit({ id: true });

export const insertEmailSchema = createInsertSchema(emails).omit({ id: true });

export const insertEmailAttachmentSchema = createInsertSchema(emailAttachments).omit({ id: true });

export const insertEmailLabelSchema = createInsertSchema(emailLabels).omit({ id: true });

export const insertEmailEntityAssociationSchema = createInsertSchema(emailEntityAssociations).omit({ id: true });

// Tipi TypeScript derivati dagli schema
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

export type EmailSignature = typeof emailSignatures.$inferSelect;
export type InsertEmailSignature = z.infer<typeof insertEmailSignatureSchema>;

export type EmailAccountSignature = typeof emailAccountSignatures.$inferSelect;
export type InsertEmailAccountSignature = z.infer<typeof insertEmailAccountSignatureSchema>;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type InsertEmailAttachment = z.infer<typeof insertEmailAttachmentSchema>;

export type EmailLabel = typeof emailLabels.$inferSelect;
export type InsertEmailLabel = z.infer<typeof insertEmailLabelSchema>;

export type EmailEntityAssociation = typeof emailEntityAssociations.$inferSelect;
export type InsertEmailEntityAssociation = z.infer<typeof insertEmailEntityAssociationSchema>;