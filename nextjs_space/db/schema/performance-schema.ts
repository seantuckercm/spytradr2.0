
import { pgTable, uuid, varchar, timestamp, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { profilesTable } from './profiles-schema';
import { signalsTable } from './signals-schema';

// Performance snapshots - stores periodic performance metrics
export const performanceSnapshotsTable = pgTable('performance_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  
  // Time period
  periodType: varchar('period_type', { length: 20 }).notNull(), // daily, weekly, monthly, all_time
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  
  // Trade metrics
  totalTrades: integer('total_trades').notNull().default(0),
  winningTrades: integer('winning_trades').notNull().default(0),
  losingTrades: integer('losing_trades').notNull().default(0),
  winRate: numeric('win_rate', { precision: 5, scale: 2 }), // %
  
  // Financial metrics
  totalPnl: numeric('total_pnl', { precision: 15, scale: 2 }).default('0'),
  avgWin: numeric('avg_win', { precision: 15, scale: 2 }),
  avgLoss: numeric('avg_loss', { precision: 15, scale: 2 }),
  largestWin: numeric('largest_win', { precision: 15, scale: 2 }),
  largestLoss: numeric('largest_loss', { precision: 15, scale: 2 }),
  profitFactor: numeric('profit_factor', { precision: 10, scale: 4 }),
  
  // Risk metrics
  sharpeRatio: numeric('sharpe_ratio', { precision: 10, scale: 4 }),
  maxDrawdown: numeric('max_drawdown', { precision: 10, scale: 2 }), // %
  avgRiskPerTrade: numeric('avg_risk_per_trade', { precision: 5, scale: 2 }), // %
  
  // Strategy breakdown
  strategyPerformance: jsonb('strategy_performance').$type<Record<string, {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
  }>>(),
  
  // Pair breakdown
  pairPerformance: jsonb('pair_performance').$type<Record<string, {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
  }>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('performance_snapshots_user_id_idx').on(table.userId),
  periodTypeIdx: index('performance_snapshots_period_type_idx').on(table.periodType),
  periodStartIdx: index('performance_snapshots_period_start_idx').on(table.periodStart),
}));

// Trade journal - stores user notes and reflections on signals/trades
export const tradeJournalTable = pgTable('trade_journal', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  signalId: uuid('signal_id').references(() => signalsTable.id, { onDelete: 'cascade' }),
  
  // Journal entry
  title: varchar('title', { length: 255 }),
  notes: jsonb('notes').$type<{
    preTradeAnalysis?: string;
    entryReason?: string;
    emotionalState?: string;
    exitReason?: string;
    lessonsLearned?: string;
    tags?: string[];
  }>(),
  
  // Trade outcome (if executed)
  actualEntry: numeric('actual_entry', { precision: 15, scale: 8 }),
  actualExit: numeric('actual_exit', { precision: 15, scale: 8 }),
  actualPnl: numeric('actual_pnl', { precision: 15, scale: 2 }),
  actualPnlPercent: numeric('actual_pnl_percent', { precision: 10, scale: 2 }),
  
  // Metadata
  rating: integer('rating'), // 1-5 stars for trade quality
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('trade_journal_user_id_idx').on(table.userId),
  signalIdIdx: index('trade_journal_signal_id_idx').on(table.signalId),
  createdAtIdx: index('trade_journal_created_at_idx').on(table.createdAt),
}));

// Relations
export const performanceSnapshotsRelations = relations(performanceSnapshotsTable, ({ one }) => ({
  user: one(profilesTable, {
    fields: [performanceSnapshotsTable.userId],
    references: [profilesTable.userId],
  }),
}));

export const tradeJournalRelations = relations(tradeJournalTable, ({ one }) => ({
  user: one(profilesTable, {
    fields: [tradeJournalTable.userId],
    references: [profilesTable.userId],
  }),
  signal: one(signalsTable, {
    fields: [tradeJournalTable.signalId],
    references: [signalsTable.id],
  }),
}));

// Types
export type InsertPerformanceSnapshot = typeof performanceSnapshotsTable.$inferInsert;
export type SelectPerformanceSnapshot = typeof performanceSnapshotsTable.$inferSelect;
export type InsertTradeJournal = typeof tradeJournalTable.$inferInsert;
export type SelectTradeJournal = typeof tradeJournalTable.$inferSelect;
