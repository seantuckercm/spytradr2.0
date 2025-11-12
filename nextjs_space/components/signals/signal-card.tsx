
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, X, Clock, Target, Shield, BarChart3 } from 'lucide-react';
import { SelectSignal } from '@/db/schema';
import { closeSignal } from '@/actions/signal-actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import Link from 'next/link';

interface SignalCardProps {
  signal: SelectSignal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const isBuy = signal.direction === 'buy';
  const DirectionIcon = isBuy ? TrendingUp : TrendingDown;

  const handleClose = async () => {
    setIsClosing(true);
    try {
      const result = await closeSignal(signal.id);
      if (result.success) {
        toast({
          title: 'Signal Closed',
          description: result.message,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close signal',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
    }
  };

  const riskColor = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  }[signal.risk];

  const confidenceColor = 
    parseFloat(signal.confidence) >= 75 ? 'text-green-600' :
    parseFloat(signal.confidence) >= 50 ? 'text-yellow-600' :
    'text-orange-600';

  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBuy ? 'bg-green-100' : 'bg-red-100'}`}>
              <DirectionIcon className={`h-5 w-5 ${isBuy ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {signal.altname} <span className="text-muted-foreground text-sm">({signal.timeframe})</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {signal.strategy.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isClosing}
          >
            {isClosing ? <LoadingSpinner size="sm" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Direction and Confidence */}
          <div className="flex items-center justify-between">
            <Badge variant={isBuy ? 'default' : 'destructive'} className="text-sm font-medium">
              {isBuy ? 'BUY' : 'SELL'}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={riskColor}>
                {signal.risk.toUpperCase()} RISK
              </Badge>
              <span className={`text-sm font-semibold ${confidenceColor}`}>
                {parseFloat(signal.confidence).toFixed(0)}% confidence
              </span>
            </div>
          </div>

          {/* Price Levels */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>Entry</span>
              </div>
              <p className="text-sm font-mono font-semibold">
                ${parseFloat(signal.entryPrice).toFixed(2)}
              </p>
            </div>
            
            {signal.stopLoss && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Stop Loss</span>
                </div>
                <p className="text-sm font-mono font-semibold text-red-600">
                  ${parseFloat(signal.stopLoss).toFixed(2)}
                </p>
              </div>
            )}
            
            {signal.takeProfit && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Take Profit</span>
                </div>
                <p className="text-sm font-mono font-semibold text-green-600">
                  ${parseFloat(signal.takeProfit).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Reason */}
          {signal.reason && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">{signal.reason}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(signal.createdAt).toLocaleString()}
            </span>
          </div>

          {/* View Details Button */}
          <Link href={`/signals/${signal.id}`} className="block">
            <Button variant="outline" className="w-full" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Chart & Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
