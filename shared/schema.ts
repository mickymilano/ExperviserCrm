import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  decimal,
  date,
  boolean, 
  json,
  jsonb,
  primaryKey,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Definizione tipo Json per le colonne JSON
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Enumerazioni
 */
export const userRoleEnum = ['user', 'admin', 'super_admin'] as const;
export const userStatusEnum = ['active', 'inactive', 'suspended', 'pending'] as const;
export const entityStatusEnum = ['active', 'archived'] as const;
export const emailTypeEnum = ['work', 'personal', 'previous_work', 'other'] as const;

/**
 * USERS
 * Tabella degli utenti del sistema
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  backupEmail: varchar('backup_email', { length: 100 }),
  role: varchar('role', { length: 20 })
    .$type<typeof userRoleEnum[number]>()
    .default('user')
    .notNull(),
  status: varchar('status', { length: 20 })
    .$type<typeof userStatusEnum[number]>()
    .default('active')
    .notNull(),
  // Colonna email_verified aggiunta al database
  emailVerified: boolean('email_verified').default(false),
  // Altri campi allineati con il database reale
  loginAttempts: integer('login_attempts').default(0),
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordExpires: timestamp('reset_password_expires'),
  jobTitle: varchar('job_title', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }),
  language: varchar('language', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  lastLogin: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * CONTACTS
 * Tabella dei contatti
 */
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  middleName: varchar('middle_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 })
    .$type<typeof entityStatusEnum[number]>()
    .default('active')
    .notNull(),
  // Nuovi campi allineati alla struttura reale
  mobilePhone: text('mobile_phone'),
  companyEmail: text('company_email'),
  privateEmail: text('private_email'),
  officePhone: text('office_phone'),
  privatePhone: text('private_phone'),
  linkedin: text('linkedin'),
  facebook: text('facebook'),
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  notes: text('notes'),
  tags: text('tags').array(),
  roles: json('roles'),
  customFields: json('custom_fields'),
  lastContactedAt: timestamp('last_contacted_at'),
  nextFollowUpAt: timestamp('next_follow_up_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    nameIdx: index('contact_name_idx').on(table.firstName, table.lastName),
  };
});

/**
 * COMPANIES
 * Tabella delle aziende
 */
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 })
    .$type<typeof entityStatusEnum[number]>()
    .default('active')
    .notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  
  // -------------------------------------------------------
  // CAMPI DEPRECATI: USARE 'full_address' PER QUALSIASI NUOVO SVILUPPO
  // -------------------------------------------------------
  
  /**
   * @deprecated Questo campo è mantenuto solo per retrocompatibilità. 
   * Usare 'full_address' per salvare/leggere indirizzi completi.
   * Sarà rimosso nella versione 2.0 (prevista 2025-06)
   */
  address: text('address'),
  
  /**
   * @deprecated Questo campo NON ESISTE più nel database.
   * Mantenuto nel tipo per retrocompatibilità frontend.
   * Sarà rimosso nel codice nella versione 2.0 (prevista 2025-06)
   */
  // city: varchar('city', { length: 50 }),
  
  /**
   * @deprecated Questo campo NON ESISTE più nel database.
   * Mantenuto nel tipo per retrocompatibilità frontend.
   * Sarà rimosso nel codice nella versione 2.0 (prevista 2025-06)
   */
  // region: varchar('region', { length: 50 }),
  
  /**
   * @deprecated Questo campo NON ESISTE più nel database.
   * Mantenuto nel tipo per retrocompatibilità frontend.
   * Sarà rimosso nel codice nella versione 2.0 (prevista 2025-06)
   */
  // postalCode: varchar('postal_code', { length: 20 }),
  
  // Campo unificato per la gestione degli indirizzi (2025-05-13)
  // QUESTO È IL CAMPO DA USARE PER TUTTE LE NUOVE IMPLEMENTAZIONI
  full_address: text('full_address'),
  
  /**
   * @deprecated Questo campo ESISTE ancora nel database ma è deprecated.
   * Usare 'full_address' che include anche il country.
   * Sarà rimosso nella versione 2.0 (prevista 2025-06)
   */
  country: varchar('country', { length: 50 }),
  website: varchar('website', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  sector: varchar('sector', { length: 100 }),
  description: text('description'),
  employee_count: integer('employee_count'),
  annual_revenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  founded_year: integer('founded_year'),
  logo: text('logo'),
  tags: text('tags').array(),
  notes: text('notes'),
  custom_fields: jsonb('custom_fields'),
  parent_company_id: integer('parent_company_id').references(() => companies.id),
  linkedin_url: varchar('linkedin_url', { length: 255 }),
  location_types: text('location_types').array(),
  
  // Campo per il contatto primario dell'azienda
  primary_contact_id: integer('primary_contact_id').references(() => contacts.id),
  
  // Campi presenti nel database
  last_contacted_at: timestamp('last_contacted_at'),
  next_follow_up_at: timestamp('next_follow_up_at'),
  is_active_rep: boolean('is_active_rep').default(false),
  company_type: varchar('company_type', { length: 50 }),
  brands: text('brands').array(),
  channels: text('channels').array(),
  products_or_services_tags: text('products_or_services_tags').array(),
  
  // Tag multipli per la relazione utente↔azienda
  relations: jsonb('relations').default('[]').notNull(),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/**
 * AREAS OF ACTIVITY
 * Tabella delle relazioni tra contatti e aziende
 * Un contatto può essere associato a più aziende con diversi ruoli
 */
export const areasOfActivity = pgTable('areas_of_activity', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').notNull().references(() => contacts.id),
  companyId: integer('company_id').references(() => companies.id),
  companyName: varchar('company_name', { length: 100 }),
  branchId: integer('branch_id').references(() => branches.id),
  role: varchar('role', { length: 100 }),
  jobDescription: text('job_description'),
  isPrimary: boolean('is_primary'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * DEALS
 * Tabella delle opportunità di business
 */
export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 })
    .$type<typeof entityStatusEnum[number]>()
    .default('active')
    .notNull(),
  contactId: integer('contact_id').references(() => contacts.id),
  companyId: integer('company_id').references(() => companies.id),
  branchId: integer('branch_id').references(() => branches.id),
  value: decimal('value', { precision: 15, scale: 2 }),
  notes: text('notes'),
  tags: text('tags').array(),
  stageId: integer('stage_id').references(() => pipelineStages.id),
  lastContactedAt: timestamp('last_contacted_at'),
  expectedCloseDate: date('expected_close_date'),
  // actualCloseDate: date('actual_close_date'), // Rimosso perché non esiste nel database
  nextFollowUpAt: timestamp('next_follow_up_at'),
  // description: text('description'), // Rimosso perché non esiste nel database
  // probability: integer('probability'), // Rimosso perché non esiste nel database
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * PIPELINE STAGES
 * Tabella delle fasi della pipeline di vendita
 */
export const pipelineStages = pgTable('pipeline_stages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  order: integer('order').notNull(),
});

/**
 * LEADS
 * Tabella dei lead (contatti potenziali)
 */
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }),
  role: varchar('role', { length: 100 }),
  status: varchar('status', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 50 }),
  region: varchar('region', { length: 50 }),
  country: varchar('country', { length: 50 }),
  postalCode: varchar('postal_code', { length: 20 }),
  company: varchar('company_name', { length: 100 }), // Mappa 'company' frontend a 'company_name' database
  website: varchar('website', { length: 255 }),
  source: varchar('source', { length: 100 }),
  notes: text('notes'),
  customFields: json('custom_fields'),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Schema per validazione con Zod
 */
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(userRoleEnum),
  status: z.enum(userStatusEnum),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });

// Per retrocompatibilità, estendiamo il tipo Contact per includere campi legacy
export interface ContactExtended {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: typeof entityStatusEnum[number];
  mobilePhone: string | null;
  companyEmail: string | null;
  privateEmail: string | null;
  officePhone: string | null;
  privatePhone: string | null;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  notes: string | null;
  tags: string[] | null;
  roles: any | null; // Json
  customFields: any | null; // Json
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  
  // Campi virtuali per retrocompatibilità
  email: string | null; // Mapping di companyEmail o privateEmail
  phone: string | null; // Mapping di mobilePhone, officePhone o privatePhone
  
  // Relazioni
  areasOfActivity: AreaOfActivity[];
}

// Creiamo lo schema di inserimento base
const baseInsertCompanySchema = createInsertSchema(companies).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Estendiamo lo schema per omettere i campi deprecati
export const insertCompanySchema = baseInsertCompanySchema.extend({
  // Ridichiariamo fullAddress e address come opzionali esplicitamente
  fullAddress: z.string().optional(),
  address: z.string().optional()
}).omit({
  // I campi city e region verranno omessi dal validatore
  city: true,
  region: true 
});

export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAreaOfActivitySchema = createInsertSchema(areasOfActivity).omit({ id: true, createdAt: true, updatedAt: true });

/**
 * SYNERGIES
 * Tabella delle sinergie tra contatti e aziende
 */
export const synergies = pgTable('synergies', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').notNull().references(() => contacts.id),
  companyId: integer('company_id').notNull().references(() => companies.id),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  dealId: integer('deal_id').references(() => deals.id),
  status: varchar('status', { length: 50 }).default('Active'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * CONTACT EMAILS
 * Tabella delle email di contatto
 * Un contatto può avere più email di tipo diverso
 */
export const contactEmails = pgTable('contact_emails', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  emailAddress: text('email_address').notNull(),
  type: varchar('type', { length: 20 })
    .$type<typeof emailTypeEnum[number]>()
    .default('work')
    .notNull(),
  isPrimary: boolean('is_primary').default(false),
  isArchived: boolean('is_archived').default(false),
  status: varchar('status', { length: 20 })
    .$type<typeof entityStatusEnum[number]>()
    .default('active')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => {
  return {
    contactIdIdx: index('contact_emails_contact_id_idx').on(table.contactId),
    uniqueEmailPerContact: uniqueIndex('contact_emails_contact_id_email_address_idx').on(table.contactId, table.emailAddress),
  };
});

export const insertSynergySchema = createInsertSchema(synergies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactEmailSchema = createInsertSchema(contactEmails).omit({ id: true, createdAt: true, updatedAt: true });

/**
 * Types
 */
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Usiamo ContactBase per il tipo di base generato da Drizzle
export type ContactBase = typeof contacts.$inferSelect;
// Usiamo Contact per il tipo esteso con campi di compatibilità
export type Contact = ContactExtended;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;

export type AreaOfActivity = typeof areasOfActivity.$inferSelect;
export type InsertAreaOfActivity = z.infer<typeof insertAreaOfActivitySchema>;

export type Synergy = typeof synergies.$inferSelect;
export type InsertSynergy = z.infer<typeof insertSynergySchema>;

export type ContactEmail = typeof contactEmails.$inferSelect;
export type InsertContactEmail = z.infer<typeof insertContactEmailSchema>;

/**
 * EMAIL SIGNATURES
 * Tabella per le firme email
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

export const insertEmailSignatureSchema = createInsertSchema(emailSignatures).omit({ id: true, createdAt: true, updatedAt: true });
export type EmailSignature = typeof emailSignatures.$inferSelect;
export type InsertEmailSignature = z.infer<typeof insertEmailSignatureSchema>;

/**
 * SECTOR HIERARCHY
 * Tabelle per la struttura gerarchica settori/sottosettori/job titles
 */
export const sectors = pgTable('sectors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique()
  // Rimosse colonne createdAt e updatedAt che non esistono nel database reale
});

export const sub_sectors = pgTable('sub_sectors', {
  id: serial('id').primaryKey(),
  sectorId: integer('sector_id').notNull().references(() => sectors.id, { onDelete: 'cascade' }),
  name: text('name').notNull()
  // Rimosse colonne createdAt e updatedAt che non esistono nel database reale
});

export const job_titles = pgTable('job_titles', {
  id: serial('id').primaryKey(),
  subSectorId: integer('sub_sector_id').notNull().references(() => sub_sectors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Rimossi campi createdAt e updatedAt che non esistono nel database reale
});

// Schema inserimento
export const insertSectorSchema = createInsertSchema(sectors).omit({ id: true });
export const insertSubSectorSchema = createInsertSchema(sub_sectors).omit({ id: true });
export const insertJobTitleSchema = createInsertSchema(job_titles).omit({ id: true });

// Tipi
export type Sector = typeof sectors.$inferSelect;
export type InsertSector = z.infer<typeof insertSectorSchema>;

export type SubSector = typeof sub_sectors.$inferSelect;
export type InsertSubSector = z.infer<typeof insertSubSectorSchema>;

export type JobTitle = typeof job_titles.$inferSelect;
export type InsertJobTitle = z.infer<typeof insertJobTitleSchema>;

/**
 * BRANCHES
 * Tabella delle filiali/sedi delle aziende
 */
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 50 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  description: text('description'),
  isHeadquarters: boolean('is_headquarters').default(false),
  customFields: jsonb('custom_fields'),
  managers: jsonb('managers').default('[]').notNull(), // Array di responsabili con ruoli
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  instagramUrl: varchar('instagram_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    companyIdIdx: index('branch_company_id_idx').on(table.companyId),
  };
});

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true, updatedAt: true });
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

/**
 * EMAIL ACCOUNT SCHEMA
 * Tabella degli account email 
 */
export const emailAccounts = pgTable('email_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  server: varchar('server', { length: 255 }).notNull(),
  port: integer('port').notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  protocol: varchar('protocol', { length: 20 }).notNull(),
  incomingServer: varchar('incoming_server', { length: 255 }),
  incomingPort: integer('incoming_port'),
  outgoingServer: varchar('outgoing_server', { length: 255 }),
  outgoingPort: integer('outgoing_port'),
  ssl: boolean('ssl').default(true),
  isDefault: boolean('is_default').default(false),
  status: varchar('status', { length: 20 })
    .$type<typeof entityStatusEnum[number]>()
    .default('active')
    .notNull(),
  lastSynced: timestamp('last_synced'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * SIGNATURES SCHEMA
 * Tabella delle firme email
 */
export const signatures = pgTable('signatures', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  content: text('content').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * ACCOUNT SIGNATURES SCHEMA
 * Tabella per associare firme agli account email
 */
export const accountSignatures = pgTable('account_signatures', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => emailAccounts.id),
  signatureId: integer('signature_id').notNull().references(() => signatures.id),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * EMAIL SCHEMA
 * Tabella delle email
 */
export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => emailAccounts.id),
  messageId: varchar('message_id', { length: 255 }),
  from: varchar('from', { length: 255 }).notNull(),
  to: text('to').array(),
  cc: text('cc').array(),
  bcc: text('bcc').array(),
  subject: text('subject'),
  body: text('body'),
  plainText: text('plain_text'),
  date: timestamp('date').notNull(),
  isRead: boolean('is_read').default(false),
  isStarred: boolean('is_starred').default(false),
  isDeleted: boolean('is_deleted').default(false),
  folder: varchar('folder', { length: 50 }).default('inbox'),
  attachments: json('attachments'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Schema for email accounts
export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for signatures
export const insertSignatureSchema = createInsertSchema(signatures).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for account signatures
export const insertAccountSignatureSchema = createInsertSchema(accountSignatures).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for emails
export const insertEmailSchema = createInsertSchema(emails).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = z.infer<typeof insertSignatureSchema>;

export type AccountSignature = typeof accountSignatures.$inferSelect;
export type InsertAccountSignature = z.infer<typeof insertAccountSignatureSchema>;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

/**
 * TASKS SCHEMA
 * Tabella delle attività
 */
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startDateTime: timestamp('start_date_time'),
  endDateTime: timestamp('end_date_time'),
  dueDate: timestamp('due_date'),
  taskValue: integer('task_value').default(0),
  completed: boolean('completed').default(false),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  contactId: integer('contact_id').references(() => contacts.id),
  companyId: integer('company_id').references(() => companies.id),
  dealId: integer('deal_id').references(() => deals.id),
  leadId: integer('lead_id').references(() => leads.id),
  isCalendarEvent: boolean('is_calendar_event').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * MEETINGS SCHEMA
 * Tabella delle riunioni
 */
export const meetings = pgTable('meetings', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: varchar('location', { length: 255 }),
  type: varchar('type', { length: 50 }).default('in_person'),
  organizerId: integer('organizer_id').references(() => users.id),
  contactId: integer('contact_id').references(() => contacts.id),
  companyId: integer('company_id').references(() => companies.id),
  dealId: integer('deal_id').references(() => deals.id),
  leadId: integer('lead_id').references(() => leads.id),
  notes: text('notes'),
  reminder: timestamp('reminder'),
  status: varchar('status', { length: 20 }).default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * ACTIVITIES SCHEMA
 * Tabella delle attività generiche (log)
 */
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  userId: integer('user_id').references(() => users.id),
  contactId: integer('contact_id').references(() => contacts.id),
  companyId: integer('company_id').references(() => companies.id),
  dealId: integer('deal_id').references(() => deals.id),
  leadId: integer('lead_id').references(() => leads.id),
  taskId: integer('task_id').references(() => tasks.id),
  meetingId: integer('meeting_id').references(() => meetings.id),
  emailId: integer('email_id').references(() => emails.id),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Schema for tasks
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for meetings
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for activities
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

// Types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

/**
 * USER SESSIONS
 * Tabella delle sessioni utente
 */
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivity: timestamp('last_activity').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * SECURITY LOGS
 * Tabella dei log di sicurezza
 */
export const securityLogs = pgTable('security_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Schema for user sessions and security logs
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true });
export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({ id: true, createdAt: true });

// Types
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;

/**
 * Relations
 */
// Contact to ContactEmails (one-to-many)
export const contactsRelations = relations(contacts, ({ many }) => ({
  emails: many(contactEmails),
}));

// ContactEmails to Contact (many-to-one)
export const contactEmailsRelations = relations(contactEmails, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEmails.contactId],
    references: [contacts.id],
  }),
}));

// Relazioni per settori/sottosettori/job titles
export const sectorsRelations = relations(sectors, ({ many }) => ({
  subSectors: many(sub_sectors),
}));

export const subSectorsRelations = relations(sub_sectors, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [sub_sectors.sectorId],
    references: [sectors.id],
  }),
  jobTitles: many(job_titles),
}));

export const jobTitlesRelations = relations(job_titles, ({ one }) => ({
  subSector: one(sub_sectors, {
    fields: [job_titles.subSectorId],
    references: [sub_sectors.id],
  }),
}));