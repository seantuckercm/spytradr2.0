'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { getUserAgents } from '@/actions/agent-actions';
import { AgentGrid } from '@/components/agents/agent-grid';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Set up real-time subscription for agents and agent jobs
  const { isConnected } = useRealtimeSubscription({
    tables: ['scheduled_agents', 'scheduled_agent_jobs'],
    autoRevalidate: false,
    onEvent: (event) => {
      if (event.type === 'db_change') {
        // Show toast for agent job updates
        if (event.data?.table === 'scheduled_agent_jobs') {
          if (event.data.operation === 'INSERT') {
            toast({
              title: 'Agent Job Started',
              description: 'A scheduled agent has started running',
            });
          } else if (event.data.operation === 'UPDATE') {
            const job = event.data.data;
            if (job?.status === 'succeeded') {
              toast({
                title: 'Agent Job Completed',
                description: 'Scheduled agent completed successfully',
                variant: 'default',
              });
            } else if (job?.status === 'failed') {
              toast({
                title: 'Agent Job Failed',
                description: 'Scheduled agent run failed',
                variant: 'destructive',
              });
            }
          }
        }
        // Show toast for agent updates
        if (event.data?.table === 'scheduled_agents' && event.data.operation === 'INSERT') {
          toast({
            title: 'New Agent Created',
            description: 'A new scheduled agent has been created',
          });
        }
        // Refresh agents data
        loadAgents();
      }
    },
  });

  // Load agents data
  const loadAgents = async () => {
    try {
      const result = await getUserAgents();
      if (result.agents) {
        setAgents(result.agents);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PageHeader title="Scheduled Agents" description="Automate signal generation with scheduled agents" />
          <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      <AgentGrid agents={agents} />
    </div>
  );
}
