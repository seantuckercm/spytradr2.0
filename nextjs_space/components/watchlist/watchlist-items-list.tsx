
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, TrendingUp } from 'lucide-react'
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
import { AnalyzeButton } from '@/components/signals/analyze-button'

interface WatchlistItemsListProps {
  items: SelectWatchlistItem[]
  watchlistId: string
}

export function WatchlistItemsList({ items, watchlistId }: WatchlistItemsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  
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
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
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
      ))}
    </div>
  )
}
