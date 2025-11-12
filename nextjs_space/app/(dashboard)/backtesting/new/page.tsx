'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createBacktest, runBacktest } from '@/actions/backtest-actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';
import { TIMEFRAMES } from '@/lib/constants/timeframes';

const STRATEGIES = [
  { value: 'rsi_oversold', label: 'RSI Oversold/Overbought' },
  { value: 'macd_crossover', label: 'MACD Crossover' },
  { value: 'bollinger_breakout', label: 'Bollinger Breakout' },
  { value: 'ema_crossover', label: 'EMA Crossover' },
  { value: 'trend_following', label: 'Trend Following' },
  { value: 'mean_reversion', label: 'Mean Reversion' },
];

export default function NewBacktestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['rsi_oversold']);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      description: '',
      timeframe: '1h',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      initialBalance: 10000,
      maxPositionSize: 10,
      stopLossPercent: 2,
      takeProfitPercent: 4,
      minConfidence: 70,
    },
  });

  const onSubmit = async (data: any) => {
    if (selectedStrategies.length === 0) {
      toast({ title: 'Error', description: 'Select at least one strategy', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createBacktest({
        ...data,
        pairs: ['XXBTZUSD', 'XETHZUSD'],
        strategies: selectedStrategies,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });

      if (result.success && result.data) {
        toast({ title: 'Success', description: 'Backtest created, running now...' });
        const runResult = await runBacktest(result.data.id);
        if (runResult.success) {
          router.push(`/backtesting/${result.data.id}`);
        } else {
          router.push('/backtesting');
        }
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create backtest', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create New Backtest" description="Configure your strategy backtest" />
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Backtest Name</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance ($)</Label>
              <Input id="initialBalance" type="number" {...register('initialBalance', { required: true, min: 100 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minConfidence">Min Confidence (0-100)</Label>
              <Input id="minConfidence" type="number" {...register('minConfidence', { required: true, min: 0, max: 100 })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate', { required: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Strategies</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {STRATEGIES.map((strategy) => (
                <div key={strategy.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={strategy.value}
                    checked={selectedStrategies.includes(strategy.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStrategies([...selectedStrategies, strategy.value]);
                      } else {
                        setSelectedStrategies(selectedStrategies.filter((s) => s !== strategy.value));
                      }
                    }}
                  />
                  <label htmlFor={strategy.value} className="text-sm cursor-pointer">
                    {strategy.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : 'Create & Run Backtest'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
