
'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { analyzeWatchlistItem, analyzeWatchlist } from '@/actions/signal-actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

interface AnalyzeButtonProps {
  watchlistId?: string;
  watchlistItemId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function AnalyzeButton({
  watchlistId,
  watchlistItemId,
  variant = 'default',
  size = 'default',
  className,
}: AnalyzeButtonProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showTip } = useTeacherMode();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Show analysis tip
    showTip('first_analysis_run');
    
    try {
      let result;
      
      if (watchlistItemId) {
        result = await analyzeWatchlistItem(watchlistItemId);
      } else if (watchlistId) {
        result = await analyzeWatchlist(watchlistId);
      } else {
        toast({
          title: 'Error',
          description: 'No watchlist or item specified',
          variant: 'destructive',
        });
        return;
      }

      if (result.success && result.data) {
        const signalsCount = watchlistItemId 
          ? (result.data as any).signalsGenerated || 0
          : (result.data as any).results?.reduce((sum: number, r: any) => sum + (r.result.data?.signalsGenerated || 0), 0) || 0;

        toast({
          title: 'Analysis Complete',
          description: signalsCount > 0 
            ? `Generated ${signalsCount} signal${signalsCount !== 1 ? 's' : ''}`
            : 'No new signals generated',
        });
        
        // Show signal generation tip if signals were created
        if (signalsCount > 0) {
          showTip('first_signal_generated');
        }
        
        router.refresh();
      } else {
        toast({
          title: 'Analysis Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      className={className}
    >
      {isAnalyzing ? (
        <LoadingSpinner size="sm" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {isAnalyzing ? 'Analyzing...' : 'Analyze'}
    </Button>
  );
}
