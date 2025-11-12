'use client';

import { PageHeader } from '@/components/shared/page-header';
import { SignalsGrid } from '@/components/signals/signals-grid';
import { getUserSignals } from '@/actions/signal-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Set up real-time subscription for signals table
  const { isConnected, lastEvent } = useRealtimeSubscription({
    tables: ['signals'],
    autoRevalidate: false, // We'll handle updates manually for better UX
    onEvent: (event) => {
      if (event.type === 'db_change' && event.data?.table === 'signals') {
        // Show toast notification for new signals
        if (event.data.operation === 'INSERT') {
          toast({
            title: 'New Signal Generated',
            description: `A new ${event.data.data?.direction} signal was generated for ${event.data.data?.altname || 'a trading pair'}`,
          });
        }
        // Refresh signals data
        loadSignals();
      }
    },
  });

  // Load signals data
  const loadSignals = async () => {
    try {
      const result = await getUserSignals();
      if (result.success && result.data) {
        setSignals(result.data.map((s) => s.signal));
      }
    } catch (error) {
      console.error('Error loading signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSignals();
  }, []);

  // Calculate statistics
  const buySignals = signals.filter((s) => s.direction === 'buy').length;
  const sellSignals = signals.filter((s) => s.direction === 'sell').length;
  const highConfidence = signals.filter((s) => parseFloat(s.confidence) >= 75).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Trading Signals"
          description="Active signals generated from your watchlists based on technical analysis"
        />
        <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              Live Updates
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Offline
            </>
          )}
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
            <p className="text-xs text-muted-foreground">
              {highConfidence} high confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buy Signals</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{buySignals}</div>
            <p className="text-xs text-muted-foreground">
              Long opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell Signals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sellSignals}</div>
            <p className="text-xs text-muted-foreground">
              Short opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Signals Grid */}
      <SignalsGrid signals={signals} />

      {signals.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Important Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              These signals are generated automatically based on technical analysis and should not be considered 
              financial advice. Always conduct your own research and consider your risk tolerance before making 
              any trading decisions. Past performance does not guarantee future results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
