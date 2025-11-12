
// actions/scanner-actions.ts
'use server';

import { requireAuth } from '@/lib/auth/clerk';
import { fetchKrakenPairs, fetchKrakenOHLCByTimeframe } from '@/lib/api/kraken';
import { SignalGenerator } from '@/lib/analysis/signal-generator';
import type { Timeframe } from '@/lib/validators/watchlist';

export interface ScannerOpportunity {
  pair: string;
  altname: string;
  base: string;
  quote: string;
  direction: 'buy' | 'sell';
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  potentialProfit: number;
  strategy: string;
  reason: string;
  timeframe: Timeframe;
  timestamp: string;
}

export interface ScannerFilters {
  minConfidence?: number;
  direction?: 'buy' | 'sell' | 'all';
  risk?: 'low' | 'medium' | 'high' | 'all';
  strategy?: string;
  timeframe?: Timeframe;
  baseAsset?: string;
  quoteAsset?: string;
  limit?: number;
}

const POPULAR_PAIRS = [
  'XXBTZUSD', 'XETHZUSD', 'XLTCZUSD', 'XXRPZUSD', 'ADAUSD', 
  'SOLUSD', 'DOTUSD', 'MATICUSD', 'ATOMUSD', 'LINKUSD',
  'UNIUSD', 'AVAXUSD', 'DOGEUSD', 'SHIBUSD', 'XXBTZEUR',
  'XETHZEUR', 'XXBTZGBP', 'XETHZGBP'
];

const AVAILABLE_STRATEGIES = [
  'rsi-oversold-overbought',
  'macd-crossover',
  'bollinger-breakout',
  'ema-crossover',
  'trend-following',
  'mean-reversion'
];

/**
 * Scan the market for trading opportunities across all or filtered Kraken pairs
 */
export async function scanMarket(filters: ScannerFilters = {}) {
  try {
    await requireAuth();

    const {
      minConfidence = 60,
      direction = 'all',
      risk = 'all',
      strategy,
      timeframe = '1h' as Timeframe,
      baseAsset,
      quoteAsset,
      limit = 20
    } = filters;

    // Fetch all available Kraken pairs
    const krakenPairsRecord = await fetchKrakenPairs();
    
    // Convert Record to array with krakenPair as key
    const allPairs = Object.entries(krakenPairsRecord).map(([krakenPair, info]) => ({
      krakenPair,
      ...info
    }));

    // Filter pairs based on criteria - use POPULAR_PAIRS
    let filteredPairs = POPULAR_PAIRS.map(krakenPair => {
      const pair = allPairs.find(p => p.krakenPair === krakenPair);
      return pair;
    }).filter((p): p is NonNullable<typeof p> => p !== undefined);

    // Apply base/quote asset filters
    if (baseAsset) {
      filteredPairs = filteredPairs.filter(p => p?.base === baseAsset);
    }
    if (quoteAsset) {
      filteredPairs = filteredPairs.filter(p => p?.quote === quoteAsset);
    }

    // Limit the number of pairs to scan for performance
    const pairsToScan = filteredPairs.slice(0, Math.min(filteredPairs.length, limit));

    const opportunities: ScannerOpportunity[] = [];

    // Scan each pair
    for (const pair of pairsToScan) {
      if (!pair) continue;

      try {
        // Fetch OHLC data
        const ohlcResult = await fetchKrakenOHLCByTimeframe(
          pair.krakenPair,
          timeframe,
          undefined
        );

        if (!ohlcResult.success || !ohlcResult.data || ohlcResult.data.length < 50) {
          continue; // Skip if insufficient data
        }

        const ohlcvData = ohlcResult.data;

        // Determine which strategies to test
        const strategiesToTest = strategy ? [strategy] : AVAILABLE_STRATEGIES;

        // Test each strategy
        for (const strat of strategiesToTest) {
          const generator = new SignalGenerator(ohlcvData, {
            strategy: strat,
            confidenceThreshold: minConfidence
          });

          const signal = generator.generateSignal();

          if (!signal || signal.confidence < minConfidence) {
            continue;
          }

          // Apply direction filter
          if (direction !== 'all' && signal.direction !== direction) {
            continue;
          }

          // Apply risk filter
          if (risk !== 'all' && signal.risk !== risk) {
            continue;
          }

          // Skip if signal doesn't have required price levels
          if (!signal.stopLoss || !signal.takeProfit) {
            continue;
          }

          // Calculate potential profit percentage
          const potentialProfit = signal.direction === 'buy'
            ? ((signal.takeProfit - signal.entryPrice) / signal.entryPrice) * 100
            : ((signal.entryPrice - signal.takeProfit) / signal.entryPrice) * 100;

          opportunities.push({
            pair: pair.krakenPair,
            altname: pair.altname || pair.krakenPair,
            base: pair.base,
            quote: pair.quote,
            direction: signal.direction,
            confidence: signal.confidence,
            risk: signal.risk,
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            potentialProfit: Number(potentialProfit.toFixed(2)),
            strategy: strat,
            reason: signal.reason,
            timeframe,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Skip problematic pairs
        console.error(`Error scanning ${pair.krakenPair}:`, error);
        continue;
      }
    }

    // Sort by confidence (highest first)
    opportunities.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      opportunities: opportunities.slice(0, limit),
      totalScanned: pairsToScan.length,
      totalOpportunities: opportunities.length
    };
  } catch (error) {
    console.error('Market scan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scan market',
      opportunities: []
    };
  }
}

/**
 * Get available filter options
 */
export async function getScannerFilterOptions() {
  try {
    await requireAuth();

    const krakenPairsRecord = await fetchKrakenPairs();
    
    // Convert Record to array
    const allPairs = Object.values(krakenPairsRecord);

    // Extract unique base and quote assets
    const baseAssets = [...new Set(allPairs.map(p => p.base))].sort();
    const quoteAssets = [...new Set(allPairs.map(p => p.quote))].sort();

    return {
      success: true,
      baseAssets,
      quoteAssets,
      strategies: AVAILABLE_STRATEGIES,
      timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]
    };
  } catch (error) {
    console.error('Get filter options error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get filter options'
    };
  }
}
