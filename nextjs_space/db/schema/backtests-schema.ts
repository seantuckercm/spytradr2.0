
import { pgTable, uuid, varchar, timestamp, integer, numeric, jsonb, boolean, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { profilesTable } from './profiles-schema';
import { timeframeEnum } from './enums';

// Backtests table - stores backtest configurations and results
export const backtestsTable = pgTable('backtests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Configuration
  pairs: jsonb('pairs').notNull().$type<string[]>(), // Array of trading pairs
  strategies: jsonb('strategies').notNull().$type<string[]>(), // Array of strategy names
  timeframe: timeframeEnum('timeframe').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  initialBalance: numeric('initial_balance', { precision: 15, scale: 2 }).notNull().default('10000.00'),
  
  // Risk management
  maxPositionSize: numeric('max_position_size', { precision: 5, scale: 2 }).default('10.00'), // % of portfolio
  stopLossPercent: numeric('stop_loss_percent', { precision: 5, scale: 2 }).default('2.00'),
  takeProfitPercent: numeric('take_profit_percent', { precision: 5, scale: 2 }).default('4.00'),
  minConfidence: integer('min_confidence').notNull().default(70),
  
  // Results
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, running, completed, failed
  totalTrades: integer('total_trades').default(0),
  winningTrades: integer('winning_trades').default(0),
  losingTrades: integer('losing_trades').default(0),
  finalBalance: numeric('final_balance', { precision: 15, scale: 2 }),
  totalReturn: numeric('total_return', { precision: 10, scale: 2 }), // %
  sharpeRatio: numeric('sharpe_ratio', { precision: 10, scale: 4 }),
  maxDrawdown: numeric('max_drawdown', { precision: 10, scale: 2 }), // %
  winRate: numeric('win_rate', { precision: 5, scale: 2 }), // %
  avgWin: numeric('avg_win', { precision: 15, scale: 2 }),
  avgLoss: numeric('avg_loss', { precision: 15, scale: 2 }),
  profitFactor: numeric('profit_factor', { precision: 10, scale: 4 }),
  
  // Metadata
  error: text('error'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('backtests_user_id_idx').on(table.userId),
  statusIdx: index('backtests_status_idx').on(table.status),
  createdAtIdx: index('backtests_created_at_idx').on(table.createdAt),
}));

// Backtest trades table - stores individual trades from backtests
export const backtestTradesTable = pgTable('backtest_trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  backtestId: uuid('backtest_id').notNull().references(() => backtestsTable.id, { onDelete: 'cascade' }),
  
  // Trade details
  pair: varchar('pair', { length: 50 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // buy, sell
  strategy: varchar('strategy', { length: 100 }).notNull(),
  
  // Entry
  entryTime: timestamp('entry_time', { withTimezone: true }).notNull(),
  entryPrice: numeric('entry_price', { precision: 15, scale: 8 }).notNull(),
  confidence: integer('confidence').notNull(),
  positionSize: numeric('position_size', { precision: 15, scale: 2 }).notNull(),
  
  // Exit
  exitTime: timestamp('exit_time', { withTimezone: true }),
  exitPrice: numeric('exit_price', { precision: 15, scale: 8 }),
  exitReason: varchar('exit_reason', { length: 50 }), // take_profit, stop_loss, signal_reversal, time_limit
  
  // Results
  pnl: numeric('pnl', { precision: 15, scale: 2 }),
  pnlPercent: numeric('pnl_percent', { precision: 10, scale: 2 }),
  isWin: boolean('is_win'),
  
  // Indicators snapshot
  indicators: jsonb('indicators'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  backtestIdIdx: index('backtest_trades_backtest_id_idx').on(table.backtestId),
  pairIdx: index('backtest_trades_pair_idx').on(table.pair),
  entryTimeIdx: index('backtest_trades_entry_time_idx').on(table.entryTime),
}));

// Relations
export const backtestsRelations = relations(backtestsTable, ({ many }) => ({
  trades: many(backtestTradesTable),
}));

export const backtestTradesRelations = relations(backtestTradesTable, ({ one }) => ({
  backtest: one(backtestsTable, {
    fields: [backtestTradesTable.backtestId],
    references: [backtestsTable.id],
  }),
}));

// Types
export type InsertBacktest = typeof backtestsTable.$inferInsert;
export type SelectBacktest = typeof backtestsTable.$inferSelect;
export type InsertBacktestTrade = typeof backtestTradesTable.$inferInsert;
export type SelectBacktestTrade = typeof backtestTradesTable.$inferSelect;
