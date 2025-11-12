
// components/scanner/opportunity-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Shield, Clock } from 'lucide-react';
import type { ScannerOpportunity } from '@/actions/scanner-actions';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: ScannerOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const isBuy = opportunity.direction === 'buy';

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
          <Button size="sm" className="flex-1">
            Add to Watchlist
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            View Chart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
