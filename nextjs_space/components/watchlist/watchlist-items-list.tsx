
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, TrendingUp, ChevronDown, ChevronUp, BarChart3, TrendingDown, Activity } from 'lucide-react'
import { deleteWatchlistItem } from '@/actions/watchlist-actions'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import type { SelectWatchlistItem } from '@/db/schema/watchlists-schema'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AnalyzeButton } from '@/components/signals/analyze-button'
import { WatchlistItemChart } from './watchlist-item-chart'
import { useKrakenWebSocket } from '@/hooks/use-kraken-websocket'

interface WatchlistItemsListProps {
  items: SelectWatchlistItem[]
  watchlistId: string
}

export function WatchlistItemsList({ items, watchlistId }: WatchlistItemsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { toast } = useToast()

  // Extract pairs for WebSocket subscription
  const pairs = useMemo(() => items.map(item => item.krakenPair), [items])

  // Connect to WebSocket for real-time price updates
  const { tickerData, isConnected } = useKrakenWebSocket({
    pairs,
    channel: 'ticker',
    autoConnect: true,
  })

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }
  
  const handleDelete = async (itemId: string, altname: string) => {
    setDeletingId(itemId)
    try {
      const result = await deleteWatchlistItem({ id: itemId })
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Removed ${altname} from watchlist`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove trading pair',
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
      setDeletingId(null)
    }
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No trading pairs yet</p>
        <p className="text-sm">Add your first trading pair above to get started</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isExpanded = expandedItems.has(item.id)
        const primaryTimeframe = item.timeframes?.[0] || '1h'
        const ticker = tickerData.get(item.krakenPair)
        
        // Calculate 24h price change percentage
        let priceChange = 0
        let priceChangePercent = 0
        if (ticker && ticker.open && ticker.close) {
          priceChange = ticker.close - ticker.open
          priceChangePercent = (priceChange / ticker.open) * 100
        }
        
        return (
          <Collapsible
            key={item.id}
            open={isExpanded}
            onOpenChange={() => toggleItem(item.id)}
          >
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg">{item.altname}</h4>
                    <Badge variant={item.enabled ? 'default' : 'secondary'}>
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {isConnected && (
                      <Badge variant="outline" className="gap-1">
                        <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                  
                  {/* Live Price Display */}
                  {ticker && (
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <div className="text-2xl font-bold">
                          ${ticker.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bid: ${ticker.bid.toFixed(2)} | Ask: ${ticker.ask.toFixed(2)}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 ${priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceChangePercent >= 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                        <div className="text-lg font-semibold">
                          {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>24h Vol: {ticker.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div>24h Range: ${ticker.low.toFixed(2)} - ${ticker.high.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Timeframes:</span>{' '}
                      {item.timeframes?.join(', ') || 'None'}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Strategies:</span>{' '}
                      {item.strategies?.join(', ') || 'None'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Confidence Threshold:</span>{' '}
                    {item.confidenceThreshold}%
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Chart
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <AnalyzeButton watchlistItemId={item.id} />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Trading Pair</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove <strong>{item.altname}</strong> from this watchlist?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id, item.altname)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <CollapsibleContent>
                <div className="border-t p-4 bg-muted/30">
                  <WatchlistItemChart
                    krakenPair={item.krakenPair}
                    timeframe={primaryTimeframe}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}
