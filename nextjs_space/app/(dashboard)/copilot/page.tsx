
import { PageHeader } from '@/components/shared/page-header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { requireAuth } from '@/lib/auth/clerk';

export const dynamic = 'force-dynamic';

export default async function CopilotPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Trading Copilot"
        description="Your intelligent assistant for achieving trading goals and managing the platform"
      />
      <ChatInterface />
    </div>
  );
}
