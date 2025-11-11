
import { PageHeader } from '@/components/shared/page-header';
import { SignalsGrid } from '@/components/signals/signals-grid';
import { getUserSignals } from '@/actions/signal-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SignalsPage() {
  const result = await getUserSignals();
  const signals = result.success && result.data ? result.data : [];

  // Calculate statistics
  const buySignals = signals?.filter((s) => s.signal.direction === 'buy').length || 0;
  const sellSignals = signals?.filter((s) => s.signal.direction === 'sell').length || 0;
  const highConfidence = signals?.filter((s) => parseFloat(s.signal.confidence) >= 75).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trading Signals"
        description="Active signals generated from your watchlists based on technical analysis"
      />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals?.length || 0}</div>
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
      <SignalsGrid signals={signals?.map((s) => s.signal) || []} />

      {(signals?.length || 0) > 0 && (
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
