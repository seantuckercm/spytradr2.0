
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AgentStatusBadge } from './agent-status-badge';
import { Clock, MoreVertical, Play, Pause, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { SelectScheduledAgent } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { toggleAgentActiveAction, deleteAgentAction } from '@/actions/agent-actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AgentCardProps {
  agent: SelectScheduledAgent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();

  const handleToggle = async () => {
    const result = await toggleAgentActiveAction(agent.id, !agent.isActive);
    if (result.success) {
      toast({
        title: agent.isActive ? 'Agent Paused' : 'Agent Activated',
        description: `${agent.name} is now ${agent.isActive ? 'paused' : 'active'}.`,
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to toggle agent',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"?`)) return;

    const result = await deleteAgentAction(agent.id);
    if (result.success) {
      toast({
        title: 'Agent Deleted',
        description: `${agent.name} has been deleted.`,
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete agent',
        variant: 'destructive',
      });
    }
  };

  const intervalText = {
    1: '1 minute',
    5: '5 minutes',
    15: '15 minutes',
    30: '30 minutes',
    60: '1 hour',
    240: '4 hours',
    1440: '1 day',
  }[agent.intervalMinutes] || `${agent.intervalMinutes} minutes`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              {agent.name}
              <AgentStatusBadge status={agent.isActive ? 'active' : 'paused'} isActive={agent.isActive} />
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              Runs every {intervalText}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggle}>
                {agent.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {agent.pairs.slice(0, 3).map((pair) => (
              <Badge key={pair} variant="secondary">
                {pair}
              </Badge>
            ))}
            {agent.pairs.length > 3 && (
              <Badge variant="outline">+{agent.pairs.length - 3} more</Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Last run:{' '}
              {agent.lastRunAt
                ? formatDistanceToNow(new Date(agent.lastRunAt), { addSuffix: true })
                : 'Never'}
            </span>
            {agent.nextRunAt && agent.isActive && (
              <span>
                Next: {formatDistanceToNow(new Date(agent.nextRunAt), { addSuffix: true })}
              </span>
            )}
          </div>

          <Link href={`/agents/${agent.id}`}>
            <Button variant="outline" className="w-full" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
