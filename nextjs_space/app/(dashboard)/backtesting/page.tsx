import { getUserBacktests } from '@/actions/backtest-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BacktestingPage() {
  const result = await getUserBacktests();
  const backtests = result.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategy Backtesting"
        description="Test your trading strategies against historical data"
      >
        <Button asChild>
          <Link href="/backtesting/new">
            <Plus className="h-4 w-4 mr-2" />
            New Backtest
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Backtests</p>
              <p className="text-2xl font-bold">{backtests.length}</p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {backtests.filter((b) => b.status === 'completed').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Running</p>
              <p className="text-2xl font-bold">
                {backtests.filter((b) => b.status === 'running').length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-500 animate-pulse" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">
                {backtests.filter((b) => b.status === 'failed').length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Backtests List */}
      {backtests.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Backtests Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first backtest to validate your trading strategies
          </p>
          <Button asChild>
            <Link href="/backtesting/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Backtest
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {backtests.map((backtest) => (
            <Card key={backtest.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{backtest.name}</h3>
                  <p className="text-sm text-muted-foreground">{backtest.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>Pairs: {(backtest.pairs as string[]).length}</span>
                    <span>Strategies: {(backtest.strategies as string[]).length}</span>
                    <span>Timeframe: {backtest.timeframe}</span>
                  </div>
                  {backtest.status === 'completed' && (
                    <div className="flex gap-4 text-sm mt-2">
                      <span className={parseFloat(backtest.totalReturn || '0') >= 0 ? 'text-green-500' : 'text-red-500'}>
                        Return: {backtest.totalReturn}%
                      </span>
                      <span>Win Rate: {backtest.winRate}%</span>
                      <span>Trades: {backtest.totalTrades}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/backtesting/${backtest.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
