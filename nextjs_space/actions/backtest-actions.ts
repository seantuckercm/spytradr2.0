
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { backtestsTable, backtestTradesTable, SelectBacktest } from '@/db/schema/backtests-schema';
import { requireAuth } from '@/lib/auth/clerk';
import { eq, and, desc } from 'drizzle-orm';
import { BacktestEngine } from '@/lib/backtesting/engine';
import { fetchKrakenOHLCByTimeframe } from '@/lib/api/kraken';
import { OHLCVCandle } from '@/lib/indicators/types';

interface CreateBacktestInput {
  name: string;
  description?: string;
  pairs: string[];
  strategies: string[];
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  minConfidence: number;
}

export async function createBacktest(input: CreateBacktestInput) {
  try {
    const userId = await requireAuth();

    // Create backtest record
    const [backtest] = await db
      .insert(backtestsTable)
      .values({
        userId,
        name: input.name,
        description: input.description,
        pairs: input.pairs,
        strategies: input.strategies,
        timeframe: input.timeframe as any,
        startDate: input.startDate,
        endDate: input.endDate,
        initialBalance: input.initialBalance.toString(),
        maxPositionSize: input.maxPositionSize.toString(),
        stopLossPercent: input.stopLossPercent.toString(),
        takeProfitPercent: input.takeProfitPercent.toString(),
        minConfidence: input.minConfidence,
        status: 'pending',
      })
      .returning();

    revalidatePath('/backtesting');
    return { success: true, data: backtest };
  } catch (error) {
    console.error('Failed to create backtest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backtest',
    };
  }
}

export async function runBacktest(backtestId: string) {
  try {
    const userId = await requireAuth();

    // Get backtest
    const [backtest] = await db
      .select()
      .from(backtestsTable)
      .where(and(eq(backtestsTable.id, backtestId), eq(backtestsTable.userId, userId)))
      .limit(1);

    if (!backtest) {
      return { success: false, error: 'Backtest not found' };
    }

    // Update status to running
    await db
      .update(backtestsTable)
      .set({ status: 'running', updatedAt: new Date() })
      .where(eq(backtestsTable.id, backtestId));

    // Fetch OHLCV data for all pairs
    const ohlcvData = new Map<string, OHLCVCandle[]>();
    const startTimestamp = Math.floor(backtest.startDate.getTime() / 1000);

    for (const pair of backtest.pairs as string[]) {
      try {
        const result = await fetchKrakenOHLCByTimeframe(pair, backtest.timeframe as string, startTimestamp);
        if (result.success && result.data && result.data.length > 0) {
          ohlcvData.set(pair, result.data);
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${pair}:`, error);
      }
    }

    if (ohlcvData.size === 0) {
      await db
        .update(backtestsTable)
        .set({
          status: 'failed',
          error: 'No market data available for selected pairs',
          updatedAt: new Date(),
        })
        .where(eq(backtestsTable.id, backtestId));

      return { success: false, error: 'No market data available' };
    }

    // Run backtest engine
    const engine = new BacktestEngine({
      pairs: backtest.pairs as string[],
      strategies: backtest.strategies as string[],
      timeframe: backtest.timeframe as string,
      startDate: backtest.startDate,
      endDate: backtest.endDate,
      initialBalance: parseFloat(backtest.initialBalance),
      maxPositionSize: parseFloat(backtest.maxPositionSize || '10'),
      stopLossPercent: parseFloat(backtest.stopLossPercent || '2'),
      takeProfitPercent: parseFloat(backtest.takeProfitPercent || '4'),
      minConfidence: backtest.minConfidence,
    });

    const results = await engine.run(ohlcvData);

    // Save results
    await db
      .update(backtestsTable)
      .set({
        status: 'completed',
        totalTrades: results.totalTrades,
        winningTrades: results.winningTrades,
        losingTrades: results.losingTrades,
        finalBalance: results.finalBalance.toString(),
        totalReturn: results.totalReturn.toString(),
        sharpeRatio: results.sharpeRatio.toString(),
        maxDrawdown: results.maxDrawdown.toString(),
        winRate: results.winRate.toString(),
        avgWin: results.avgWin.toString(),
        avgLoss: results.avgLoss.toString(),
        profitFactor: results.profitFactor.toString(),
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(backtestsTable.id, backtestId));

    // Save trades
    if (results.trades.length > 0) {
      const tradesWithBacktestId = results.trades.map((trade) => ({
        ...trade,
        backtestId,
      }));
      await db.insert(backtestTradesTable).values(tradesWithBacktestId);
    }

    revalidatePath('/backtesting');
    revalidatePath(`/backtesting/${backtestId}`);
    return { success: true, data: results };
  } catch (error) {
    console.error('Failed to run backtest:', error);

    // Update status to failed
    try {
      await db
        .update(backtestsTable)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(backtestsTable.id, backtestId));
    } catch (updateError) {
      console.error('Failed to update backtest status:', updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run backtest',
    };
  }
}

export async function getUserBacktests() {
  try {
    const userId = await requireAuth();

    const backtests = await db
      .select()
      .from(backtestsTable)
      .where(eq(backtestsTable.userId, userId))
      .orderBy(desc(backtestsTable.createdAt));

    return { success: true, data: backtests };
  } catch (error) {
    console.error('Failed to fetch backtests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtests',
      data: [],
    };
  }
}

export async function getBacktest(backtestId: string) {
  try {
    const userId = await requireAuth();

    const [backtest] = await db
      .select()
      .from(backtestsTable)
      .where(and(eq(backtestsTable.id, backtestId), eq(backtestsTable.userId, userId)))
      .limit(1);

    if (!backtest) {
      return { success: false, error: 'Backtest not found', data: null };
    }

    // Get trades
    const trades = await db
      .select()
      .from(backtestTradesTable)
      .where(eq(backtestTradesTable.backtestId, backtestId))
      .orderBy(backtestTradesTable.entryTime);

    return {
      success: true,
      data: {
        ...backtest,
        trades,
      },
    };
  } catch (error) {
    console.error('Failed to fetch backtest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtest',
      data: null,
    };
  }
}

export async function deleteBacktest(backtestId: string) {
  try {
    const userId = await requireAuth();

    await db
      .delete(backtestsTable)
      .where(and(eq(backtestsTable.id, backtestId), eq(backtestsTable.userId, userId)));

    revalidatePath('/backtesting');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete backtest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete backtest',
    };
  }
}
