
import { OHLCVCandle, MACDResult } from './types';
import { calculateEMA } from './ema';

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * 
 * @param candles - Array of OHLCV candles (must be sorted chronologically)
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line period (default: 9)
 * @returns MACDResult object or null if insufficient data
 */
export function calculateMACD(
  candles: OHLCVCandle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult | null {
  if (candles.length < slowPeriod + signalPeriod) {
    return null;
  }

  const prices = candles.map(c => c.close);
  
  // Calculate fast and slow EMAs
  const fastEMA = calculateEMAFromPrices(prices, fastPeriod);
  const slowEMA = calculateEMAFromPrices(prices, slowPeriod);
  
  if (!fastEMA || !slowEMA) {
    return null;
  }

  // Calculate MACD line
  const macdLine = fastEMA - slowEMA;
  
  // Calculate signal line (EMA of MACD line)
  const macdValues: OHLCVCandle[] = [];
  for (let i = slowPeriod - 1; i < candles.length; i++) {
    const fast = calculateEMAFromPrices(prices.slice(0, i + 1), fastPeriod);
    const slow = calculateEMAFromPrices(prices.slice(0, i + 1), slowPeriod);
    if (fast && slow) {
      macdValues.push({
        ...candles[i],
        close: fast - slow,
      });
    }
  }
  
  const signalLine = calculateEMA(macdValues, signalPeriod);
  
  if (!signalLine) {
    return null;
  }

  // Calculate histogram
  const histogram = macdLine - signalLine.value;
  
  // Previous histogram for crossover detection
  let prevHistogram = 0;
  if (macdValues.length > 1) {
    const prevMacd = macdValues[macdValues.length - 2].close;
    const prevSignal = calculateEMA(macdValues.slice(0, -1), signalPeriod);
    if (prevSignal) {
      prevHistogram = prevMacd - prevSignal.value;
    }
  }

  return {
    macd: Number(macdLine.toFixed(8)),
    signal: signalLine.value,
    histogram: Number(histogram.toFixed(8)),
    bullish: histogram > 0 && prevHistogram <= 0, // Bullish crossover
    bearish: histogram < 0 && prevHistogram >= 0, // Bearish crossover
  };
}

/**
 * Helper function to calculate EMA from price array
 */
function calculateEMAFromPrices(prices: number[], period: number): number | null {
  if (prices.length < period) {
    return null;
  }

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }

  return ema;
}
