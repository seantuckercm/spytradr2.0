
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAgentAction } from '@/actions/agent-actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

const agentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  intervalMinutes: z.enum(['1', '5', '15', '30', '60', '240', '1440']),
  pairs: z.string().min(1, 'At least one trading pair is required'),
  strategies: z.string().min(1, 'At least one strategy is required'),
  minConfidence: z.number().min(0).max(100),
});

type AgentFormData = z.infer<typeof agentSchema>;

const AVAILABLE_STRATEGIES = [
  { id: 'rsi_divergence', name: 'RSI Divergence' },
  { id: 'macd_crossover', name: 'MACD Crossover' },
  { id: 'bollinger_breakout', name: 'Bollinger Breakout' },
  { id: 'ema_crossover', name: 'EMA Crossover' },
  { id: 'trend_following', name: 'Trend Following' },
  { id: 'mean_reversion', name: 'Mean Reversion' },
];

export function AgentForm() {
  const router = useRouter();
  const { showTip } = useTeacherMode();
  const [loading, setLoading] = useState(false);
  const [pairInput, setPairInput] = useState('');
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(60);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      minConfidence: 60,
      intervalMinutes: '60',
    },
  });

  const addPair = () => {
    if (pairInput.trim() && !pairs.includes(pairInput.trim().toUpperCase())) {
      const newPairs = [...pairs, pairInput.trim().toUpperCase()];
      setPairs(newPairs);
      setValue('pairs', newPairs.join(','));
      setPairInput('');
    }
  };

  const removePair = (pairToRemove: string) => {
    const newPairs = pairs.filter((p) => p !== pairToRemove);
    setPairs(newPairs);
    setValue('pairs', newPairs.join(','));
  };

  const toggleStrategy = (strategyId: string) => {
    const newStrategies = selectedStrategies.includes(strategyId)
      ? selectedStrategies.filter((s) => s !== strategyId)
      : [...selectedStrategies, strategyId];
    setSelectedStrategies(newStrategies);
    setValue('strategies', newStrategies.join(','));
  };

  const onSubmit = async (data: AgentFormData) => {
    setLoading(true);
    try {
      const pairsArray = data.pairs.split(',').filter((p) => p.trim());
      const strategiesArray = data.strategies.split(',').map((s) => ({
        id: s.trim(),
        params: {},
      }));

      const result = await createAgentAction({
        name: data.name,
        intervalMinutes: data.intervalMinutes as any,
        pairs: pairsArray,
        strategies: strategiesArray,
        minConfidence: minConfidence,
        timezone: 'UTC',
        concurrency: 1,
        maxRuntimeSeconds: 60,
        maxAttempts: 3,
      });

      if (result.success) {
        toast({
          title: 'Agent Created',
          description: `${data.name} has been created and is now active.`,
        });
        
        // Show teacher tips for agent creation
        showTip('first_agent_created');
        showTip('agent_running');
        
        router.push('/agents');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create agent',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Name your agent and set the scan interval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., BTC/ETH RSI Scanner"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="intervalMinutes">Scan Interval</Label>
            <Select
              onValueChange={(value) => setValue('intervalMinutes', value as any)}
              defaultValue="60"
              disabled={loading}
            >
              <SelectTrigger id="intervalMinutes">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Every 1 minute</SelectItem>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every 1 hour</SelectItem>
                <SelectItem value="240">Every 4 hours</SelectItem>
                <SelectItem value="1440">Every 24 hours</SelectItem>
              </SelectContent>
            </Select>
            {errors.intervalMinutes && (
              <p className="text-sm text-destructive">{errors.intervalMinutes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Pairs</CardTitle>
          <CardDescription>Add the pairs you want to monitor (e.g., BTC/USD, ETH/USD)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter pair (e.g., BTC/USD)"
              value={pairInput}
              onChange={(e) => setPairInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPair();
                }
              }}
              disabled={loading}
            />
            <Button type="button" onClick={addPair} disabled={loading}>
              Add
            </Button>
          </div>

          {pairs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pairs.map((pair) => (
                <div
                  key={pair}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                >
                  <span>{pair}</span>
                  <button
                    type="button"
                    onClick={() => removePair(pair)}
                    className="hover:text-destructive"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.pairs && <p className="text-sm text-destructive">{errors.pairs.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strategies</CardTitle>
          <CardDescription>Select the trading strategies to apply</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_STRATEGIES.map((strategy) => (
              <button
                key={strategy.id}
                type="button"
                onClick={() => toggleStrategy(strategy.id)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedStrategies.includes(strategy.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                disabled={loading}
              >
                <div className="font-medium">{strategy.name}</div>
              </button>
            ))}
          </div>

          {errors.strategies && (
            <p className="text-sm text-destructive">{errors.strategies.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signal Confidence</CardTitle>
          <CardDescription>
            Minimum confidence level for signals (0-100%). Signals below this threshold will be
            discarded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Minimum Confidence</Label>
              <span className="text-sm font-medium">{minConfidence}%</span>
            </div>
            <Slider
              value={[minConfidence]}
              onValueChange={(value) => {
                setMinConfidence(value[0]);
                setValue('minConfidence', value[0]);
              }}
              min={0}
              max={100}
              step={5}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || pairs.length === 0 || selectedStrategies.length === 0}>
          {loading && <LoadingSpinner size="sm" className="mr-2" />}
          Create Agent
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
