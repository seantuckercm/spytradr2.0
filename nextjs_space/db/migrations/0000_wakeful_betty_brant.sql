CREATE TYPE "public"."account_status" AS ENUM('active', 'inactive', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."direction_enum" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."exchange" AS ENUM('kraken');--> statement-breakpoint
CREATE TYPE "public"."membership" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."pair_status" AS ENUM('active', 'inactive', 'delisted');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'whop');--> statement-breakpoint
CREATE TYPE "public"."risk_enum" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."signal_status_enum" AS ENUM('active', 'closed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."timeframe" AS ENUM('1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M');--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"membership" "membership" DEFAULT 'free' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'whop',
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"whop_user_id" text,
	"whop_membership_id" text,
	"plan_duration" text,
	"billing_cycle_start" timestamp with time zone,
	"billing_cycle_end" timestamp with time zone,
	"next_credit_renewal" timestamp with time zone,
	"usage_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"custom_limits" jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"last_api_call" timestamp with time zone,
	"api_calls_this_minute" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pending_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text,
	"membership" "membership" DEFAULT 'pro' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'whop',
	"whop_user_id" text,
	"whop_membership_id" text,
	"plan_duration" text,
	"billing_cycle_start" timestamp with time zone,
	"billing_cycle_end" timestamp with time zone,
	"usage_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"claimed" boolean DEFAULT false,
	"claimed_by_user_id" text,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" "exchange" DEFAULT 'kraken' NOT NULL,
	"kraken_pair" text NOT NULL,
	"altname" text NOT NULL,
	"wsname" text,
	"base" text NOT NULL,
	"quote" text NOT NULL,
	"base_display" text,
	"quote_display" text,
	"status" "pair_status" DEFAULT 'active' NOT NULL,
	"lot" numeric(18, 8),
	"pair_decimals" integer,
	"lot_decimals" integer,
	"lot_multiplier" integer,
	"ordermin" numeric(18, 8),
	"metadata" jsonb,
	"last_updated" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_pairs_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" text DEFAULT 'kraken' NOT NULL,
	"kraken_pair" text NOT NULL,
	"altname" text NOT NULL,
	"base" text NOT NULL,
	"quote" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"validated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watchlist_id" uuid NOT NULL,
	"kraken_pair" text NOT NULL,
	"altname" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"timeframes" timeframe[] NOT NULL,
	"strategies" text[] NOT NULL,
	"confidence_threshold" smallint,
	"last_seen_signal_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_confidence_threshold" smallint DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "profiles_membership_idx" ON "profiles" USING btree ("membership");--> statement-breakpoint
CREATE INDEX "profiles_status_idx" ON "profiles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_profiles_email_uq" ON "pending_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pending_profiles_claimed_idx" ON "pending_profiles" USING btree ("claimed");--> statement-breakpoint
CREATE UNIQUE INDEX "trading_pairs_exchange_pair_uq" ON "trading_pairs" USING btree ("exchange","kraken_pair");--> statement-breakpoint
CREATE INDEX "trading_pairs_altname_idx" ON "trading_pairs" USING btree ("altname");--> statement-breakpoint
CREATE INDEX "trading_pairs_status_idx" ON "trading_pairs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trading_pairs_base_quote_idx" ON "trading_pairs" USING btree ("base","quote");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_pairs_cache_exchange_pair_uq" ON "exchange_pairs_cache" USING btree ("exchange","kraken_pair");--> statement-breakpoint
CREATE INDEX "watchlist_items_watchlist_idx" ON "watchlist_items" USING btree ("watchlist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_items_watchlist_pair_uq" ON "watchlist_items" USING btree ("watchlist_id","kraken_pair");--> statement-breakpoint
CREATE INDEX "watchlist_items_enabled_idx" ON "watchlist_items" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "watchlists_owner_idx" ON "watchlists" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlists_owner_name_uq" ON "watchlists" USING btree ("owner_id","name");--> statement-breakpoint
CREATE INDEX "watchlists_active_idx" ON "watchlists" USING btree ("is_active");