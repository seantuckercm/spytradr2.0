
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scheduledAgentsTable, scheduledAgentJobsTable } from '@/db/schema';
import { and, eq, lte, sql } from 'drizzle-orm';

function verifyCronAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Select due agents
  const dueAgents = await db
    .select()
    .from(scheduledAgentsTable)
    .where(and(eq(scheduledAgentsTable.isActive, true), lte(scheduledAgentsTable.nextRunAt, now)));

  let enqueued = 0;
  for (const agent of dueAgents) {
    // Check for existing pending/running job
    const existing = await db.execute(sql`
      select 1 from scheduled_agent_jobs
      where agent_id = ${agent.id}
        and status in ('pending','running')
      limit 1
    `);

    const rows = existing as any;
    if (rows.length > 0) continue;

    await db.insert(scheduledAgentJobsTable).values({
      agentId: agent.id,
      status: 'pending',
      scheduledFor: now,
      runContext: { trigger: 'schedule' } as any,
    });
    enqueued++;
  }

  return NextResponse.json({ enqueued });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
