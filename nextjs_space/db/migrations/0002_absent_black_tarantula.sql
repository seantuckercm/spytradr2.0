CREATE TYPE "public"."agent_job_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."log_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
CREATE TABLE "scheduled_agent_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "agent_job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"run_context" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_agent_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"job_id" uuid,
	"level" "log_level" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"interval_minutes" integer NOT NULL,
	"pairs" text[] NOT NULL,
	"strategies" jsonb NOT NULL,
	"min_confidence" integer DEFAULT 60,
	"concurrency" integer DEFAULT 1 NOT NULL,
	"max_runtime_seconds" integer DEFAULT 60 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_agent_jobs" ADD CONSTRAINT "scheduled_agent_jobs_agent_id_scheduled_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."scheduled_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_agent_logs" ADD CONSTRAINT "scheduled_agent_logs_agent_id_scheduled_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."scheduled_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_agent_logs" ADD CONSTRAINT "scheduled_agent_logs_job_id_scheduled_agent_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scheduled_agent_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_agent_jobs_agent_idx" ON "scheduled_agent_jobs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "scheduled_agent_jobs_status_sched_idx" ON "scheduled_agent_jobs" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "scheduled_agent_logs_agent_idx" ON "scheduled_agent_logs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "scheduled_agent_logs_job_idx" ON "scheduled_agent_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "scheduled_agents_user_idx" ON "scheduled_agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_agents_active_nextrun_idx" ON "scheduled_agents" USING btree ("is_active","next_run_at");