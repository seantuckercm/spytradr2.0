
'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

type AgentStatus = 'active' | 'paused' | 'running' | 'error';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  isActive?: boolean;
}

export function AgentStatusBadge({ status, isActive }: AgentStatusBadgeProps) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="gap-1">
        <Circle className="h-3 w-3" />
        Paused
      </Badge>
    );
  }

  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="default" className="gap-1 bg-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Circle className="h-3 w-3" />
          Unknown
        </Badge>
      );
  }
}
