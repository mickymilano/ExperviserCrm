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
  primaryKey 
} from 'drizzle-orm/pg-core';
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
  emailVerified: boolean('email_verified').default(false),
  avatar: text('avatar'),
  preferences: json('preferences'),
  lastLogin: timestamp('last_login'),
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
  lastName: varchar('last_name', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 })
    .$type<typeof entityStatusEnum[number]>()
    .default('active')
    .notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 50 }),
  region: varchar('region', { length: 50 }),
  country: varchar('country', { length: 50 }),
  postalCode: varchar('postal_code', { length: 20 }),
  website: varchar('website', { length: 255 }),
  birthday: date('birthday'),
  notes: text('notes'),
  source: varchar('source', { length: 100 }),
  tags: text('tags').array(),
  avatar: text('avatar'),
  customFields: json('custom_fields'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  address: text('address'),
  city: varchar('city', { length: 50 }),
  region: varchar('region', { length: 50 }),
  country: varchar('country', { length: 50 }),
  postalCode: varchar('postal_code', { length: 20 }),
  website: varchar('website', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  description: text('description'),
  employeeCount: integer('employee_count'),
  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  foundedYear: integer('founded_year'),
  logo: text('logo'),
  tags: text('tags').array(),
  notes: text('notes'),
  customFields: json('custom_fields'),
  parentCompanyId: integer('parent_company_id').references(() => companies.id),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  locationTypes: text('location_types').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  value: decimal('value', { precision: 15, scale: 2 }),
  notes: text('notes'),
  tags: text('tags').array(),
  stageId: integer('stage_id').references(() => pipelineStages.id),
  lastContactedAt: timestamp('last_contacted_at'),
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),
  nextFollowUpAt: timestamp('next_follow_up_at'),
  description: text('description'),
  probability: integer('probability'),
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
  description: text('description'),
  position: integer('position').notNull(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  company: varchar('company', { length: 100 }),
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

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });

export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAreaOfActivitySchema = createInsertSchema(areasOfActivity).omit({ id: true, createdAt: true, updatedAt: true });

/**
 * Types
 */
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contact = typeof contacts.$inferSelect;
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