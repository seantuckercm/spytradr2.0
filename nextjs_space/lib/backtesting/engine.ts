
import { OHLCVCandle } from '../indicators/types';
import { SignalGenerator } from '../analysis/signal-generator';
import { InsertBacktestTrade, SelectBacktest } from '@/db/schema/backtests-schema';

interface BacktestConfig {
  pairs: string[];
  strategies: string[];
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  maxPositionSize: number; // % of portfolio
  stopLossPercent: number;
  takeProfitPercent: number;
  minConfidence: number;
}

interface BacktestPosition {
  pair: string;
  direction: 'buy' | 'sell';
  strategy: string;
  entryTime: Date;
  entryPrice: number;
  positionSize: number;
  confidence: number;
  indicators: any;
}

interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  finalBalance: number;
  totalReturn: number; // %
  sharpeRatio: number;
  maxDrawdown: number; // %
  winRate: number; // %
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  trades: InsertBacktestTrade[];
}

export class BacktestEngine {
  private config: BacktestConfig;
  private balance: number;
  private positions: BacktestPosition[];
  private trades: InsertBacktestTrade[];
  private balanceHistory: { time: Date; balance: number }[];

  constructor(config: BacktestConfig) {
    this.config = config;
    this.balance = config.initialBalance;
    this.positions = [];
    this.trades = [];
    this.balanceHistory = [{ time: config.startDate, balance: config.initialBalance }];
  }

  async run(ohlcvData: Map<string, OHLCVCandle[]>): Promise<BacktestResult> {
    // Get all timestamps from all pairs and sort them
    const allTimestamps = new Set<number>();
    for (const candles of ohlcvData.values()) {
      candles.forEach((candle) => allTimestamps.add(candle.timestamp));
    }
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Process each timestamp chronologically
    for (const timestamp of sortedTimestamps) {
      const currentTime = new Date(timestamp);
      
      // Skip if outside backtest range
      if (currentTime < this.config.startDate || currentTime > this.config.endDate) {
        continue;
      }

      // Check and close open positions first
      await this.checkOpenPositions(currentTime, ohlcvData);

      // Generate signals for each pair
      for (const pair of this.config.pairs) {
        const pairData = ohlcvData.get(pair);
        if (!pairData) continue;

        // Get historical data up to current point
        const historicalData = pairData.filter((c) => c.timestamp <= timestamp);
        if (historicalData.length < 50) continue; // Need enough data for indicators

        // Try each strategy
        for (const strategy of this.config.strategies) {
          // Create a new SignalGenerator for this analysis
          const signalGenerator = new SignalGenerator(historicalData, {
            strategy,
            confidenceThreshold: this.config.minConfidence,
          });
          
          const signal = signalGenerator.generateSignal();

          if (signal && signal.confidence >= this.config.minConfidence) {
            // Check if we can open a new position
            await this.openPosition(signal, pair, currentTime, historicalData[historicalData.length - 1]);
          }
        }
      }

      // Record balance snapshot
      this.balanceHistory.push({ time: currentTime, balance: this.balance });
    }

    // Close all remaining open positions at the end
    await this.closeAllPositions(this.config.endDate, ohlcvData);

    // Calculate final metrics
    return this.calculateResults();
  }

  private async openPosition(
    signal: any,
    pair: string,
    currentTime: Date,
    currentCandle: OHLCVCandle
  ): Promise<void> {
    // Check if we already have a position for this pair
    if (this.positions.find((p) => p.pair === pair)) {
      return; // Already in a position
    }

    // Calculate position size based on available balance
    const maxPositionValue = (this.balance * this.config.maxPositionSize) / 100;
    const positionSize = Math.min(maxPositionValue, this.balance * 0.95); // Leave 5% buffer

    if (positionSize < 10) {
      return; // Position too small
    }

    // Deduct from balance
    this.balance -= positionSize;

    // Create position
    const position: BacktestPosition = {
      pair,
      direction: signal.direction,
      strategy: signal.strategy,
      entryTime: currentTime,
      entryPrice: currentCandle.close,
      positionSize,
      confidence: signal.confidence,
      indicators: signal.indicators || {},
    };

    this.positions.push(position);
  }

  private async checkOpenPositions(
    currentTime: Date,
    ohlcvData: Map<string, OHLCVCandle[]>
  ): Promise<void> {
    const positionsToClose: number[] = [];

    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];
      const pairData = ohlcvData.get(position.pair);
      if (!pairData) continue;

      // Get current price
      const currentCandle = pairData.find((c) => c.timestamp === currentTime.getTime());
      if (!currentCandle) continue;

      const currentPrice = currentCandle.close;
      const priceChange = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // Determine if we should close the position
      let exitReason: string | null = null;

      if (position.direction === 'buy') {
        if (priceChange >= this.config.takeProfitPercent) {
          exitReason = 'take_profit';
        } else if (priceChange <= -this.config.stopLossPercent) {
          exitReason = 'stop_loss';
        }
      } else {
        // Sell position (inverse logic)
        if (priceChange <= -this.config.takeProfitPercent) {
          exitReason = 'take_profit';
        } else if (priceChange >= this.config.stopLossPercent) {
          exitReason = 'stop_loss';
        }
      }

      if (exitReason) {
        await this.closePosition(i, currentTime, currentPrice, exitReason);
        positionsToClose.push(i);
      }
    }

    // Remove closed positions
    for (let i = positionsToClose.length - 1; i >= 0; i--) {
      this.positions.splice(positionsToClose[i], 1);
    }
  }

  private async closePosition(
    positionIndex: number,
    exitTime: Date,
    exitPrice: number,
    exitReason: string
  ): Promise<void> {
    const position = this.positions[positionIndex];

    // Calculate P&L
    let pnl: number;
    if (position.direction === 'buy') {
      pnl = (position.positionSize * (exitPrice - position.entryPrice)) / position.entryPrice;
    } else {
      pnl = (position.positionSize * (position.entryPrice - exitPrice)) / position.entryPrice;
    }

    const pnlPercent = (pnl / position.positionSize) * 100;
    const isWin = pnl > 0;

    // Return position size + P&L to balance
    this.balance += position.positionSize + pnl;

    // Record trade
    const trade: InsertBacktestTrade = {
      backtestId: '', // Will be set later
      pair: position.pair,
      direction: position.direction,
      strategy: position.strategy,
      entryTime: position.entryTime,
      entryPrice: position.entryPrice.toString(),
      confidence: position.confidence,
      positionSize: position.positionSize.toString(),
      exitTime,
      exitPrice: exitPrice.toString(),
      exitReason,
      pnl: pnl.toString(),
      pnlPercent: pnlPercent.toString(),
      isWin,
      indicators: position.indicators,
    };

    this.trades.push(trade);
  }

  private async closeAllPositions(endTime: Date, ohlcvData: Map<string, OHLCVCandle[]>): Promise<void> {
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];
      const pairData = ohlcvData.get(position.pair);
      if (!pairData) continue;

      // Get last available price
      const lastCandle = pairData[pairData.length - 1];
      await this.closePosition(i, endTime, lastCandle.close, 'time_limit');
    }
    this.positions = [];
  }

  private calculateResults(): BacktestResult {
    const totalTrades = this.trades.length;
    const winningTrades = this.trades.filter((t) => t.isWin).length;
    const losingTrades = totalTrades - winningTrades;

    const totalPnl = this.trades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
    const wins = this.trades.filter((t) => t.isWin);
    const losses = this.trades.filter((t) => !t.isWin);

    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0) / losses.length) : 0;

    const totalReturn = ((this.balance - this.config.initialBalance) / this.config.initialBalance) * 100;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Calculate Sharpe Ratio (simplified)
    const returns = this.balanceHistory.map((snapshot, i) => {
      if (i === 0) return 0;
      return (snapshot.balance - this.balanceHistory[i - 1].balance) / this.balanceHistory[i - 1].balance;
    });
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let peak = this.config.initialBalance;
    for (const snapshot of this.balanceHistory) {
      if (snapshot.balance > peak) {
        peak = snapshot.balance;
      }
      const drawdown = ((peak - snapshot.balance) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      finalBalance: this.balance,
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      trades: this.trades,
    };
  }
}
