
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  ColorType,
  LineWidth,
  LineStyle,
} from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface OHLCVData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: OHLCVData[];
  height?: number;
  showVolume?: boolean;
  markers?: Array<{
    time: number;
    position: 'aboveBar' | 'belowBar' | 'inBar';
    color: string;
    shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
    text: string;
  }>;
  priceLines?: Array<{
    price: number;
    color: string;
    lineWidth: number;
    lineStyle: number;
    axisLabelVisible: boolean;
    title: string;
  }>;
  className?: string;
}

export function CandlestickChart({
  data,
  height = 400,
  showVolume = true,
  markers = [],
  priceLines = [],
  className = '',
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#d1d5db',
        },
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        width: chartContainerRef.current.clientWidth,
        height,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#4b5563',
        },
        rightPriceScale: {
          borderColor: '#4b5563',
        },
        crosshair: {
          mode: 1,
        },
      });

      chartRef.current = chart;

      // Add candlestick series - cast to any for v5 API compatibility
      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      candlestickSeriesRef.current = candlestickSeries;

      // Convert data to Lightweight Charts format
      const chartData: CandlestickData[] = data.map((d) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      candlestickSeries.setData(chartData);

      // Add volume series if requested
      if (showVolume && data.some((d) => d.volume !== undefined)) {
        const volumeSeries = (chart as any).addHistogramSeries({
          color: '#374151',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
        });

        volumeSeriesRef.current = volumeSeries;

        const volumeData = data
          .filter((d) => d.volume !== undefined)
          .map((d) => ({
            time: d.time as Time,
            value: d.volume!,
            color: d.close >= d.open ? '#10b98180' : '#ef444480',
          }));

        volumeSeries.setData(volumeData);
      }

      // Add markers (e.g., entry/exit points)
      if (markers.length > 0) {
        const formattedMarkers = markers.map((m) => ({
          time: m.time as Time,
          position: m.position,
          color: m.color,
          shape: m.shape,
          text: m.text,
        }));
        (candlestickSeries as any).setMarkers(formattedMarkers);
      }

      // Add price lines (e.g., stop loss, take profit)
      if (priceLines.length > 0) {
        priceLines.forEach((line) => {
          (candlestickSeries as any).createPriceLine({
            price: line.price,
            color: line.color,
            lineWidth: line.lineWidth as LineWidth,
            lineStyle: line.lineStyle as LineStyle,
            axisLabelVisible: line.axisLabelVisible,
            title: line.title,
          });
        });
      }

      // Fit content
      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      setIsLoading(false);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error creating chart:', err);
      setError('Failed to load chart. Please try again.');
      setIsLoading(false);
    }
  }, [data, height, showVolume, markers, priceLines]);

  if (isLoading) {
    return (
      <Card className={`p-8 flex items-center justify-center ${className}`}>
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={`p-8 flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No chart data available</p>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div ref={chartContainerRef} style={{ width: '100%', height: `${height}px` }} />
    </Card>
  );
}
