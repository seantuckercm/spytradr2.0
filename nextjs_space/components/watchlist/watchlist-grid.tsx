
// components/watchlist/watchlist-grid.tsx
import { WatchlistCard } from './watchlist-card';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WatchlistGridProps {
  watchlists: any[]; // Type will be properly typed based on schema
}

export function WatchlistGrid({ watchlists }: WatchlistGridProps) {
  if (watchlists.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Eye className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No watchlists yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Create your first watchlist to start tracking cryptocurrency trading pairs and generating signals.
          </p>
          <Button asChild>
            <Link href="/watchlists/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Watchlist
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {watchlists.map((watchlist) => (
        <WatchlistCard key={watchlist.id} watchlist={watchlist} />
      ))}
    </div>
  );
}
