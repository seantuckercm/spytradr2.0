
'use client';

import { useEffect, useState } from 'react';
import { CandlestickChart, OHLCVData } from '@/components/charts/candlestick-chart';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WatchlistItemChartProps {
  krakenPair: string;
  timeframe: string;
}

export function WatchlistItemChart({ krakenPair, timeframe }: WatchlistItemChartProps) {
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/kraken/ohlc?pair=${encodeURIComponent(krakenPair)}&timeframe=${encodeURIComponent(
            timeframe
          )}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch chart data');
        }

        const formattedData: OHLCVData[] = data.data.map((candle: any) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChartData();
  }, [krakenPair, timeframe]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return <CandlestickChart data={chartData} height={400} showVolume={true} />;
}
