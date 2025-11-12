CREATE TABLE "backtest_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backtest_id" uuid NOT NULL,
	"pair" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"strategy" varchar(100) NOT NULL,
	"entry_time" timestamp with time zone NOT NULL,
	"entry_price" numeric(15, 8) NOT NULL,
	"confidence" integer NOT NULL,
	"position_size" numeric(15, 2) NOT NULL,
	"exit_time" timestamp with time zone,
	"exit_price" numeric(15, 8),
	"exit_reason" varchar(50),
	"pnl" numeric(15, 2),
	"pnl_percent" numeric(10, 2),
	"is_win" boolean,
	"indicators" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backtests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"pairs" jsonb NOT NULL,
	"strategies" jsonb NOT NULL,
	"timeframe" timeframe NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"initial_balance" numeric(15, 2) DEFAULT '10000.00' NOT NULL,
	"max_position_size" numeric(5, 2) DEFAULT '10.00',
	"stop_loss_percent" numeric(5, 2) DEFAULT '2.00',
	"take_profit_percent" numeric(5, 2) DEFAULT '4.00',
	"min_confidence" integer DEFAULT 70 NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"total_trades" integer DEFAULT 0,
	"winning_trades" integer DEFAULT 0,
	"losing_trades" integer DEFAULT 0,
	"final_balance" numeric(15, 2),
	"total_return" numeric(10, 2),
	"sharpe_ratio" numeric(10, 4),
	"max_drawdown" numeric(10, 2),
	"win_rate" numeric(5, 2),
	"avg_win" numeric(15, 2),
	"avg_loss" numeric(15, 2),
	"profit_factor" numeric(10, 4),
	"error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_trades" integer DEFAULT 0 NOT NULL,
	"winning_trades" integer DEFAULT 0 NOT NULL,
	"losing_trades" integer DEFAULT 0 NOT NULL,
	"win_rate" numeric(5, 2),
	"total_pnl" numeric(15, 2) DEFAULT '0',
	"avg_win" numeric(15, 2),
	"avg_loss" numeric(15, 2),
	"largest_win" numeric(15, 2),
	"largest_loss" numeric(15, 2),
	"profit_factor" numeric(10, 4),
	"sharpe_ratio" numeric(10, 4),
	"max_drawdown" numeric(10, 2),
	"avg_risk_per_trade" numeric(5, 2),
	"strategy_performance" jsonb,
	"pair_performance" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_journal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"signal_id" uuid,
	"title" varchar(255),
	"notes" jsonb,
	"actual_entry" numeric(15, 8),
	"actual_exit" numeric(15, 8),
	"actual_pnl" numeric(15, 2),
	"actual_pnl_percent" numeric(10, 2),
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_backtest_id_backtests_id_fk" FOREIGN KEY ("backtest_id") REFERENCES "public"."backtests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_journal" ADD CONSTRAINT "trade_journal_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backtest_trades_backtest_id_idx" ON "backtest_trades" USING btree ("backtest_id");--> statement-breakpoint
CREATE INDEX "backtest_trades_pair_idx" ON "backtest_trades" USING btree ("pair");--> statement-breakpoint
CREATE INDEX "backtest_trades_entry_time_idx" ON "backtest_trades" USING btree ("entry_time");--> statement-breakpoint
CREATE INDEX "backtests_user_id_idx" ON "backtests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "backtests_status_idx" ON "backtests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "backtests_created_at_idx" ON "backtests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "performance_snapshots_user_id_idx" ON "performance_snapshots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "performance_snapshots_period_type_idx" ON "performance_snapshots" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "performance_snapshots_period_start_idx" ON "performance_snapshots" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "trade_journal_user_id_idx" ON "trade_journal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trade_journal_signal_id_idx" ON "trade_journal" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "trade_journal_created_at_idx" ON "trade_journal" USING btree ("created_at");