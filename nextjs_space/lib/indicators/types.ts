
// Types for technical indicators

export interface OHLCVCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIResult {
  value: number;
  period: number;
  overbought: boolean;
  oversold: boolean;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  bullish: boolean;
  bearish: boolean;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface EMAResult {
  value: number;
  period: number;
}

export interface SMAResult {
  value: number;
  period: number;
}

export interface VolumeAnalysisResult {
  current: number;
  average: number;
  percentChange: number;
  highVolume: boolean;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'sideways';
  strength: number; // 0-100
}

export interface SupportResistance {
  support: number[];
  resistance: number[];
}
