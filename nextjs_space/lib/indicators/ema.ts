
import { OHLCVCandle, EMAResult } from './types';

/**
 * Calculate Exponential Moving Average (EMA)
 * 
 * @param candles - Array of OHLCV candles (must be sorted chronologically)
 * @param period - EMA period
 * @returns EMAResult object or null if insufficient data
 */
export function calculateEMA(
  candles: OHLCVCandle[],
  period: number
): EMAResult | null {
  if (candles.length < period) {
    return null;
  }

  const prices = candles.map(c => c.close);
  const k = 2 / (period + 1); // Smoothing factor

  // Calculate initial SMA as the first EMA value
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate EMA for subsequent values
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }

  return {
    value: Number(ema.toFixed(8)),
    period,
  };
}

/**
 * Calculate multiple EMAs
 */
export function calculateMultipleEMAs(
  candles: OHLCVCandle[],
  periods: number[]
): Map<number, EMAResult | null> {
  const results = new Map<number, EMAResult | null>();
  
  for (const period of periods) {
    results.set(period, calculateEMA(candles, period));
  }
  
  return results;
}
