import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role and status enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "super_admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended", "pending"]);

// Users with enhanced security features
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  backupEmail: text("backup_email"),
  role: userRoleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  // User preferences
  timezone: text("timezone").default("Europe/Rome"),
  language: text("language").default("English"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  // Security fields
  lastLoginAt: timestamp("last_login_at"),
  loginAttempts: integer("login_attempts").default(0),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  loginAttempts: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
});

// User sessions for tracking logged in devices
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  userAgent: text("user_agent"),
  ip: text("ip"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

// Security logs for auditing
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, logout, password_reset, failed_login, etc.
  ip: text("ip"),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
});

// Leads
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  role: text("role"),
  
  // Contact information
  mobilePhone: text("mobile_phone"),
  companyEmail: text("company_email"),
  privateEmail: text("private_email"),
  officePhone: text("office_phone"),
  privatePhone: text("private_phone"),
  
  // Social profiles
  linkedin: text("linkedin"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  
  // Other fields
  website: text("website"),
  source: text("source"),
  status: text("status").default("new"), // new, qualified, converted, disqualified
  tags: text("tags").array(),
  notes: text("notes"),
  assignedToId: integer("assigned_to_id"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Areas of Activity (for contacts)
export const areasOfActivity = pgTable("areas_of_activity", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: 'set null' }),
  companyName: text("company_name"), // In case company is not in database yet
  jobDescription: text("job_description"),
  role: text("role"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Remove relations function to fix compatibility issues

export const insertAreaOfActivitySchema = createInsertSchema(areasOfActivity).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Contact status enum
export const contactStatusEnum = pgEnum("contact_status", ["active", "archived"]);

// Contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  
  // Contact information
  mobilePhone: text("mobile_phone"),
  companyEmail: text("company_email"),
  privateEmail: text("private_email"),
  officePhone: text("office_phone"),
  privatePhone: text("private_phone"),
  
  // Social profiles
  linkedin: text("linkedin"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  
  // Other fields
  tags: text("tags").array(),
  notes: text("notes"),
  customFields: jsonb("custom_fields"),
  
  // Nuovi campi come da specifiche
  status: contactStatusEnum("status").default("active").notNull(),
  roles: text("roles").array(),
  lastContactedAt: timestamp("last_contacted_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations removed for compatibility

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Company status enum
export const companyStatusEnum = pgEnum("company_status", ["active", "archived"]);

// Company type enum
export const companyTypeEnum = pgEnum("company_type", [
  "independent", 
  "basket_company_franchisor", 
  "mono_brand_franchisor", 
  "multi_unit_franchisee", 
  "master_franchisee", 
  "mall_manager", 
  "manufacturer", 
  "wholesaler", 
  "other"
]);

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  tags: text("tags").array(),
  notes: text("notes"),
  customFields: jsonb("custom_fields"),
  // Nuovi campi come da specifiche
  status: companyStatusEnum("status").default("active").notNull(),
  isActiveRep: boolean("is_active_rep").default(false).notNull(),
  companyType: companyTypeEnum("company_type").default("other"),
  brands: text("brands").array(),
  channels: text("channels").array(),
  productsOrServicesTags: text("products_or_services_tags").array(),
  locationTypes: text("location_types").array(),
  lastContactedAt: timestamp("last_contacted_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations removed for compatibility

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Deal pipeline stages
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
  id: true,
});

// Deals
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  stageId: integer("stage_id").notNull().references(() => pipelineStages.id),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: 'set null' }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: 'set null' }),
  expectedCloseDate: timestamp("expected_close_date"),
  notes: text("notes"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations removed for compatibility

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDateTime: timestamp("start_date_time"),
  endDateTime: timestamp("end_date_time"),
  dueDate: timestamp("due_date"),
  taskValue: integer("task_value").default(0),
  completed: boolean("completed").default(false),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: 'set null' }),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: 'set null' }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: 'set null' }),
  dealId: integer("deal_id").references(() => deals.id, { onDelete: 'set null' }),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: 'set null' }),
  isCalendarEvent: boolean("is_calendar_event").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email accounts
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  imapSecure: boolean("imap_secure").default(true),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpSecure: boolean("smtp_secure").default(true),
  username: text("username").notNull(),
  password: text("password").notNull(),
  userId: integer("user_id").notNull(),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  status: text("status").default("unknown"), // "ok", "error", "unknown"
  lastSyncTime: timestamp("last_sync_time"),
  lastError: text("last_error"),
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
});

// Emails
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull().array(),
  cc: text("cc").array(),
  bcc: text("bcc").array(),
  date: timestamp("date").notNull(),
  read: boolean("read").default(false),
  accountId: integer("account_id").notNull(),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  dealId: integer("deal_id"),
  messageId: text("message_id").unique(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
});

// Activities (for activity timeline)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, meeting, task, deal, etc.
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  userId: integer("user_id"),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  dealId: integer("deal_id"),
  emailId: integer("email_id"),
  taskId: integer("task_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Meetings
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  meetingType: text("meeting_type").notNull(), // call, in-person, virtual
  attendees: jsonb("attendees"),
  contactId: integer("contact_id"),
  companyId: integer("company_id"),
  dealId: integer("deal_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email signatures
export const signatures = pgTable("signatures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  isDefault: boolean("is_default").default(false),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSignatureSchema = createInsertSchema(signatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email account signature relations (many-to-many)
export const accountSignatures = pgTable("account_signatures", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => emailAccounts.id),
  signatureId: integer("signature_id").notNull().references(() => signatures.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSignatureSchema = createInsertSchema(accountSignatures).omit({
  id: true,
  createdAt: true,
});

// Define Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type AreaOfActivity = typeof areasOfActivity.$inferSelect;
export type InsertAreaOfActivity = z.infer<typeof insertAreaOfActivitySchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = z.infer<typeof insertSignatureSchema>;

export type AccountSignature = typeof accountSignatures.$inferSelect;
export type InsertAccountSignature = z.infer<typeof insertAccountSignatureSchema>;

// Synergies (special relationships between contacts and companies that don't create permanent associations)
export const synergies = pgTable("synergies", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  dealId: integer("deal_id").references(() => deals.id, { onDelete: 'set null' }),
  startDate: timestamp("start_date").defaultNow().notNull(),
  description: text("description"),
  type: text("type").default("business"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSynergySchema = createInsertSchema(synergies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Synergy = typeof synergies.$inferSelect;
export type InsertSynergy = z.infer<typeof insertSynergySchema>;
