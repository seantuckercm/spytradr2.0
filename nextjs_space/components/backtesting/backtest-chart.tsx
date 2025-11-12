
'use client';

import { useState, useEffect } from 'react';
import { CandlestickChart, OHLCVData } from '@/components/charts/candlestick-chart';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SelectBacktest, SelectBacktestTrade } from '@/db/schema/backtests-schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BacktestChartProps {
  backtest: SelectBacktest & { trades: SelectBacktestTrade[] };
}

export function BacktestChart({ backtest }: BacktestChartProps) {
  const [selectedPair, setSelectedPair] = useState<string>((backtest.pairs as string[])[0]);
  const [ohlcData, setOhlcData] = useState<OHLCVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        setIsLoading(true);
        setError(null);

        // Calculate timestamp for data fetching (start date minus buffer for indicators)
        const startDate = new Date(backtest.startDate);
        const bufferDays = 30; // Extra days for indicator calculation
        const fetchStartDate = new Date(startDate);
        fetchStartDate.setDate(fetchStartDate.getDate() - bufferDays);
        const since = Math.floor(fetchStartDate.getTime() / 1000);

        // Fetch OHLC data
        const response = await fetch(
          `/api/kraken/ohlc?pair=${encodeURIComponent(selectedPair)}&timeframe=${backtest.timeframe}&since=${since}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'No data available');
        }

        // Convert to chart format
        const chartData: OHLCVData[] = result.data.map((candle: any) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        setOhlcData(chartData);
      } catch (err) {
        console.error('Error fetching backtest chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedPair) {
      fetchChartData();
    }
  }, [selectedPair, backtest.startDate, backtest.timeframe]);

  // Convert trades to chart markers
  const getMarkers = () => {
    if (!backtest.trades || ohlcData.length === 0) return [];

    const pairTrades = backtest.trades.filter((trade) => trade.pair === selectedPair);
    const markers: any[] = [];

    pairTrades.forEach((trade) => {
      // Entry marker
      const entryTime = Math.floor(new Date(trade.entryTime).getTime() / 1000);
      markers.push({
        time: entryTime,
        position: 'belowBar' as const,
        color: trade.direction === 'buy' ? '#10b981' : '#ef4444',
        shape: trade.direction === 'buy' ? 'arrowUp' : 'arrowDown',
        text: `Entry: $${parseFloat(trade.entryPrice).toFixed(2)}`,
      });

      // Exit marker (if trade is closed)
      if (trade.exitTime && trade.exitPrice) {
        const exitTime = Math.floor(new Date(trade.exitTime).getTime() / 1000);
        markers.push({
          time: exitTime,
          position: 'aboveBar' as const,
          color: trade.isWin ? '#10b981' : '#ef4444',
          shape: trade.isWin ? 'circle' : 'circle',
          text: `Exit: $${parseFloat(trade.exitPrice).toFixed(2)} (${parseFloat(trade.pnlPercent || '0').toFixed(2)}%)`,
        });
      }
    });

    return markers;
  };

  if (isLoading) {
    return (
      <Card className="p-12 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  const pairs = backtest.pairs as string[];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Visualization</h3>
          {pairs.length > 1 && (
            <Tabs value={selectedPair} onValueChange={setSelectedPair}>
              <TabsList>
                {pairs.map((pair) => (
                  <TabsTrigger key={pair} value={pair}>
                    {pair}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Buy Entry / Winning Exit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Sell Entry / Losing Exit</span>
          </div>
        </div>

        <CandlestickChart
          data={ohlcData}
          height={500}
          showVolume={true}
          markers={getMarkers()}
        />

        <div className="grid gap-2 md:grid-cols-2 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-muted-foreground">Trades on {selectedPair}</p>
            <p className="text-lg font-semibold">
              {backtest.trades?.filter((t) => t.pair === selectedPair).length || 0}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-muted-foreground">Win Rate on {selectedPair}</p>
            <p className="text-lg font-semibold">
              {(() => {
                const pairTrades = backtest.trades?.filter((t) => t.pair === selectedPair) || [];
                const wins = pairTrades.filter((t) => t.isWin).length;
                const total = pairTrades.length;
                return total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : 'N/A';
              })()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
