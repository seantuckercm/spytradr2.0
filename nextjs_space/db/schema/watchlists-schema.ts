
// db/schema/watchlists-schema.ts
import { pgTable, uuid, text, boolean, timestamp, smallint, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timeframeEnum } from "./enums";

export const watchlistsTable = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(), // Clerk userId
  name: text("name").notNull(),
  description: text("description"),
  defaultConfidenceThreshold: smallint("default_confidence_threshold").notNull().default(60),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ({
  ownerIdx: index("watchlists_owner_idx").on(table.ownerId),
  ownerNameUq: uniqueIndex("watchlists_owner_name_uq").on(table.ownerId, table.name),
  activeIdx: index("watchlists_active_idx").on(table.isActive),
}));

export const watchlistItemsTable = pgTable("watchlist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  watchlistId: uuid("watchlist_id").notNull()
    .references(() => watchlistsTable.id, { onDelete: "cascade" }),
  
  // Kraken pair identifiers
  krakenPair: text("kraken_pair").notNull(),
  altname: text("altname").notNull(),
  
  enabled: boolean("enabled").notNull().default(true),
  timeframes: timeframeEnum("timeframes").array().notNull(),
  strategies: text("strategies").array().notNull(), // strategy slugs
  confidenceThreshold: smallint("confidence_threshold"), // nullable: falls back to watchlist default
  
  lastSeenSignalAt: timestamp("last_seen_signal_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ({
  watchlistIdx: index("watchlist_items_watchlist_idx").on(table.watchlistId),
  watchlistPairUq: uniqueIndex("watchlist_items_watchlist_pair_uq").on(table.watchlistId, table.krakenPair),
  enabledIdx: index("watchlist_items_enabled_idx").on(table.enabled),
}));

// Exchange pairs cache (24h cache for Kraken API validation)
export const exchangePairsCacheTable = pgTable("exchange_pairs_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  exchange: text("exchange").notNull().default("kraken"),
  krakenPair: text("kraken_pair").notNull(),
  altname: text("altname").notNull(),
  base: text("base").notNull(),
  quote: text("quote").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  validatedAt: timestamp("validated_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => ({
  exchangePairUq: uniqueIndex("exchange_pairs_cache_exchange_pair_uq").on(table.exchange, table.krakenPair),
}));

// Relations
export const watchlistsRelations = relations(watchlistsTable, ({ many }) => ({
  items: many(watchlistItemsTable),
}));

export const watchlistItemsRelations = relations(watchlistItemsTable, ({ one }) => ({
  watchlist: one(watchlistsTable, {
    fields: [watchlistItemsTable.watchlistId],
    references: [watchlistsTable.id],
  }),
}));

export type InsertWatchlist = typeof watchlistsTable.$inferInsert;
export type SelectWatchlist = typeof watchlistsTable.$inferSelect;
export type InsertWatchlistItem = typeof watchlistItemsTable.$inferInsert;
export type SelectWatchlistItem = typeof watchlistItemsTable.$inferSelect;
