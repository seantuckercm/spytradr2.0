
import { OHLCVCandle, BollingerBandsResult } from './types';
import { calculateSMA } from './sma';

/**
 * Calculate Bollinger Bands
 * 
 * @param candles - Array of OHLCV candles (must be sorted chronologically)
 * @param period - Period for middle band SMA (default: 20)
 * @param stdDev - Number of standard deviations (default: 2)
 * @returns BollingerBandsResult object or null if insufficient data
 */
export function calculateBollingerBands(
  candles: OHLCVCandle[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult | null {
  if (candles.length < period) {
    return null;
  }

  const prices = candles.map(c => c.close);
  const recentPrices = prices.slice(-period);
  
  // Calculate middle band (SMA)
  const sma = calculateSMA(candles, period);
  if (!sma) {
    return null;
  }
  
  const middle = sma.value;
  
  // Calculate standard deviation
  const squaredDiffs = recentPrices.map(price => Math.pow(price - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate upper and lower bands
  const upper = middle + (stdDev * standardDeviation);
  const lower = middle - (stdDev * standardDeviation);
  
  // Calculate bandwidth
  const bandwidth = ((upper - lower) / middle) * 100;
  
  // Calculate %B (where price is relative to bands)
  const currentPrice = prices[prices.length - 1];
  const percentB = (currentPrice - lower) / (upper - lower);

  return {
    upper: Number(upper.toFixed(8)),
    middle: Number(middle.toFixed(8)),
    lower: Number(lower.toFixed(8)),
    bandwidth: Number(bandwidth.toFixed(2)),
    percentB: Number(percentB.toFixed(2)),
  };
}
