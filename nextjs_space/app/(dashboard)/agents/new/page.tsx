
import { PageHeader } from '@/components/shared/page-header';
import { AgentForm } from '@/components/agents/agent-form';

export default function NewAgentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Agent"
        description="Set up a scheduled agent to automatically scan markets and generate signals"
      />

      <AgentForm />
    </div>
  );
}
