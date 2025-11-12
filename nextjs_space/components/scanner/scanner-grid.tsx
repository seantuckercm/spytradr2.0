
// components/scanner/scanner-grid.tsx
'use client';

import { OpportunityCard } from './opportunity-card';
import { Card, CardContent } from '@/components/ui/card';
import { Scan } from 'lucide-react';
import type { ScannerOpportunity } from '@/actions/scanner-actions';

interface ScannerGridProps {
  opportunities: ScannerOpportunity[];
  isScanning?: boolean;
  totalScanned?: number;
  totalOpportunities?: number;
}

export function ScannerGrid({
  opportunities,
  isScanning,
  totalScanned,
  totalOpportunities
}: ScannerGridProps) {
  if (isScanning) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Scan className="h-16 w-16 text-muted-foreground animate-pulse mb-4" />
          <h3 className="text-lg font-semibold mb-2">Scanning Market</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Analyzing trading pairs across multiple strategies and timeframes...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Scan className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Try adjusting your filters or lowering the minimum confidence threshold to discover more trading opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {typeof totalScanned === 'number' && typeof totalOpportunities === 'number' && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Scanned <span className="font-semibold text-foreground">{totalScanned}</span> pairs
              </span>
              <span className="text-muted-foreground">
                Found <span className="font-semibold text-green-500">{totalOpportunities}</span> opportunities
              </span>
              <span className="text-muted-foreground">
                Showing top <span className="font-semibold text-foreground">{opportunities.length}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {opportunities.map((opportunity, index) => (
          <OpportunityCard
            key={`${opportunity.pair}-${opportunity.strategy}-${index}`}
            opportunity={opportunity}
          />
        ))}
      </div>
    </div>
  );
}
