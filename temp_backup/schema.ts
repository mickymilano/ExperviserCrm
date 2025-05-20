import { pgTable, pgEnum, serial, text, timestamp, boolean, varchar, integer, json, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum per ruoli utente
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "super_admin"]);

// Enum per stato utente
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended", "pending"]);

// Enum per stato entità
export const entityStatusEnum = pgEnum("entity_status", ["active", "archived"]);

// Tabella utenti
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  backupEmail: varchar("backup_email", { length: 255 }),
  role: userRoleEnum("role").notNull().default("user"),
  status: userStatusEnum("status").notNull().default("active"),
  phone: varchar("phone", { length: 30 }),
  avatar: text("avatar"),
  emailVerified: boolean("email_verified").default(false),
  preferences: json("preferences"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tabella contatti
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  mobile: varchar("mobile", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  website: text("website"),
  birthday: timestamp("birthday"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  source: varchar("source", { length: 100 }),
  roles: json("roles").$type<string[]>(),
  status: entityStatusEnum("status").notNull().default("active"),
  customFields: json("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tabella aziende
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  website: text("website"),
  industry: varchar("industry", { length: 100 }),
  description: text("description"),
  logo: text("logo"),
  employeeCount: integer("employee_count"),
  revenue: varchar("revenue", { length: 100 }),
  tags: json("tags").$type<string[]>(),
  status: entityStatusEnum("status").notNull().default("active"),
  locationTypes: json("location_types").$type<string[]>(),
  customFields: json("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tabella per le aree di attività (relazione tra contatti e aziende)
export const areasOfActivity = pgTable("areas_of_activity", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  companyName: varchar("company_name", { length: 255 }),
  role: varchar("role", { length: 255 }),
  jobDescription: text("job_description"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tabella lead
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  companyName: varchar("company_name", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  website: text("website"),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 100 }),
  score: integer("score"),
  notes: text("notes"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  tags: json("tags").$type<string[]>(),
  customFields: json("custom_fields"),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  role: varchar("role", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tabella delle fasi della pipeline
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  position: integer("position").notNull(),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tabella deal
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  value: integer("value"),
  currency: varchar("currency", { length: 10 }).default("EUR"),
  pipelineStageId: integer("pipeline_stage_id").references(() => pipelineStages.id, { onDelete: "set null" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  probability: integer("probability"),
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  status: entityStatusEnum("status").notNull().default("active"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Relazioni tra le tabelle
export const usersRelations = relations(users, ({ many }) => ({
  assignedDeals: many(deals),
  assignedLeads: many(leads),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  areasOfActivity: many(areasOfActivity),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  areasOfActivity: many(areasOfActivity),
  deals: many(deals),
}));

export const areasOfActivityRelations = relations(areasOfActivity, ({ one }) => ({
  contact: one(contacts, {
    fields: [areasOfActivity.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [areasOfActivity.companyId],
    references: [companies.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  assignedTo: one(users, {
    fields: [leads.assignedToId],
    references: [users.id],
  }),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ many }) => ({
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  pipelineStage: one(pipelineStages, {
    fields: [deals.pipelineStageId],
    references: [pipelineStages.id],
  }),
  company: one(companies, {
    fields: [deals.companyId],
    references: [companies.id],
  }),
  assignedTo: one(users, {
    fields: [deals.assignedToId],
    references: [users.id],
  }),
}));

// Definizione degli schemi di inserimento
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAreaOfActivitySchema = createInsertSchema(areasOfActivity).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });

// Tipi per gli schemi di inserimento
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertAreaOfActivity = z.infer<typeof insertAreaOfActivitySchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;

// Tipi per i dati selezionati
export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type AreaOfActivity = typeof areasOfActivity.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Deal = typeof deals.$inferSelect;