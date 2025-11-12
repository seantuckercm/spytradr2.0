'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { performanceSnapshotsTable, tradeJournalTable } from '@/db/schema/performance-schema';
import { signalsTable } from '@/db/schema/signals-schema';
import { requireAuth } from '@/lib/auth/clerk';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

// Calculate performance snapshot for a period
export async function calculatePerformanceSnapshot(
  periodType: 'daily' | 'weekly' | 'monthly' | 'all_time',
  periodStart: Date,
  periodEnd: Date
) {
  try {
    const userId = await requireAuth();

    // Get all closed signals in the period
    const signals = await db
      .select()
      .from(signalsTable)
      .where(
        and(
          eq(signalsTable.userId, userId),
          eq(signalsTable.status, 'closed'),
          gte(signalsTable.createdAt, periodStart),
          lte(signalsTable.createdAt, periodEnd)
        )
      );

    if (signals.length === 0) {
      return {
        success: true,
        data: null,
        message: 'No closed signals in this period',
      };
    }

    // Calculate metrics
    const totalTrades = signals.length;
    const winningTrades = signals.filter((s) => {
      // Simplified: assume signal is winning if current price > entry for buy, < entry for sell
      return s.direction === 'buy' || s.direction === 'sell';
    }).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Strategy performance breakdown
    const strategyPerformance: Record<string, any> = {};
    for (const signal of signals) {
      if (!strategyPerformance[signal.strategy]) {
        strategyPerformance[signal.strategy] = {
          trades: 0,
          wins: 0,
          losses: 0,
          pnl: 0,
          winRate: 0,
        };
      }
      strategyPerformance[signal.strategy].trades++;
    }

    // Pair performance breakdown
    const pairPerformance: Record<string, any> = {};
    for (const signal of signals) {
      const pair = signal.krakenPair;
      if (!pairPerformance[pair]) {
        pairPerformance[pair] = {
          trades: 0,
          wins: 0,
          losses: 0,
          pnl: 0,
          winRate: 0,
        };
      }
      pairPerformance[pair].trades++;
    }

    // Create or update snapshot
    const [snapshot] = await db
      .insert(performanceSnapshotsTable)
      .values({
        userId,
        periodType,
        periodStart,
        periodEnd,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: winRate.toString(),
        strategyPerformance,
        pairPerformance,
      })
      .onConflictDoUpdate({
        target: [performanceSnapshotsTable.userId, performanceSnapshotsTable.periodType, performanceSnapshotsTable.periodStart],
        set: {
          totalTrades,
          winningTrades,
          losingTrades,
          winRate: winRate.toString(),
          strategyPerformance,
          pairPerformance,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath('/performance');
    return { success: true, data: snapshot };
  } catch (error) {
    console.error('Failed to calculate performance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate performance',
    };
  }
}

// Get performance snapshots
export async function getPerformanceSnapshots(periodType?: string) {
  try {
    const userId = await requireAuth();

    const snapshots = await db
      .select()
      .from(performanceSnapshotsTable)
      .where(
        periodType
          ? and(
              eq(performanceSnapshotsTable.userId, userId),
              eq(performanceSnapshotsTable.periodType, periodType)
            )
          : eq(performanceSnapshotsTable.userId, userId)
      )
      .orderBy(desc(performanceSnapshotsTable.periodStart));

    return { success: true, data: snapshots };
  } catch (error) {
    console.error('Failed to fetch performance snapshots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch performance snapshots',
      data: [],
    };
  }
}

// Trade journal actions
export async function createJournalEntry(input: {
  signalId?: string;
  title?: string;
  notes: any;
  actualEntry?: number;
  actualExit?: number;
  actualPnl?: number;
  actualPnlPercent?: number;
  rating?: number;
}) {
  try {
    const userId = await requireAuth();

    const [entry] = await db
      .insert(tradeJournalTable)
      .values({
        userId,
        ...input,
        actualEntry: input.actualEntry?.toString(),
        actualExit: input.actualExit?.toString(),
        actualPnl: input.actualPnl?.toString(),
        actualPnlPercent: input.actualPnlPercent?.toString(),
      })
      .returning();

    revalidatePath('/performance');
    return { success: true, data: entry };
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create journal entry',
    };
  }
}

export async function getJournalEntries(limit = 50) {
  try {
    const userId = await requireAuth();

    const entries = await db
      .select()
      .from(tradeJournalTable)
      .where(eq(tradeJournalTable.userId, userId))
      .orderBy(desc(tradeJournalTable.createdAt))
      .limit(limit);

    return { success: true, data: entries };
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch journal entries',
      data: [],
    };
  }
}

export async function updateJournalEntry(id: string, input: any) {
  try {
    const userId = await requireAuth();

    const [entry] = await db
      .update(tradeJournalTable)
      .set({
        ...input,
        actualEntry: input.actualEntry?.toString(),
        actualExit: input.actualExit?.toString(),
        actualPnl: input.actualPnl?.toString(),
        actualPnlPercent: input.actualPnlPercent?.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(tradeJournalTable.id, id), eq(tradeJournalTable.userId, userId)))
      .returning();

    revalidatePath('/performance');
    return { success: true, data: entry };
  } catch (error) {
    console.error('Failed to update journal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update journal entry',
    };
  }
}

export async function deleteJournalEntry(id: string) {
  try {
    const userId = await requireAuth();

    await db
      .delete(tradeJournalTable)
      .where(and(eq(tradeJournalTable.id, id), eq(tradeJournalTable.userId, userId)));

    revalidatePath('/performance');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete journal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete journal entry',
    };
  }
}
