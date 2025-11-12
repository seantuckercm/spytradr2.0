
import React from 'react';
import { notFound } from 'next/navigation';
import { getSignal, closeSignal } from '@/actions/signal-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CandlestickChart, OHLCVData } from '@/components/charts/candlestick-chart';
import { ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Target, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface SignalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SignalDetailPage({ params }: SignalDetailPageProps) {
  const result = await getSignal(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const { signal, ohlcData } = result.data;

  // Convert OHLC data for chart
  const chartData: OHLCVData[] = (ohlcData || []).map((candle) => ({
    time: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));

  // Prepare chart markers (entry point)
  const markers = signal.createdAt
    ? [
        {
          time: Math.floor(signal.createdAt.getTime() / 1000),
          position: (signal.direction === 'buy' ? 'belowBar' : 'aboveBar') as 'belowBar' | 'aboveBar',
          color: signal.direction === 'buy' ? '#10b981' : '#ef4444',
          shape: (signal.direction === 'buy' ? 'arrowUp' : 'arrowDown') as 'arrowUp' | 'arrowDown',
          text: `Entry: ${signal.entryPrice}`,
        },
      ]
    : [];

  // Prepare price lines (stop loss, take profit)
  const priceLines = [];
  
  if (signal.stopLoss) {
    priceLines.push({
      price: parseFloat(signal.stopLoss),
      color: '#ef4444',
      lineWidth: 2,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: 'Stop Loss',
    });
  }

  if (signal.takeProfit) {
    priceLines.push({
      price: parseFloat(signal.takeProfit),
      color: '#10b981',
      lineWidth: 2,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: 'Take Profit',
    });
  }

  const isActive = signal.status === 'active';
  const directionIcon = signal.direction === 'buy' ? ArrowUp : ArrowDown;
  const directionColor = signal.direction === 'buy' ? 'text-green-500' : 'text-red-500';
  const directionBg = signal.direction === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${signal.altname || signal.krakenPair} Signal`}
        description={`${signal.direction.toUpperCase()} signal generated via ${signal.strategy} strategy`}
      >
        {isActive && (
          <form action={async () => {
            'use server';
            await closeSignal(signal.id);
          }}>
            <Button variant="outline" type="submit">
              Close Signal
            </Button>
          </form>
        )}
      </PageHeader>

      {/* Signal Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direction</CardTitle>
            {React.createElement(directionIcon, { className: `h-4 w-4 ${directionColor}` })}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${directionColor}`}>
              {signal.direction.toUpperCase()}
            </div>
            <Badge className={`mt-2 ${directionBg} ${directionColor} border-0`}>
              {signal.strategy}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signal.confidence}%</div>
            <Badge
              className="mt-2"
              variant={
                parseFloat(signal.confidence) >= 70
                  ? 'default'
                  : parseFloat(signal.confidence) >= 50
                    ? 'secondary'
                    : 'outline'
              }
            >
              {parseFloat(signal.confidence) >= 70
                ? 'High'
                : parseFloat(signal.confidence) >= 50
                  ? 'Medium'
                  : 'Low'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                signal.risk === 'high'
                  ? 'text-red-500'
                  : signal.risk === 'medium'
                    ? 'text-yellow-500'
                    : 'text-green-500'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{signal.risk}</div>
            <p className="text-xs text-muted-foreground mt-2">{signal.timeframe} timeframe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{signal.status}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {format(signal.createdAt, 'MMM d, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>
            Historical price action with entry, stop loss, and take profit levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CandlestickChart
            data={chartData}
            height={500}
            showVolume={true}
            markers={markers}
            priceLines={priceLines}
          />
        </CardContent>
      </Card>

      {/* Trade Levels */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Entry Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${signal.entryPrice}</div>
            <p className="text-sm text-muted-foreground mt-2">Recommended entry point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Stop Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              ${signal.stopLoss || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {signal.stopLoss &&
                `${(
                  ((parseFloat(signal.stopLoss) - parseFloat(signal.entryPrice)) /
                    parseFloat(signal.entryPrice)) *
                  100
                ).toFixed(2)}% from entry`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Take Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              ${signal.takeProfit || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {signal.takeProfit &&
                `${(
                  ((parseFloat(signal.takeProfit) - parseFloat(signal.entryPrice)) /
                    parseFloat(signal.entryPrice)) *
                  100
                ).toFixed(2)}% from entry`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Details */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Reasoning</h4>
            <p className="text-sm text-muted-foreground">{signal.reason || 'No reasoning provided'}</p>
          </div>

          {signal.indicators ? (
            <div>
              <h4 className="font-semibold mb-2">Technical Indicators</h4>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(signal.indicators, null, 2)}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
