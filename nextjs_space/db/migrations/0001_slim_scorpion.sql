CREATE TABLE "ohlcv_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kraken_pair" varchar(50) NOT NULL,
	"timeframe" timeframe NOT NULL,
	"timestamp" timestamp NOT NULL,
	"open" numeric(20, 8) NOT NULL,
	"high" numeric(20, 8) NOT NULL,
	"low" numeric(20, 8) NOT NULL,
	"close" numeric(20, 8) NOT NULL,
	"volume" numeric(20, 8) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watchlist_item_id" uuid NOT NULL,
	"kraken_pair" varchar(50) NOT NULL,
	"altname" varchar(50) NOT NULL,
	"direction" "direction_enum" NOT NULL,
	"timeframe" timeframe NOT NULL,
	"strategy" varchar(100) NOT NULL,
	"entry_price" numeric(20, 8) NOT NULL,
	"stop_loss" numeric(20, 8),
	"take_profit" numeric(20, 8),
	"current_price" numeric(20, 8),
	"confidence" numeric(5, 2) NOT NULL,
	"risk" "risk_enum" NOT NULL,
	"status" "signal_status_enum" DEFAULT 'active' NOT NULL,
	"indicators" jsonb,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_watchlist_item_id_watchlist_items_id_fk" FOREIGN KEY ("watchlist_item_id") REFERENCES "public"."watchlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ohlcv_pair_timeframe_timestamp_idx" ON "ohlcv_data" USING btree ("kraken_pair","timeframe","timestamp");--> statement-breakpoint
CREATE INDEX "signals_watchlist_item_idx" ON "signals" USING btree ("watchlist_item_id");--> statement-breakpoint
CREATE INDEX "signals_status_idx" ON "signals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signals_created_at_idx" ON "signals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "signals_kraken_pair_idx" ON "signals" USING btree ("kraken_pair");--> statement-breakpoint
CREATE INDEX "signals_direction_idx" ON "signals" USING btree ("direction");