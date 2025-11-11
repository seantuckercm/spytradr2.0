
import { OHLCVCandle, SMAResult } from './types';

/**
 * Calculate Simple Moving Average (SMA)
 * 
 * @param candles - Array of OHLCV candles (must be sorted chronologically)
 * @param period - SMA period
 * @returns SMAResult object or null if insufficient data
 */
export function calculateSMA(
  candles: OHLCVCandle[],
  period: number
): SMAResult | null {
  if (candles.length < period) {
    return null;
  }

  const prices = candles.map(c => c.close);
  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((a, b) => a + b, 0);
  const sma = sum / period;

  return {
    value: Number(sma.toFixed(8)),
    period,
  };
}

/**
 * Calculate multiple SMAs
 */
export function calculateMultipleSMAs(
  candles: OHLCVCandle[],
  periods: number[]
): Map<number, SMAResult | null> {
  const results = new Map<number, SMAResult | null>();
  
  for (const period of periods) {
    results.set(period, calculateSMA(candles, period));
  }
  
  return results;
}
