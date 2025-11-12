
'use server';

import { db } from '@/db';
import { signalsTable, watchlistItemsTable, watchlistsTable } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/clerk';
import { fetchKrakenOHLCByTimeframe } from '@/lib/api/kraken';
import { SignalGenerator, TradingSignal } from '@/lib/analysis/signal-generator';
import { OHLCVCandle } from '@/lib/indicators';
import { revalidatePath } from 'next/cache';
import { sendSignalAlert } from '@/lib/alerts/service';

/**
 * Get all active signals for the current user
 */
export async function getUserSignals() {
  try {
    const userId = await requireAuth();

    const signals = await db
      .select({
        signal: signalsTable,
        watchlistItem: watchlistItemsTable,
        watchlist: watchlistsTable,
      })
      .from(signalsTable)
      .innerJoin(watchlistItemsTable, eq(signalsTable.watchlistItemId, watchlistItemsTable.id))
      .innerJoin(watchlistsTable, eq(watchlistItemsTable.watchlistId, watchlistsTable.id))
      .where(
        and(
          eq(watchlistsTable.ownerId, userId),
          eq(signalsTable.status, 'active')
        )
      )
      .orderBy(desc(signalsTable.createdAt));

    return {
      success: true,
      data: signals,
    };
  } catch (error: any) {
    console.error('Failed to fetch user signals:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch signals',
    };
  }
}

/**
 * Get signals for a specific watchlist
 */
export async function getWatchlistSignals(watchlistId: string) {
  try {
    const userId = await requireAuth();

    // Verify ownership
    const [watchlist] = await db
      .select()
      .from(watchlistsTable)
      .where(and(eq(watchlistsTable.id, watchlistId), eq(watchlistsTable.ownerId, userId)))
      .limit(1);

    if (!watchlist) {
      return {
        success: false,
        error: 'Watchlist not found',
      };
    }

    const signals = await db
      .select({
        signal: signalsTable,
        watchlistItem: watchlistItemsTable,
      })
      .from(signalsTable)
      .innerJoin(watchlistItemsTable, eq(signalsTable.watchlistItemId, watchlistItemsTable.id))
      .where(
        and(
          eq(watchlistItemsTable.watchlistId, watchlistId),
          eq(signalsTable.status, 'active')
        )
      )
      .orderBy(desc(signalsTable.createdAt));

    return {
      success: true,
      data: signals,
    };
  } catch (error: any) {
    console.error('Failed to fetch watchlist signals:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch signals',
    };
  }
}

/**
 * Analyze a single watchlist item and generate signals
 */
export async function analyzeWatchlistItem(watchlistItemId: string) {
  try {
    const userId = await requireAuth();

    // Fetch watchlist item with ownership verification
    const [item] = await db
      .select({
        item: watchlistItemsTable,
        watchlist: watchlistsTable,
      })
      .from(watchlistItemsTable)
      .innerJoin(watchlistsTable, eq(watchlistItemsTable.watchlistId, watchlistsTable.id))
      .where(
        and(
          eq(watchlistItemsTable.id, watchlistItemId),
          eq(watchlistsTable.ownerId, userId)
        )
      )
      .limit(1);

    if (!item) {
      return {
        success: false,
        error: 'Watchlist item not found',
      };
    }

    const { item: watchlistItem, watchlist } = item;

    if (!watchlistItem.enabled) {
      return {
        success: false,
        error: 'Watchlist item is disabled',
      };
    }

    const generatedSignals: any[] = [];

    // Analyze each timeframe
    for (const timeframe of watchlistItem.timeframes) {
      // Fetch OHLC data
      const ohlcResult = await fetchKrakenOHLCByTimeframe(
        watchlistItem.krakenPair,
        timeframe
      );

      if (!ohlcResult.success || !ohlcResult.data) {
        console.warn(`Failed to fetch OHLC for ${watchlistItem.krakenPair} ${timeframe}:`, ohlcResult.error);
        continue;
      }

      const candles: OHLCVCandle[] = ohlcResult.data;

      // Analyze each strategy
      for (const strategy of watchlistItem.strategies) {
        const generator = new SignalGenerator(candles, {
          strategy,
          confidenceThreshold: watchlistItem.confidenceThreshold || watchlist.defaultConfidenceThreshold,
        });

        const signal = generator.generateSignal();

        if (signal) {
          // Check if similar signal already exists (same pair, timeframe, direction, active)
          const [existingSignal] = await db
            .select()
            .from(signalsTable)
            .where(
              and(
                eq(signalsTable.watchlistItemId, watchlistItemId),
                eq(signalsTable.krakenPair, watchlistItem.krakenPair),
                eq(signalsTable.timeframe, timeframe),
                eq(signalsTable.direction, signal.direction),
                eq(signalsTable.status, 'active'),
                gte(signalsTable.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Within last 24h
              )
            )
            .limit(1);

          if (existingSignal) {
            // Update existing signal instead of creating duplicate
            await db
              .update(signalsTable)
              .set({
                confidence: signal.confidence.toString(),
                currentPrice: signal.entryPrice.toString(),
                stopLoss: signal.stopLoss?.toString() || null,
                takeProfit: signal.takeProfit?.toString() || null,
                indicators: signal.indicators,
                reason: signal.reason,
                updatedAt: new Date(),
              })
              .where(eq(signalsTable.id, existingSignal.id));

            generatedSignals.push({ ...existingSignal, updated: true });
          } else {
            // Create new signal
            const [newSignal] = await db
              .insert(signalsTable)
              .values({
                watchlistItemId,
                krakenPair: watchlistItem.krakenPair,
                altname: watchlistItem.altname,
                direction: signal.direction,
                timeframe,
                strategy,
                entryPrice: signal.entryPrice.toString(),
                stopLoss: signal.stopLoss?.toString() || null,
                takeProfit: signal.takeProfit?.toString() || null,
                currentPrice: signal.entryPrice.toString(),
                confidence: signal.confidence.toString(),
                risk: signal.risk,
                status: 'active',
                indicators: signal.indicators,
                reason: signal.reason,
              })
              .returning();

            generatedSignals.push(newSignal);

            // Send alert notification for new signal
            try {
              await sendSignalAlert({
                userId,
                signal: newSignal,
              });
            } catch (alertError) {
              console.error('Failed to send alert for signal:', alertError);
              // Don't fail the entire operation if alert fails
            }
          }
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/watchlists');

    return {
      success: true,
      data: {
        analyzed: true,
        signalsGenerated: generatedSignals.length,
        signals: generatedSignals,
      },
    };
  } catch (error: any) {
    console.error('Failed to analyze watchlist item:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze watchlist item',
    };
  }
}

/**
 * Analyze all items in a watchlist
 */
export async function analyzeWatchlist(watchlistId: string) {
  try {
    const userId = await requireAuth();

    // Verify ownership
    const [watchlist] = await db
      .select()
      .from(watchlistsTable)
      .where(and(eq(watchlistsTable.id, watchlistId), eq(watchlistsTable.ownerId, userId)))
      .limit(1);

    if (!watchlist) {
      return {
        success: false,
        error: 'Watchlist not found',
      };
    }

    // Get all enabled items
    const items = await db
      .select()
      .from(watchlistItemsTable)
      .where(
        and(
          eq(watchlistItemsTable.watchlistId, watchlistId),
          eq(watchlistItemsTable.enabled, true)
        )
      );

    const results = [];

    for (const item of items) {
      const result = await analyzeWatchlistItem(item.id);
      results.push({
        itemId: item.id,
        krakenPair: item.krakenPair,
        result,
      });
    }

    revalidatePath('/dashboard');
    revalidatePath(`/watchlists/${watchlistId}`);

    return {
      success: true,
      data: {
        watchlistId,
        itemsAnalyzed: items.length,
        results,
      },
    };
  } catch (error: any) {
    console.error('Failed to analyze watchlist:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze watchlist',
    };
  }
}

/**
 * Close a signal
 */
export async function closeSignal(signalId: string, reason?: string) {
  try {
    const userId = await requireAuth();

    // Verify ownership
    const [signal] = await db
      .select({
        signal: signalsTable,
        watchlist: watchlistsTable,
      })
      .from(signalsTable)
      .innerJoin(watchlistItemsTable, eq(signalsTable.watchlistItemId, watchlistItemsTable.id))
      .innerJoin(watchlistsTable, eq(watchlistItemsTable.watchlistId, watchlistsTable.id))
      .where(
        and(
          eq(signalsTable.id, signalId),
          eq(watchlistsTable.ownerId, userId)
        )
      )
      .limit(1);

    if (!signal) {
      return {
        success: false,
        error: 'Signal not found',
      };
    }

    await db
      .update(signalsTable)
      .set({
        status: 'closed',
        closedAt: new Date(),
        reason: reason || signal.signal.reason,
        updatedAt: new Date(),
      })
      .where(eq(signalsTable.id, signalId));

    revalidatePath('/dashboard');
    revalidatePath('/watchlists');

    return {
      success: true,
      message: 'Signal closed successfully',
    };
  } catch (error: any) {
    console.error('Failed to close signal:', error);
    return {
      success: false,
      error: error.message || 'Failed to close signal',
    };
  }
}

/**
 * Update signal status
 */
export async function updateSignalStatus(
  signalId: string,
  status: 'active' | 'closed' | 'expired' | 'cancelled'
) {
  try {
    const userId = await requireAuth();

    // Verify ownership
    const [signal] = await db
      .select({
        signal: signalsTable,
        watchlist: watchlistsTable,
      })
      .from(signalsTable)
      .innerJoin(watchlistItemsTable, eq(signalsTable.watchlistItemId, watchlistItemsTable.id))
      .innerJoin(watchlistsTable, eq(watchlistItemsTable.watchlistId, watchlistsTable.id))
      .where(
        and(
          eq(signalsTable.id, signalId),
          eq(watchlistsTable.ownerId, userId)
        )
      )
      .limit(1);

    if (!signal) {
      return {
        success: false,
        error: 'Signal not found',
      };
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status !== 'active') {
      updateData.closedAt = new Date();
    }

    await db
      .update(signalsTable)
      .set(updateData)
      .where(eq(signalsTable.id, signalId));

    revalidatePath('/dashboard');
    revalidatePath('/watchlists');

    return {
      success: true,
      message: `Signal ${status} successfully`,
    };
  } catch (error: any) {
    console.error('Failed to update signal status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update signal status',
    };
  }
}

/**
 * Get a single signal with details and chart data
 */
export async function getSignal(signalId: string) {
  try {
    const userId = await requireAuth();

    const signal = await db.query.signalsTable.findFirst({
      where: eq(signalsTable.id, signalId),
      with: {
        watchlistItem: {
          with: {
            watchlist: true,
          },
        },
      },
    });

    if (!signal) {
      return { success: false, error: 'Signal not found' };
    }

    // For watchlist-based signals, verify ownership
    if (signal.watchlistItem && signal.watchlistItem.watchlist.ownerId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch OHLC data for the chart
    const pair = signal.krakenPair;
    const timeframe = signal.timeframe;
    
    // Get data from when the signal was created (or up to 100 candles)
    const sinceTimestamp = Math.floor(signal.createdAt.getTime() / 1000) - (100 * 60); // ~100 minutes of data
    const ohlcResult = await fetchKrakenOHLCByTimeframe(pair, timeframe, sinceTimestamp);

    return { 
      success: true, 
      data: {
        signal,
        ohlcData: ohlcResult.success ? ohlcResult.data : []
      }
    };
  } catch (error) {
    console.error('Error fetching signal:', error);
    return { success: false, error: 'Failed to fetch signal' };
  }
}
