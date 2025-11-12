
import { SelectScheduledAgent } from '@/db/schema';
import { AgentCard } from './agent-card';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AgentGridProps {
  agents: SelectScheduledAgent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bot className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Create your first scheduled agent to automate signal generation for your favorite trading
            pairs.
          </p>
          <Link href="/agents/new">
            <Button>Create Your First Agent</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
