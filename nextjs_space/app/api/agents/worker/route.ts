
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  scheduledAgentsTable,
  scheduledAgentJobsTable,
  scheduledAgentLogsTable,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { runAgentJob } from '@/lib/agents/processor';

function verifyCronAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const maxJobs = Number(searchParams.get('limit') ?? '5');

  // Claim jobs using SKIP LOCKED pattern
  const pendingJobs = await db.execute(sql`
    update scheduled_agent_jobs j
    set status = 'running', started_at = now(), attempts = attempts + 1, updated_at = now()
    where j.id in (
      select id from scheduled_agent_jobs
      where status = 'pending' and scheduled_for <= now()
      order by scheduled_for asc
      limit ${maxJobs}
      for update skip locked
    )
    returning j.*
  `);

  const jobs = (pendingJobs as any) ?? [];

  // Process jobs sequentially for simplicity (can be parallelized with p-limit if needed)
  for (const job of jobs) {
    try {
      await runAgentJob(job);
    } catch (err: any) {
      // Log error
      await db.insert(scheduledAgentLogsTable).values({
        agentId: job.agent_id,
        jobId: job.id,
        level: 'error',
        message: 'Job failed with unhandled error',
        context: { error: err?.message } as any,
      });

      // Get agent for retry logic
      const [agent] = await db
        .select()
        .from(scheduledAgentsTable)
        .where(eq(scheduledAgentsTable.id, job.agent_id));

      const attempts = job.attempts ?? 1;
      const maxAttempts = agent?.maxAttempts ?? 3;

      if (attempts < maxAttempts) {
        // Exponential backoff
        const backoffMs = Math.min(60_000, Math.pow(2, attempts) * 1000);
        const nextTime = new Date(Date.now() + backoffMs);

        await db
          .update(scheduledAgentJobsTable)
          .set({
            status: 'pending',
            finishedAt: null,
            scheduledFor: nextTime,
            updatedAt: new Date(),
          })
          .where(eq(scheduledAgentJobsTable.id, job.id));
      } else {
        await db
          .update(scheduledAgentJobsTable)
          .set({
            status: 'failed',
            finishedAt: new Date(),
            error: err?.message ?? 'Unknown error',
            updatedAt: new Date(),
          })
          .where(eq(scheduledAgentJobsTable.id, job.id));
      }
    }
  }

  return NextResponse.json({ processed: jobs.length });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
