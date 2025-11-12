
// components/scanner/opportunity-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Shield, Clock, BarChart3, Plus } from 'lucide-react';
import type { ScannerOpportunity } from '@/actions/scanner-actions';
import { cn } from '@/lib/utils';
import { WatchlistItemChart } from '@/components/watchlist/watchlist-item-chart';
import { getWatchlists } from '@/actions/watchlist-actions';
import { addWatchlistItem } from '@/actions/watchlist-actions';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useRouter } from 'next/navigation';

interface OpportunityCardProps {
  opportunity: ScannerOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [showChart, setShowChart] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [isLoadingWatchlists, setIsLoadingWatchlists] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const isBuy = opportunity.direction === 'buy';

  // Fetch watchlists when add dialog opens
  useEffect(() => {
    if (showAddDialog) {
      fetchWatchlists();
    }
  }, [showAddDialog]);

  const fetchWatchlists = async () => {
    setIsLoadingWatchlists(true);
    try {
      const result = await getWatchlists();
      if (result.success && result.data) {
        setWatchlists(result.data);
        if (result.data.length > 0) {
          setSelectedWatchlistId(result.data[0].id);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load watchlists',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingWatchlists(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!selectedWatchlistId) {
      toast({
        title: 'Error',
        description: 'Please select a watchlist',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      const result = await addWatchlistItem({
        watchlistId: selectedWatchlistId,
        inputSymbol: opportunity.altname || opportunity.pair,
        timeframes: [opportunity.timeframe],
        strategies: [opportunity.strategy],
        confidenceThreshold: Math.round(opportunity.confidence),
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Added ${opportunity.altname} to watchlist`,
        });
        setShowAddDialog(false);
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add to watchlist',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">
              {opportunity.altname}
            </CardTitle>
            <Badge
              variant={isBuy ? 'default' : 'destructive'}
              className={cn('flex items-center gap-1', isBuy ? 'bg-green-600' : 'bg-red-600')}
            >
              {isBuy ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {opportunity.direction.toUpperCase()}
            </Badge>
          </div>
          <Badge variant="outline" className={cn('border', getRiskColor(opportunity.risk))}>
            <Shield className="h-3 w-3 mr-1" />
            {opportunity.risk.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{opportunity.base}/{opportunity.quote}</span>
          <span>•</span>
          <span className="capitalize">{opportunity.strategy.replace(/_/g, ' ')}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {opportunity.timeframe}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence & Profit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    opportunity.confidence >= 80 ? 'bg-green-500' :
                    opportunity.confidence >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${opportunity.confidence}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{opportunity.confidence}%</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Potential Profit</div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-green-500">
                +{opportunity.potentialProfit.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Entry</div>
            <div className="text-sm font-semibold">
              ${opportunity.entryPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
            <div className="text-sm font-semibold text-red-500">
              ${opportunity.stopLoss.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Take Profit</div>
            <div className="text-sm font-semibold text-green-500">
              ${opportunity.takeProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Analysis</div>
          <p className="text-sm text-foreground/80 line-clamp-2">
            {opportunity.reason}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Watchlist
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setShowChart(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Chart
          </Button>
        </div>
      </CardContent>

      {/* Chart Dialog */}
      <Dialog open={showChart} onOpenChange={setShowChart}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {opportunity.altname} - {opportunity.direction.toUpperCase()} Signal
            </DialogTitle>
            <DialogDescription>
              {opportunity.strategy.replace(/_/g, ' ')} strategy on {opportunity.timeframe} timeframe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Price Levels Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                <div className="text-lg font-bold">${opportunity.entryPrice.toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
                <div className="text-lg font-bold text-red-500">
                  ${opportunity.stopLoss.toFixed(2)}
                </div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Take Profit</div>
                <div className="text-lg font-bold text-green-500">
                  ${opportunity.takeProfit.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Chart */}
            <WatchlistItemChart
              krakenPair={opportunity.pair}
              timeframe={opportunity.timeframe}
            />

            {/* Analysis */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Analysis</h4>
              <p className="text-sm text-muted-foreground">{opportunity.reason}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Watchlist Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {opportunity.altname} to Watchlist</DialogTitle>
            <DialogDescription>
              Select a watchlist to track this trading opportunity
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLoadingWatchlists ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : watchlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No watchlists found. Create one first!</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    router.push('/watchlists/new');
                  }}
                >
                  Create Watchlist
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Watchlist</label>
                  <Select
                    value={selectedWatchlistId}
                    onValueChange={setSelectedWatchlistId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a watchlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {watchlists.map((watchlist) => (
                        <SelectItem key={watchlist.id} value={watchlist.id}>
                          {watchlist.name}
                          {watchlist.items?.length > 0 && (
                            <span className="text-muted-foreground ml-2">
                              ({watchlist.items.length} pairs)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">This will add:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Pair: {opportunity.altname}</li>
                    <li>Timeframe: {opportunity.timeframe}</li>
                    <li>Strategy: {opportunity.strategy.replace(/_/g, ' ')}</li>
                    <li>Confidence Threshold: {Math.round(opportunity.confidence)}%</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddDialog(false)}
                    disabled={isAdding}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAddToWatchlist}
                    disabled={isAdding || !selectedWatchlistId}
                  >
                    {isAdding ? <LoadingSpinner size="sm" /> : 'Add to Watchlist'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
