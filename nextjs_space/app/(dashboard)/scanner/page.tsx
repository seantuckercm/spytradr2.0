// app/(dashboard)/scanner/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ScannerFilters } from '@/components/scanner/scanner-filters';
import { ScannerGrid } from '@/components/scanner/scanner-grid';
import { scanMarket, getScannerFilterOptions } from '@/actions/scanner-actions';
import type { ScannerFilters as ScannerFiltersType, ScannerOpportunity } from '@/actions/scanner-actions';
import type { Timeframe } from '@/lib/validators/watchlist';
import { useToast } from '@/hooks/use-toast';

export default function ScannerPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<ScannerOpportunity[]>([]);
  const [totalScanned, setTotalScanned] = useState<number>(0);
  const [totalOpportunities, setTotalOpportunities] = useState<number>(0);
  const [filters, setFilters] = useState<ScannerFiltersType>({
    minConfidence: 60,
    direction: 'all',
    risk: 'all',
    timeframe: '1h' as Timeframe,
    limit: 20
  });

  const [filterOptions, setFilterOptions] = useState<{
    baseAssets: string[];
    quoteAssets: string[];
    strategies: string[];
    timeframes: Timeframe[];
  }>({
    baseAssets: [],
    quoteAssets: [],
    strategies: [],
    timeframes: []
  });

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const result = await getScannerFilterOptions();
      if (result.success && 'baseAssets' in result && 'quoteAssets' in result) {
        setFilterOptions({
          baseAssets: result.baseAssets as string[],
          quoteAssets: result.quoteAssets as string[],
          strategies: result.strategies as string[],
          timeframes: result.timeframes as Timeframe[]
        });
      }
    };
    loadFilterOptions();
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await scanMarket(filters);
      
      if (result.success) {
        setOpportunities(result.opportunities || []);
        setTotalScanned(result.totalScanned || 0);
        setTotalOpportunities(result.totalOpportunities || 0);
        
        toast({
          title: 'Market scan complete',
          description: `Found ${result.totalOpportunities || 0} opportunities across ${result.totalScanned || 0} pairs`,
        });
      } else {
        toast({
          title: 'Scan failed',
          description: result.error || 'Failed to scan market',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Scan failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Scanner"
        description="Discover trading opportunities across all Kraken pairs in real-time"
      />

      <ScannerFilters
        filters={filters}
        onFiltersChange={setFilters}
        onScan={handleScan}
        isScanning={isScanning}
        baseAssets={filterOptions.baseAssets}
        quoteAssets={filterOptions.quoteAssets}
        strategies={filterOptions.strategies}
        timeframes={filterOptions.timeframes}
      />

      <ScannerGrid
        opportunities={opportunities}
        isScanning={isScanning}
        totalScanned={totalScanned}
        totalOpportunities={totalOpportunities}
      />
    </div>
  );
}
