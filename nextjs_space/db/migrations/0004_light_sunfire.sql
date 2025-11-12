CREATE TABLE "alert_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"email_address" text,
	"discord_enabled" boolean DEFAULT false NOT NULL,
	"discord_webhook_url" text,
	"min_confidence_threshold" integer DEFAULT 70 NOT NULL,
	"alert_on_buy_signals" boolean DEFAULT true NOT NULL,
	"alert_on_sell_signals" boolean DEFAULT true NOT NULL,
	"max_alerts_per_hour" integer DEFAULT 10 NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"watchlist_filters" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_config_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"signal_id" uuid,
	"alert_type" text NOT NULL,
	"channel" text NOT NULL,
	"kraken_pair" text NOT NULL,
	"direction" text NOT NULL,
	"confidence" integer NOT NULL,
	"entry_price" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"error" text,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_config" ADD CONSTRAINT "alert_config_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_config_user_id_idx" ON "alert_config" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_history_user_id_idx" ON "alert_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_history_signal_id_idx" ON "alert_history" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "alert_history_sent_at_idx" ON "alert_history" USING btree ("sent_at");