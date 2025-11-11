
// app/(dashboard)/dashboard/page.tsx
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Plus, TrendingUp, Users, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth/clerk';
import { getWatchlists } from '@/actions/watchlist-actions';
import { DEFAULT_TIER_LIMITS } from '@/db/schema/profiles-schema';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const watchlistsResult = await getWatchlists();
  const watchlists = watchlistsResult.success ? watchlistsResult.data || [] : [];
  
  const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
  const totalPairs = watchlists?.reduce((sum, wl) => sum + wl.items.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back!`}
        description="Here's what's happening with your trading signals today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Watchlists"
          value={watchlists.length}
          description={`${limits.maxWatchlists === -1 ? 'Unlimited' : limits.maxWatchlists} allowed`}
          icon={Eye}
        />
        <StatsCard
          title="Pairs Tracked"
          value={totalPairs}
          description="Across all watchlists"
          icon={TrendingUp}
        />
        <StatsCard
          title="Plan Tier"
          value={profile.membership.charAt(0).toUpperCase() + profile.membership.slice(1)}
          description="Current subscription"
          icon={Crown}
        />
        <StatsCard
          title="Active Signals"
          value="0"
          description="Coming in Phase 2"
          icon={Zap}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your trading signals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/watchlists/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Watchlist
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/watchlists">
                <Eye className="mr-2 h-4 w-4" />
                View All Watchlists
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Plan</CardTitle>
            <CardDescription>
              {profile.membership.charAt(0).toUpperCase() + profile.membership.slice(1)} plan features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Watchlists:</span>
                <span>{limits?.maxWatchlists === -1 ? 'Unlimited' : `${watchlists.length}/${limits?.maxWatchlists ?? 0}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Items per list:</span>
                <span>{limits?.maxItemsPerWatchlist === -1 ? 'Unlimited' : `Up to ${limits?.maxItemsPerWatchlist ?? 0}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Real-time signals:</span>
                <span>{limits?.features?.realTimeSignals ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Copilot:</span>
                <span>{limits?.features?.aiCopilot ? 'Yes' : 'No'}</span>
              </div>
            </div>
            {profile.membership === 'free' && (
              <Button variant="outline" className="w-full mt-4">
                Upgrade Plan
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Watchlists */}
      {watchlists && watchlists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Watchlists</CardTitle>
            <CardDescription>Your most recently updated watchlists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {watchlists?.slice(0, 5).map((watchlist) => (
                <div key={watchlist.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{watchlist.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {watchlist.items.length} pairs • 
                      Updated {new Date(watchlist.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/watchlists/${watchlist.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
