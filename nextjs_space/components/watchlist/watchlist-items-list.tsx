
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, TrendingUp, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
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

interface WatchlistItemsListProps {
  items: SelectWatchlistItem[]
  watchlistId: string
}

export function WatchlistItemsList({ items, watchlistId }: WatchlistItemsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { toast } = useToast()

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
                  </div>
                  
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
