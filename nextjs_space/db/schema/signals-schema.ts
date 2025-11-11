
import { pgTable, uuid, varchar, timestamp, numeric, text, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { directionEnum, riskEnum, signalStatusEnum, timeframeEnum } from './enums';
import { watchlistItemsTable } from './watchlists-schema';

export const signalsTable = pgTable(
  'signals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    watchlistItemId: uuid('watchlist_item_id').notNull().references(() => watchlistItemsTable.id, { onDelete: 'cascade' }),
    
    // Trading pair info
    krakenPair: varchar('kraken_pair', { length: 50 }).notNull(),
    altname: varchar('altname', { length: 50 }).notNull(),
    
    // Signal details
    direction: directionEnum('direction').notNull(), // 'long' or 'short'
    timeframe: timeframeEnum('timeframe').notNull(),
    strategy: varchar('strategy', { length: 100 }).notNull(),
    
    // Price levels
    entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
    stopLoss: numeric('stop_loss', { precision: 20, scale: 8 }),
    takeProfit: numeric('take_profit', { precision: 20, scale: 8 }),
    currentPrice: numeric('current_price', { precision: 20, scale: 8 }),
    
    // Signal quality
    confidence: numeric('confidence', { precision: 5, scale: 2 }).notNull(), // 0-100
    risk: riskEnum('risk').notNull(), // 'low', 'medium', 'high'
    status: signalStatusEnum('status').notNull().default('active'), // 'active', 'closed', 'expired', 'cancelled'
    
    // Technical indicators snapshot
    indicators: jsonb('indicators'), // Store RSI, MACD, etc. at signal generation
    
    // Metadata
    reason: text('reason'), // Human-readable explanation
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'), // Optional signal expiry
    closedAt: timestamp('closed_at'),
  },
  (table) => ({
    watchlistItemIdx: index('signals_watchlist_item_idx').on(table.watchlistItemId),
    statusIdx: index('signals_status_idx').on(table.status),
    createdAtIdx: index('signals_created_at_idx').on(table.createdAt),
    krakenPairIdx: index('signals_kraken_pair_idx').on(table.krakenPair),
    directionIdx: index('signals_direction_idx').on(table.direction),
  })
);

export const signalsRelations = relations(signalsTable, ({ one }) => ({
  watchlistItem: one(watchlistItemsTable, {
    fields: [signalsTable.watchlistItemId],
    references: [watchlistItemsTable.id],
  }),
}));

export type InsertSignal = typeof signalsTable.$inferInsert;
export type SelectSignal = typeof signalsTable.$inferSelect;

// Table to store historical OHLCV data for analysis
export const ohlcvDataTable = pgTable(
  'ohlcv_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    krakenPair: varchar('kraken_pair', { length: 50 }).notNull(),
    timeframe: timeframeEnum('timeframe').notNull(),
    
    // OHLCV values
    timestamp: timestamp('timestamp').notNull(),
    open: numeric('open', { precision: 20, scale: 8 }).notNull(),
    high: numeric('high', { precision: 20, scale: 8 }).notNull(),
    low: numeric('low', { precision: 20, scale: 8 }).notNull(),
    close: numeric('close', { precision: 20, scale: 8 }).notNull(),
    volume: numeric('volume', { precision: 20, scale: 8 }).notNull(),
    
    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    pairTimeframeTimestampIdx: index('ohlcv_pair_timeframe_timestamp_idx').on(
      table.krakenPair,
      table.timeframe,
      table.timestamp
    ),
  })
);

export type InsertOHLCVData = typeof ohlcvDataTable.$inferInsert;
export type SelectOHLCVData = typeof ohlcvDataTable.$inferSelect;
