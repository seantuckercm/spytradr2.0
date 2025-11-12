
import { notFound } from 'next/navigation'
import { getWatchlist } from '@/actions/watchlist-actions'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { WatchlistItemForm } from '@/components/watchlist/watchlist-item-form'
import { WatchlistItemsList } from '@/components/watchlist/watchlist-items-list'
import { AnalyzeButton } from '@/components/signals/analyze-button'

export const dynamic = 'force-dynamic'

interface WatchlistDetailPageProps {
  params: {
    id: string
  }
}

export default async function WatchlistDetailPage({ params }: WatchlistDetailPageProps) {
  const result = await getWatchlist(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const watchlist = result.data
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={watchlist.name}
        description={watchlist.description || undefined}
      >
        <div className="flex items-center gap-2">
          <AnalyzeButton watchlistId={watchlist.id} />
        </div>
      </PageHeader>
      
      {/* Watchlist Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Watchlist Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={watchlist.isActive ? 'default' : 'secondary'} className="mt-1">
                {watchlist.isActive ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pairs Tracked</p>
              <p className="text-2xl font-bold mt-1">{watchlist.items?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence Threshold</p>
              <p className="text-2xl font-bold mt-1">{watchlist.defaultConfidenceThreshold}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-medium mt-1">
                {new Date(watchlist.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Trading Pair</CardTitle>
          <CardDescription>
            Add a new cryptocurrency trading pair to this watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WatchlistItemForm watchlistId={watchlist.id} />
        </CardContent>
      </Card>
      
      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Pairs ({watchlist.items?.length || 0})</CardTitle>
          <CardDescription>
            Manage the trading pairs in this watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WatchlistItemsList 
            items={watchlist.items || []} 
            watchlistId={watchlist.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
