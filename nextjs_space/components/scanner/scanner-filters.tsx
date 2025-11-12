
// components/scanner/scanner-filters.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import type { ScannerFilters } from '@/actions/scanner-actions';
import type { Timeframe } from '@/lib/validators/watchlist';

interface ScannerFiltersProps {
  filters: ScannerFilters;
  onFiltersChange: (filters: ScannerFilters) => void;
  onScan: () => void;
  isScanning: boolean;
  baseAssets?: string[];
  quoteAssets?: string[];
  strategies?: string[];
  timeframes?: Timeframe[];
}

export function ScannerFilters({
  filters,
  onFiltersChange,
  onScan,
  isScanning,
  baseAssets = [],
  quoteAssets = [],
  strategies = [],
  timeframes = []
}: ScannerFiltersProps) {
  const handleFilterChange = (key: keyof ScannerFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Direction Filter */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select
              value={filters.direction || 'all'}
              onValueChange={(value) => handleFilterChange('direction', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="buy">Buy Only</SelectItem>
                <SelectItem value="sell">Sell Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Filter */}
          <div className="space-y-2">
            <Label>Risk Level</Label>
            <Select
              value={filters.risk || 'all'}
              onValueChange={(value) => handleFilterChange('risk', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Filter */}
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select
              value={filters.timeframe || '1h'}
              onValueChange={(value) => handleFilterChange('timeframe', value as Timeframe)}
            >
              <SelectTrigger>
                <SelectValue placeholder="1 Hour" />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf === '1m' && '1 Minute'}
                    {tf === '5m' && '5 Minutes'}
                    {tf === '15m' && '15 Minutes'}
                    {tf === '1h' && '1 Hour'}
                    {tf === '4h' && '4 Hours'}
                    {tf === '1d' && '1 Day'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strategy Filter */}
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select
              value={filters.strategy || 'all'}
              onValueChange={(value) => handleFilterChange('strategy', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {strategies.map((strat) => (
                  <SelectItem key={strat} value={strat}>
                    {strat.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Base Asset Filter */}
          <div className="space-y-2">
            <Label>Base Asset</Label>
            <Select
              value={filters.baseAsset || 'all'}
              onValueChange={(value) => handleFilterChange('baseAsset', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Assets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {baseAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quote Asset Filter */}
          <div className="space-y-2">
            <Label>Quote Asset</Label>
            <Select
              value={filters.quoteAsset || 'all'}
              onValueChange={(value) => handleFilterChange('quoteAsset', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Quotes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quotes</SelectItem>
                {quoteAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min Confidence */}
          <div className="space-y-2 md:col-span-2">
            <Label>Minimum Confidence: {filters.minConfidence || 60}%</Label>
            <Slider
              value={[filters.minConfidence || 60]}
              onValueChange={([value]) => handleFilterChange('minConfidence', value)}
              min={50}
              max={95}
              step={5}
              className="py-2"
            />
          </div>
        </div>

        {/* Scan Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onScan}
            disabled={isScanning}
            size="lg"
            className="min-w-[200px]"
          >
            {isScanning ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Scanning Market...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Scan Market
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
