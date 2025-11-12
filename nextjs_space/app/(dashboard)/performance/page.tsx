import { requireAuth } from '@/lib/auth/clerk';
import { getPerformanceSnapshots, getJournalEntries } from '@/actions/performance-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  await requireAuth();
  
  const snapshotsResult = await getPerformanceSnapshots('all_time');
  const journalResult = await getJournalEntries(10);
  
  const snapshots = snapshotsResult.data || [];
  const journal = journalResult.data || [];
  const latestSnapshot = snapshots[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics"
        description="Track your trading performance and analyze results"
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{latestSnapshot?.totalTrades || 0}</p>
            </div>
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{latestSnapshot?.winRate ? parseFloat(latestSnapshot.winRate).toFixed(1) : 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Winning Trades</p>
              <p className="text-2xl font-bold text-green-500">{latestSnapshot?.winningTrades || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Losing Trades</p>
              <p className="text-2xl font-bold text-red-500">{latestSnapshot?.losingTrades || 0}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Strategy Performance */}
      {latestSnapshot?.strategyPerformance && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Strategy Performance</h3>
          <div className="space-y-3">
            {Object.entries(latestSnapshot.strategyPerformance as Record<string, any>).map(([strategy, data]) => (
              <div key={strategy} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium capitalize">{strategy.replace(/_/g, ' ')}</span>
                <div className="flex gap-4 text-sm">
                  <span>Trades: {data.trades}</span>
                  <span className="text-green-500">Wins: {data.wins}</span>
                  <span className="text-red-500">Losses: {data.losses}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pair Performance */}
      {latestSnapshot?.pairPerformance && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pair Performance</h3>
          <div className="space-y-3">
            {Object.entries(latestSnapshot.pairPerformance as Record<string, any>).slice(0, 10).map(([pair, data]) => (
              <div key={pair} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{pair}</span>
                <div className="flex gap-4 text-sm">
                  <span>Trades: {data.trades}</span>
                  <span className="text-green-500">Wins: {data.wins}</span>
                  <span className="text-red-500">Losses: {data.losses}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trade Journal Preview */}
      {journal.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Journal Entries</h3>
          <div className="space-y-3">
            {journal.map((entry) => (
              <div key={entry.id} className="p-3 bg-muted rounded-lg">
                {entry.title && <p className="font-medium mb-1">{entry.title}</p>}
                {entry.rating && (
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: entry.rating }).map((_, i) => (
                      <span key={i} className="text-yellow-500">★</span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!latestSnapshot && (
        <Card className="p-12 text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-muted-foreground">
            Start trading and close some signals to see your performance metrics
          </p>
        </Card>
      )}
    </div>
  );
}
