
import { OHLCVCandle, RSIResult } from './types';

/**
 * Calculate Relative Strength Index (RSI)
 * 
 * @param candles - Array of OHLCV candles (must be sorted chronologically)
 * @param period - RSI period (default: 14)
 * @returns RSIResult object
 */
export function calculateRSI(
  candles: OHLCVCandle[],
  period: number = 14
): RSIResult | null {
  if (candles.length < period + 1) {
    return null; // Not enough data
  }

  const prices = candles.map(c => c.close);
  
  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Separate gains and losses
  const gains = changes.map(change => Math.max(change, 0));
  const losses = changes.map(change => Math.max(-change, 0));

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate RSI using Wilder's smoothing method
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return {
    value: Number(rsi.toFixed(2)),
    period,
    overbought: rsi > 70,
    oversold: rsi < 30,
  };
}
