
import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { profilesTable } from './profiles-schema';
import { signalsTable } from './signals-schema';
import { relations } from 'drizzle-orm';

// Alert Config Table - User notification preferences
export const alertConfigTable = pgTable('alert_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => profilesTable.userId, { onDelete: 'cascade' }).unique(),
  
  // Email Notifications
  emailEnabled: boolean('email_enabled').notNull().default(true),
  emailAddress: text('email_address'),
  
  // Discord Webhooks
  discordEnabled: boolean('discord_enabled').notNull().default(false),
  discordWebhookUrl: text('discord_webhook_url'),
  
  // Alert Thresholds
  minConfidenceThreshold: integer('min_confidence_threshold').notNull().default(70), // Only alert for signals >= this confidence
  alertOnBuySignals: boolean('alert_on_buy_signals').notNull().default(true),
  alertOnSellSignals: boolean('alert_on_sell_signals').notNull().default(true),
  
  // Alert Frequency Controls
  maxAlertsPerHour: integer('max_alerts_per_hour').notNull().default(10),
  quietHoursEnabled: boolean('quiet_hours_enabled').notNull().default(false),
  quietHoursStart: text('quiet_hours_start'), // HH:MM format (e.g., "22:00")
  quietHoursEnd: text('quiet_hours_end'), // HH:MM format (e.g., "08:00")
  
  // Watchlist-specific settings
  watchlistFilters: jsonb('watchlist_filters').$type<string[]>().default([]), // Array of watchlist IDs to alert on (empty = all)
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('alert_config_user_id_idx').on(table.userId),
}));

// Alert History Table - Logs all sent alerts
export const alertHistoryTable = pgTable('alert_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => profilesTable.userId, { onDelete: 'cascade' }),
  signalId: uuid('signal_id').references(() => signalsTable.id, { onDelete: 'set null' }),
  
  // Alert Details
  alertType: text('alert_type').notNull(), // 'email' | 'discord' | 'browser'
  channel: text('channel').notNull(), // Where it was sent (email address, webhook URL, etc.)
  
  // Signal Context
  krakenPair: text('kraken_pair').notNull(),
  direction: text('direction').notNull(), // 'buy' | 'sell'
  confidence: integer('confidence').notNull(),
  entryPrice: text('entry_price'),
  
  // Status
  status: text('status').notNull().default('sent'), // 'sent' | 'failed' | 'queued'
  error: text('error'),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  // Timestamps
  sentAt: timestamp('sent_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('alert_history_user_id_idx').on(table.userId),
  signalIdIdx: index('alert_history_signal_id_idx').on(table.signalId),
  sentAtIdx: index('alert_history_sent_at_idx').on(table.sentAt),
}));

// Relations
export const alertConfigRelations = relations(alertConfigTable, ({ one }) => ({
  profile: one(profilesTable, {
    fields: [alertConfigTable.userId],
    references: [profilesTable.userId],
  }),
}));

export const alertHistoryRelations = relations(alertHistoryTable, ({ one }) => ({
  profile: one(profilesTable, {
    fields: [alertHistoryTable.userId],
    references: [profilesTable.userId],
  }),
  signal: one(signalsTable, {
    fields: [alertHistoryTable.signalId],
    references: [signalsTable.id],
  }),
}));

// Types
export type InsertAlertConfig = typeof alertConfigTable.$inferInsert;
export type SelectAlertConfig = typeof alertConfigTable.$inferSelect;
export type InsertAlertHistory = typeof alertHistoryTable.$inferInsert;
export type SelectAlertHistory = typeof alertHistoryTable.$inferSelect;
