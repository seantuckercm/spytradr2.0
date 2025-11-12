import { getBacktest } from '@/actions/backtest-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BacktestDetailPage({ params }: { params: { id: string } }) {
  const result = await getBacktest(params.id);
  
  if (!result.success || !result.data) {
    redirect('/backtesting');
  }

  const backtest = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={backtest.name}
        description={backtest.description || ''}
      >
        <Badge variant={backtest.status === 'completed' ? 'default' : backtest.status === 'running' ? 'secondary' : 'destructive'}>
          {backtest.status}
        </Badge>
      </PageHeader>

      {/* Results Summary */}
      {backtest.status === 'completed' && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Return</p>
              <p className={`text-2xl font-bold ${parseFloat(backtest.totalReturn || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(backtest.totalReturn || '0').toFixed(2)}%
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{parseFloat(backtest.winRate || '0').toFixed(1)}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{backtest.totalTrades}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
              <p className="text-2xl font-bold">{parseFloat(backtest.sharpeRatio || '0').toFixed(2)}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Initial Balance</p>
                <p className="text-lg font-semibold">${parseFloat(backtest.initialBalance).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Final Balance</p>
                <p className="text-lg font-semibold">${parseFloat(backtest.finalBalance || '0').toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <p className="text-lg font-semibold text-red-500">{parseFloat(backtest.maxDrawdown || '0').toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Winning Trades</p>
                <p className="text-lg font-semibold text-green-500">{backtest.winningTrades}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Losing Trades</p>
                <p className="text-lg font-semibold text-red-500">{backtest.losingTrades}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Factor</p>
                <p className="text-lg font-semibold">{parseFloat(backtest.profitFactor || '0').toFixed(2)}</p>
              </div>
            </div>
          </Card>

          {/* Recent Trades */}
          {backtest.trades && backtest.trades.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
              <div className="space-y-2">
                {backtest.trades.slice(0, 10).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {trade.isWin ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{trade.pair}</p>
                        <p className="text-sm text-muted-foreground capitalize">{trade.strategy.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${trade.isWin ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(trade.pnlPercent || '0').toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground">{trade.exitReason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {backtest.status === 'running' && (
        <Card className="p-12 text-center">
          <div className="animate-pulse">
            <p className="text-lg font-semibold">Backtest Running...</p>
            <p className="text-muted-foreground">This may take a few minutes</p>
          </div>
        </Card>
      )}

      {backtest.status === 'failed' && (
        <Card className="p-12 text-center">
          <p className="text-lg font-semibold text-red-500">Backtest Failed</p>
          <p className="text-muted-foreground">{backtest.error}</p>
        </Card>
      )}
    </div>
  );
}
