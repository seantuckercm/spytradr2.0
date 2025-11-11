
// lib/validators/watchlist.ts
import { z } from 'zod';

export const timeframeValues = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'] as const;
export type Timeframe = typeof timeframeValues[number];

export const createWatchlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name too long'),
  description: z.string().max(256).optional(),
  defaultConfidenceThreshold: z.number().int().min(0).max(100).optional().default(60),
});

export const updateWatchlistSchema = createWatchlistSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const addWatchlistItemSchema = z.object({
  watchlistId: z.string().uuid(),
  inputSymbol: z.string().min(2).max(20), // user-entered (e.g., "XBTUSD" or "XBT/USD")
  timeframes: z.array(z.enum(timeframeValues)).min(1, 'Select at least one timeframe'),
  strategies: z.array(z.string().min(1)).min(1, 'Select at least one strategy'),
  confidenceThreshold: z.number().int().min(0).max(100).optional(),
});

export const updateWatchlistItemSchema = z.object({
  itemId: z.string().uuid(),
  enabled: z.boolean().optional(),
  timeframes: z.array(z.enum(timeframeValues)).min(1).optional(),
  strategies: z.array(z.string().min(1)).min(1).optional(),
  confidenceThreshold: z.number().int().min(0).max(100).nullable().optional(),
});

export const deleteWatchlistSchema = z.object({
  watchlistId: z.string().uuid(),
});

export const deleteWatchlistItemSchema = z.object({
  itemId: z.string().uuid(),
});
