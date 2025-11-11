
import { SelectSignal } from '@/db/schema';
import { SignalCard } from './signal-card';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface SignalsGridProps {
  signals: SelectSignal[];
}

export function SignalsGrid({ signals }: SignalsGridProps) {
  if (signals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Signals</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Analyze your watchlist items to generate trading signals based on technical indicators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
