
// app/(dashboard)/watchlists/new/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { WatchlistForm } from '@/components/watchlist/watchlist-form';

export default function NewWatchlistPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Watchlist"
        description="Set up a new watchlist to track cryptocurrency trading pairs."
      />

      <WatchlistForm />
    </div>
  );
}
