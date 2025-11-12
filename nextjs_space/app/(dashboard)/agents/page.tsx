
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getUserAgents } from '@/actions/agent-actions';
import { AgentGrid } from '@/components/agents/agent-grid';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const { agents } = await getUserAgents();

  return (
    <div className="space-y-6">
      <PageHeader title="Scheduled Agents" description="Automate signal generation with scheduled agents">
        <Link href="/agents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </PageHeader>

      <AgentGrid agents={agents} />
    </div>
  );
}
