
'use client';

import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { runAgentNowAction } from '@/actions/agent-actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface RunAgentButtonProps {
  agentId: string;
}

export function RunAgentButton({ agentId }: RunAgentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await runAgentNowAction(agentId);
      if (result.success) {
        toast({
          title: 'Agent Started',
          description: 'The agent has been queued to run immediately.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to start agent',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleRun} disabled={loading}>
      {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
      Run Now
    </Button>
  );
}
