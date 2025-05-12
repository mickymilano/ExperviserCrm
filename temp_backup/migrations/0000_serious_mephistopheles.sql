CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'pending');--> statement-breakpoint
CREATE TABLE "account_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"signature_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"user_id" integer,
	"contact_id" integer,
	"company_id" integer,
	"deal_id" integer,
	"email_id" integer,
	"task_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "areas_of_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"company_id" integer,
	"company_name" text,
	"job_description" text,
	"role" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"website" text,
	"email" text,
	"phone" text,
	"address" text,
	"tags" text[],
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"mobile_phone" text,
	"company_email" text,
	"private_email" text,
	"office_phone" text,
	"private_phone" text,
	"linkedin" text,
	"facebook" text,
	"instagram" text,
	"tiktok" text,
	"tags" text[],
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" integer NOT NULL,
	"stage_id" integer NOT NULL,
	"contact_id" integer,
	"company_id" integer,
	"expected_close_date" timestamp,
	"notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"imap_host" text NOT NULL,
	"imap_port" integer NOT NULL,
	"imap_secure" boolean DEFAULT true,
	"smtp_host" text NOT NULL,
	"smtp_port" integer NOT NULL,
	"smtp_secure" boolean DEFAULT true,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"user_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"status" text DEFAULT 'unknown',
	"last_sync_time" timestamp,
	"last_error" text,
	CONSTRAINT "email_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"from" text NOT NULL,
	"to" text[],
	"cc" text[],
	"bcc" text[],
	"date" timestamp NOT NULL,
	"read" boolean DEFAULT false,
	"account_id" integer NOT NULL,
	"contact_id" integer,
	"company_id" integer,
	"deal_id" integer,
	"message_id" text,
	CONSTRAINT "emails_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text,
	"middle_name" text,
	"last_name" text,
	"company_name" text,
	"role" text,
	"mobile_phone" text,
	"company_email" text,
	"private_email" text,
	"office_phone" text,
	"private_phone" text,
	"linkedin" text,
	"facebook" text,
	"instagram" text,
	"tiktok" text,
	"website" text,
	"source" text,
	"status" text DEFAULT 'new',
	"tags" text[],
	"notes" text,
	"assigned_to_id" integer,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text,
	"meeting_type" text NOT NULL,
	"attendees" jsonb,
	"contact_id" integer,
	"company_id" integer,
	"deal_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date_time" timestamp,
	"end_date_time" timestamp,
	"due_date" timestamp,
	"task_value" integer DEFAULT 0,
	"completed" boolean DEFAULT false,
	"assigned_to_id" integer,
	"contact_id" integer,
	"company_id" integer,
	"deal_id" integer,
	"lead_id" integer,
	"is_calendar_event" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"user_agent" text,
	"ip" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"backup_email" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp,
	"login_attempts" integer DEFAULT 0,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account_signatures" ADD CONSTRAINT "account_signatures_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_signatures" ADD CONSTRAINT "account_signatures_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas_of_activity" ADD CONSTRAINT "areas_of_activity_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas_of_activity" ADD CONSTRAINT "areas_of_activity_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;