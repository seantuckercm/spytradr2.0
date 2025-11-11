
import {
  OHLCVCandle,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateEMA,
  calculateSMA,
  analyzeVolume,
  RSIResult,
  MACDResult,
  BollingerBandsResult,
  EMAResult,
  SMAResult,
  VolumeAnalysisResult,
} from '@/lib/indicators';

export interface TradingSignal {
  direction: 'buy' | 'sell';
  confidence: number; // 0-100
  risk: 'low' | 'medium' | 'high';
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  reason: string;
  indicators: {
    rsi?: RSIResult;
    macd?: MACDResult;
    bollingerBands?: BollingerBandsResult;
    ema12?: EMAResult;
    ema26?: EMAResult;
    sma20?: SMAResult;
    sma50?: SMAResult;
    sma200?: SMAResult;
    volume?: VolumeAnalysisResult;
  };
}

export interface SignalGeneratorOptions {
  strategy: string;
  confidenceThreshold: number;
}

/**
 * Generate trading signals based on technical analysis
 */
export class SignalGenerator {
  private candles: OHLCVCandle[];
  private strategy: string;
  private confidenceThreshold: number;

  constructor(candles: OHLCVCandle[], options: SignalGeneratorOptions) {
    this.candles = candles;
    this.strategy = options.strategy;
    this.confidenceThreshold = options.confidenceThreshold;
  }

  /**
   * Generate signal based on selected strategy
   */
  public generateSignal(): TradingSignal | null {
    if (this.candles.length < 200) {
      // Not enough data for reliable signals
      return null;
    }

    switch (this.strategy) {
      case 'rsi-oversold-overbought':
        return this.rsiStrategy();
      case 'macd-crossover':
        return this.macdStrategy();
      case 'bollinger-breakout':
        return this.bollingerStrategy();
      case 'ema-crossover':
        return this.emaCrossoverStrategy();
      case 'trend-following':
        return this.trendFollowingStrategy();
      case 'mean-reversion':
        return this.meanReversionStrategy();
      default:
        return this.defaultStrategy();
    }
  }

  /**
   * RSI Oversold/Overbought Strategy
   */
  private rsiStrategy(): TradingSignal | null {
    const rsi = calculateRSI(this.candles, 14);
    const macd = calculateMACD(this.candles);
    const volume = analyzeVolume(this.candles);
    
    if (!rsi) return null;

    const currentPrice = this.candles[this.candles.length - 1].close;
    let signal: TradingSignal | null = null;

    // Buy signal: RSI oversold
    if (rsi.oversold) {
      const confidence = this.calculateConfidence({
        primary: 100 - rsi.value, // Lower RSI = higher confidence
        macdConfirm: macd?.bullish ? 20 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'buy',
          confidence,
          risk: this.calculateRisk(rsi.value, 'buy'),
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.95, // 5% stop loss
          takeProfit: currentPrice * 1.10, // 10% take profit
          reason: `RSI oversold at ${rsi.value.toFixed(2)}${macd?.bullish ? ', MACD bullish crossover' : ''}${volume?.highVolume ? ', high volume confirmation' : ''}`,
          indicators: { rsi, macd: macd || undefined, volume: volume || undefined },
        };
      }
    }

    // Sell signal: RSI overbought
    if (rsi.overbought) {
      const confidence = this.calculateConfidence({
        primary: rsi.value - 30, // Higher RSI = higher confidence
        macdConfirm: macd?.bearish ? 20 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'sell',
          confidence,
          risk: this.calculateRisk(rsi.value, 'sell'),
          entryPrice: currentPrice,
          stopLoss: currentPrice * 1.05, // 5% stop loss
          takeProfit: currentPrice * 0.90, // 10% take profit
          reason: `RSI overbought at ${rsi.value.toFixed(2)}${macd?.bearish ? ', MACD bearish crossover' : ''}${volume?.highVolume ? ', high volume confirmation' : ''}`,
          indicators: { rsi, macd: macd || undefined, volume: volume || undefined },
        };
      }
    }

    return signal;
  }

  /**
   * MACD Crossover Strategy
   */
  private macdStrategy(): TradingSignal | null {
    const macd = calculateMACD(this.candles);
    const rsi = calculateRSI(this.candles, 14);
    const volume = analyzeVolume(this.candles);
    
    if (!macd) return null;

    const currentPrice = this.candles[this.candles.length - 1].close;
    let signal: TradingSignal | null = null;

    // Buy signal: Bullish MACD crossover
    if (macd.bullish) {
      const confidence = this.calculateConfidence({
        primary: 60,
        macdStrength: Math.min(Math.abs(macd.histogram) * 100, 25),
        rsiConfirm: rsi && !rsi.overbought ? 15 : 0,
        volumeConfirm: volume?.highVolume ? 10 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'buy',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.96, // 4% stop loss
          takeProfit: currentPrice * 1.08, // 8% take profit
          reason: `MACD bullish crossover (histogram: ${macd.histogram.toFixed(4)})${rsi && !rsi.overbought ? ', RSI not overbought' : ''}${volume?.highVolume ? ', high volume' : ''}`,
          indicators: { macd, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    // Sell signal: Bearish MACD crossover
    if (macd.bearish) {
      const confidence = this.calculateConfidence({
        primary: 60,
        macdStrength: Math.min(Math.abs(macd.histogram) * 100, 25),
        rsiConfirm: rsi && !rsi.oversold ? 15 : 0,
        volumeConfirm: volume?.highVolume ? 10 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'sell',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: currentPrice * 1.04, // 4% stop loss
          takeProfit: currentPrice * 0.92, // 8% take profit
          reason: `MACD bearish crossover (histogram: ${macd.histogram.toFixed(4)})${rsi && !rsi.oversold ? ', RSI not oversold' : ''}${volume?.highVolume ? ', high volume' : ''}`,
          indicators: { macd, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    return signal;
  }

  /**
   * Bollinger Bands Breakout Strategy
   */
  private bollingerStrategy(): TradingSignal | null {
    const bb = calculateBollingerBands(this.candles);
    const rsi = calculateRSI(this.candles, 14);
    const volume = analyzeVolume(this.candles);
    
    if (!bb) return null;

    const currentPrice = this.candles[this.candles.length - 1].close;
    let signal: TradingSignal | null = null;

    // Buy signal: Price near or below lower band
    if (bb.percentB < 0.2) {
      const confidence = this.calculateConfidence({
        primary: (0.2 - bb.percentB) * 200, // Closer to lower band = higher confidence
        rsiConfirm: rsi && rsi.oversold ? 20 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
        bandwidthConfirm: bb.bandwidth > 2 ? 10 : 0, // Higher volatility
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'buy',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: bb.lower * 0.98, // Stop below lower band
          takeProfit: bb.middle, // Target middle band
          reason: `Price near lower Bollinger Band (%B: ${bb.percentB.toFixed(2)})${rsi && rsi.oversold ? ', RSI oversold' : ''}`,
          indicators: { bollingerBands: bb, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    // Sell signal: Price near or above upper band
    if (bb.percentB > 0.8) {
      const confidence = this.calculateConfidence({
        primary: (bb.percentB - 0.8) * 200, // Closer to upper band = higher confidence
        rsiConfirm: rsi && rsi.overbought ? 20 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
        bandwidthConfirm: bb.bandwidth > 2 ? 10 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'sell',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: bb.upper * 1.02, // Stop above upper band
          takeProfit: bb.middle, // Target middle band
          reason: `Price near upper Bollinger Band (%B: ${bb.percentB.toFixed(2)})${rsi && rsi.overbought ? ', RSI overbought' : ''}`,
          indicators: { bollingerBands: bb, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    return signal;
  }

  /**
   * EMA Crossover Strategy (12/26 EMAs)
   */
  private emaCrossoverStrategy(): TradingSignal | null {
    const ema12 = calculateEMA(this.candles, 12);
    const ema26 = calculateEMA(this.candles, 26);
    const rsi = calculateRSI(this.candles, 14);
    const volume = analyzeVolume(this.candles);
    
    if (!ema12 || !ema26) return null;

    // Calculate previous EMAs to detect crossover
    const prevCandles = this.candles.slice(0, -1);
    const prevEma12 = calculateEMA(prevCandles, 12);
    const prevEma26 = calculateEMA(prevCandles, 26);
    
    if (!prevEma12 || !prevEma26) return null;

    const currentPrice = this.candles[this.candles.length - 1].close;
    const currentCross = ema12.value > ema26.value;
    const prevCross = prevEma12.value > prevEma26.value;
    let signal: TradingSignal | null = null;

    // Buy signal: Bullish crossover (12 EMA crosses above 26 EMA)
    if (currentCross && !prevCross) {
      const confidence = this.calculateConfidence({
        primary: 65,
        rsiConfirm: rsi && !rsi.overbought ? 15 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'buy',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: ema26.value * 0.98, // Stop below 26 EMA
          takeProfit: currentPrice * 1.10, // 10% target
          reason: `Bullish EMA crossover (12 EMA: ${ema12.value.toFixed(2)}, 26 EMA: ${ema26.value.toFixed(2)})`,
          indicators: { ema12, ema26, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    // Sell signal: Bearish crossover (12 EMA crosses below 26 EMA)
    if (!currentCross && prevCross) {
      const confidence = this.calculateConfidence({
        primary: 65,
        rsiConfirm: rsi && !rsi.oversold ? 15 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'sell',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: ema26.value * 1.02, // Stop above 26 EMA
          takeProfit: currentPrice * 0.90, // 10% target
          reason: `Bearish EMA crossover (12 EMA: ${ema12.value.toFixed(2)}, 26 EMA: ${ema26.value.toFixed(2)})`,
          indicators: { ema12, ema26, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    return signal;
  }

  /**
   * Trend Following Strategy (combined indicators)
   */
  private trendFollowingStrategy(): TradingSignal | null {
    const ema12 = calculateEMA(this.candles, 12);
    const ema26 = calculateEMA(this.candles, 26);
    const sma50 = calculateSMA(this.candles, 50);
    const sma200 = calculateSMA(this.candles, 200);
    const macd = calculateMACD(this.candles);
    const rsi = calculateRSI(this.candles, 14);
    const volume = analyzeVolume(this.candles);
    
    if (!ema12 || !ema26 || !sma50 || !sma200) return null;

    const currentPrice = this.candles[this.candles.length - 1].close;
    let signal: TradingSignal | null = null;

    // Bullish trend: Price > 50 SMA > 200 SMA, 12 EMA > 26 EMA
    const bullishTrend = 
      currentPrice > sma50.value &&
      sma50.value > sma200.value &&
      ema12.value > ema26.value;

    // Bearish trend: Price < 50 SMA < 200 SMA, 12 EMA < 26 EMA
    const bearishTrend =
      currentPrice < sma50.value &&
      sma50.value < sma200.value &&
      ema12.value < ema26.value;

    if (bullishTrend && macd?.bullish) {
      const confidence = this.calculateConfidence({
        primary: 70,
        rsiConfirm: rsi && rsi.value > 50 && rsi.value < 70 ? 15 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'buy',
          confidence,
          risk: 'medium',
          entryPrice: currentPrice,
          stopLoss: sma50.value * 0.98,
          takeProfit: currentPrice * 1.15,
          reason: `Strong bullish trend confirmed by multiple indicators`,
          indicators: { ema12, ema26, sma50, sma200, macd, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    if (bearishTrend && macd?.bearish) {
      const confidence = this.calculateConfidence({
        primary: 70,
        rsiConfirm: rsi && rsi.value < 50 && rsi.value > 30 ? 15 : 0,
        volumeConfirm: volume?.highVolume ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'sell',
          confidence,
          risk: 'medium',
          entryPrice: currentPrice,
          stopLoss: sma50.value * 1.02,
          takeProfit: currentPrice * 0.85,
          reason: `Strong bearish trend confirmed by multiple indicators`,
          indicators: { ema12, ema26, sma50, sma200, macd, rsi: rsi || undefined, volume: volume || undefined },
        };
      }
    }

    return signal;
  }

  /**
   * Mean Reversion Strategy
   */
  private meanReversionStrategy(): TradingSignal | null {
    const bb = calculateBollingerBands(this.candles);
    const rsi = calculateRSI(this.candles, 14);
    const sma20 = calculateSMA(this.candles, 20);
    
    if (!bb || !sma20) return null;

    const currentPrice = this.candles[this.candles.length - 1].close;
    const deviation = ((currentPrice - sma20.value) / sma20.value) * 100;
    
    let signal: TradingSignal | null = null;

    // Buy signal: Price significantly below mean
    if (deviation < -5 && bb.percentB < 0.3) {
      const confidence = this.calculateConfidence({
        primary: Math.min(Math.abs(deviation) * 10, 60),
        rsiConfirm: rsi && rsi.oversold ? 25 : 0,
        bbConfirm: bb.percentB < 0.1 ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'buy',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: bb.lower * 0.97,
          takeProfit: sma20.value, // Target mean reversion
          reason: `Mean reversion opportunity: ${deviation.toFixed(2)}% below 20 SMA`,
          indicators: { sma20, bollingerBands: bb, rsi: rsi || undefined },
        };
      }
    }

    // Sell signal: Price significantly above mean
    if (deviation > 5 && bb.percentB > 0.7) {
      const confidence = this.calculateConfidence({
        primary: Math.min(deviation * 10, 60),
        rsiConfirm: rsi && rsi.overbought ? 25 : 0,
        bbConfirm: bb.percentB > 0.9 ? 15 : 0,
      });

      if (confidence >= this.confidenceThreshold) {
        signal = {
          direction: 'sell',
          confidence,
          risk: this.calculateRiskFromConfidence(confidence),
          entryPrice: currentPrice,
          stopLoss: bb.upper * 1.03,
          takeProfit: sma20.value, // Target mean reversion
          reason: `Mean reversion opportunity: ${deviation.toFixed(2)}% above 20 SMA`,
          indicators: { sma20, bollingerBands: bb, rsi: rsi || undefined },
        };
      }
    }

    return signal;
  }

  /**
   * Default strategy (combination of multiple signals)
   */
  private defaultStrategy(): TradingSignal | null {
    // Try strategies in order of preference
    return (
      this.trendFollowingStrategy() ||
      this.macdStrategy() ||
      this.rsiStrategy() ||
      this.bollingerStrategy() ||
      null
    );
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(factors: Record<string, number>): number {
    const total = Object.values(factors).reduce((sum, value) => sum + value, 0);
    return Math.min(Math.max(total, 0), 100); // Clamp between 0-100
  }

  /**
   * Calculate risk based on RSI value
   */
  private calculateRisk(rsiValue: number, direction: 'buy' | 'sell'): 'low' | 'medium' | 'high' {
    if (direction === 'buy') {
      if (rsiValue < 20) return 'low';
      if (rsiValue < 30) return 'medium';
      return 'high';
    } else {
      if (rsiValue > 80) return 'low';
      if (rsiValue > 70) return 'medium';
      return 'high';
    }
  }

  /**
   * Calculate risk from confidence score
   */
  private calculateRiskFromConfidence(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence >= 75) return 'low';
    if (confidence >= 50) return 'medium';
    return 'high';
  }
}
