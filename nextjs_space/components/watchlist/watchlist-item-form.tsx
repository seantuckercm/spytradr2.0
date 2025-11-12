
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { addWatchlistItem } from '@/actions/watchlist-actions'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { addWatchlistItemSchema } from '@/lib/validators/watchlist'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import { STRATEGIES } from '@/lib/constants/strategies'
import { Checkbox } from '@/components/ui/checkbox'

interface WatchlistItemFormProps {
  watchlistId: string
}

type FormValues = z.infer<typeof addWatchlistItemSchema>

export function WatchlistItemForm({ watchlistId }: WatchlistItemFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(addWatchlistItemSchema),
    defaultValues: {
      watchlistId,
      inputSymbol: '',
      timeframes: ['1h', '4h', '1d'],
      strategies: ['rsi-oversold', 'macd-crossover'],
      confidenceThreshold: 70,
    },
  })
  
  const confidenceThreshold = watch('confidenceThreshold')
  const selectedTimeframes = watch('timeframes') || []
  const selectedStrategies = watch('strategies') || []
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const result = await addWatchlistItem(data)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Trading pair added to watchlist',
        })
        reset()
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add trading pair',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="inputSymbol">Trading Pair Symbol</Label>
        <Input
          id="inputSymbol"
          placeholder="e.g., BTC/USD, ETH/USD, XBTUSD"
          {...register('inputSymbol')}
          disabled={isLoading}
        />
        {errors.inputSymbol && (
          <p className="text-sm text-destructive">{errors.inputSymbol.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Enter a Kraken trading pair symbol (e.g., BTC/USD, XBTUSD, ETHUSD)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Timeframes</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TIMEFRAMES.map((timeframe) => (
            <div key={timeframe.value} className="flex items-center space-x-2">
              <Checkbox
                id={`timeframe-${timeframe.value}`}
                checked={selectedTimeframes.includes(timeframe.value)}
                onCheckedChange={(checked) => {
                  const newTimeframes = checked
                    ? [...selectedTimeframes, timeframe.value]
                    : selectedTimeframes.filter((t) => t !== timeframe.value)
                  setValue('timeframes', newTimeframes)
                }}
                disabled={isLoading}
              />
              <label
                htmlFor={`timeframe-${timeframe.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {timeframe.label}
              </label>
            </div>
          ))}
        </div>
        {errors.timeframes && (
          <p className="text-sm text-destructive">{errors.timeframes.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Trading Strategies</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STRATEGIES.map((strategy) => (
            <div key={strategy.value} className="flex items-center space-x-2">
              <Checkbox
                id={`strategy-${strategy.value}`}
                checked={selectedStrategies.includes(strategy.value)}
                onCheckedChange={(checked) => {
                  const newStrategies = checked
                    ? [...selectedStrategies, strategy.value]
                    : selectedStrategies.filter((s) => s !== strategy.value)
                  setValue('strategies', newStrategies)
                }}
                disabled={isLoading}
              />
              <label
                htmlFor={`strategy-${strategy.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {strategy.label}
              </label>
            </div>
          ))}
        </div>
        {errors.strategies && (
          <p className="text-sm text-destructive">{errors.strategies.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confidenceThreshold">
          Confidence Threshold: {confidenceThreshold || 70}%
        </Label>
        <Slider
          id="confidenceThreshold"
          min={0}
          max={100}
          step={5}
          value={[confidenceThreshold || 70]}
          onValueChange={(value) => setValue('confidenceThreshold', value[0])}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Minimum confidence level required to generate signals for this pair
        </p>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Adding...
          </>
        ) : (
          'Add Trading Pair'
        )}
      </Button>
    </form>
  )
}
