
// db/schema/trading-pairs-schema.ts
import { pgTable, uuid, text, timestamp, boolean, numeric, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { exchangeEnum, pairStatusEnum } from "./enums";

export const tradingPairsTable = pgTable("trading_pairs", {
  id: uuid("id").primaryKey().defaultRandom(),
  exchange: exchangeEnum("exchange").notNull().default("kraken"),
  
  // Kraken pair identifiers
  krakenPair: text("kraken_pair").notNull(), // e.g., "XXBTZUSD"
  altname: text("altname").notNull(),        // e.g., "XBTUSD"
  wsname: text("wsname"),                     // WebSocket name
  
  // Pair components
  base: text("base").notNull(),               // e.g., "XBT"
  quote: text("quote").notNull(),             // e.g., "USD"
  baseDisplay: text("base_display"),          // e.g., "BTC"
  quoteDisplay: text("quote_display"),        // e.g., "USD"
  
  // Trading info
  status: pairStatusEnum("status").notNull().default("active"),
  lot: numeric("lot", { precision: 18, scale: 8 }),
  pairDecimals: integer("pair_decimals"),
  lotDecimals: integer("lot_decimals"),
  lotMultiplier: integer("lot_multiplier"),
  
  // Metadata
  ordermin: numeric("ordermin", { precision: 18, scale: 8 }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  
  // Tracking
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  exchangePairUq: uniqueIndex("trading_pairs_exchange_pair_uq").on(table.exchange, table.krakenPair),
  altnameIdx: index("trading_pairs_altname_idx").on(table.altname),
  statusIdx: index("trading_pairs_status_idx").on(table.status),
  baseQuoteIdx: index("trading_pairs_base_quote_idx").on(table.base, table.quote),
}));

export type InsertTradingPair = typeof tradingPairsTable.$inferInsert;
export type SelectTradingPair = typeof tradingPairsTable.$inferSelect;
