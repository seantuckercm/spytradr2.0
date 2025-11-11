
import { OHLCVCandle, VolumeAnalysisResult } from './types';

/**
 * Analyze volume patterns
 * 
 * @param candles - Array of OHLCV candles (must be sorted chronologically)
 * @param period - Period for average volume calculation (default: 20)
 * @returns VolumeAnalysisResult object or null if insufficient data
 */
export function analyzeVolume(
  candles: OHLCVCandle[],
  period: number = 20
): VolumeAnalysisResult | null {
  if (candles.length < period) {
    return null;
  }

  const volumes = candles.map(c => c.volume);
  const recentVolumes = volumes.slice(-period);
  
  // Calculate average volume
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / period;
  
  // Current volume
  const currentVolume = volumes[volumes.length - 1];
  
  // Calculate percent change from average
  const percentChange = ((currentVolume - avgVolume) / avgVolume) * 100;
  
  // Determine if this is high volume (50% above average)
  const highVolume = currentVolume > avgVolume * 1.5;

  return {
    current: Number(currentVolume.toFixed(2)),
    average: Number(avgVolume.toFixed(2)),
    percentChange: Number(percentChange.toFixed(2)),
    highVolume,
  };
}

/**
 * Calculate On-Balance Volume (OBV)
 */
export function calculateOBV(candles: OHLCVCandle[]): number {
  if (candles.length < 2) {
    return 0;
  }

  let obv = candles[0].volume;
  
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) {
      obv += candles[i].volume;
    } else if (candles[i].close < candles[i - 1].close) {
      obv -= candles[i].volume;
    }
    // If close is same, OBV stays the same
  }
  
  return Number(obv.toFixed(2));
}
