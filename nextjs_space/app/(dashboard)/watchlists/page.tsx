
// app/(dashboard)/watchlists/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getWatchlists } from '@/actions/watchlist-actions';
import { WatchlistGrid } from '@/components/watchlist/watchlist-grid';

export default async function WatchlistsPage() {
  const result = await getWatchlists();
  const watchlists = result.success ? result.data || [] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watchlists"
        description="Manage your cryptocurrency trading pair watchlists."
      >
        <Button asChild>
          <Link href="/watchlists/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Watchlist
          </Link>
        </Button>
      </PageHeader>

      <WatchlistGrid watchlists={watchlists} />
    </div>
  );
}
