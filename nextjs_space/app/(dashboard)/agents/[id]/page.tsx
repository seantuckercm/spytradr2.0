
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAgent } from '@/actions/agent-actions';
import { AgentStatusBadge } from '@/components/agents/agent-status-badge';
import { PlayCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { RunAgentButton } from '@/components/agents/run-agent-button';

export const dynamic = 'force-dynamic';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  const { agent, jobs, logs } = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const intervalText = {
    1: '1 minute',
    5: '5 minutes',
    15: '15 minutes',
    30: '30 minutes',
    60: '1 hour',
    240: '4 hours',
    1440: '1 day',
  }[agent.intervalMinutes] || `${agent.intervalMinutes} minutes`;

  const lastJob = jobs && jobs[0];

  return (
    <div className="space-y-6">
      <PageHeader title={agent.name} description={`Agent runs every ${intervalText}`}>
        <RunAgentButton agentId={agent.id} />
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <AgentStatusBadge status={agent.isActive ? 'active' : 'paused'} isActive={agent.isActive} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interval</span>
              <span className="text-sm font-medium">{intervalText}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Run</span>
              <span className="text-sm font-medium">
                {agent.lastRunAt ? format(new Date(agent.lastRunAt), 'PPp') : 'Never'}
              </span>
            </div>

            {agent.nextRunAt && agent.isActive && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next Run</span>
                <span className="text-sm font-medium">{format(new Date(agent.nextRunAt), 'PPp')}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Min Confidence</span>
              <span className="text-sm font-medium">{agent.minConfidence}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Trading Pairs ({agent.pairs.length})</span>
              <div className="flex flex-wrap gap-1">
                {agent.pairs.map((pair) => (
                  <Badge key={pair} variant="secondary">
                    {pair}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">
                Strategies ({(agent.strategies as any[]).length})
              </span>
              <div className="flex flex-wrap gap-1">
                {((agent.strategies as any[]) || []).map((strategy: any) => (
                  <Badge key={strategy.id} variant="outline">
                    {strategy.id}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Last 10 job executions</CardDescription>
        </CardHeader>
        <CardContent>
          {!jobs || jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No jobs yet</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        job.status === 'succeeded'
                          ? 'default'
                          : job.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {job.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(job.createdAt), 'PPp')}
                    </span>
                  </div>
                  {job.error && (
                    <span className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {job.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>Recent activity logs</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No logs yet</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-1 text-sm font-mono">
                  <span className="text-muted-foreground">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                  <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'} className="uppercase">
                    {log.level}
                  </Badge>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
