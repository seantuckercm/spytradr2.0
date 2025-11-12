
'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/db';
import {
  scheduledAgentsTable,
  scheduledAgentJobsTable,
  scheduledAgentLogsTable,
} from '@/db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const AgentInput = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  intervalMinutes: z
    .enum(['1', '5', '15', '30', '60', '240', '1440'])
    .transform((v) => parseInt(v, 10)),
  pairs: z.array(z.string()).min(1, 'At least one trading pair is required'),
  strategies: z
    .array(
      z.object({
        id: z.string(),
        params: z.record(z.string(), z.any()).optional(),
      })
    )
    .min(1, 'At least one strategy is required'),
  minConfidence: z.number().min(0).max(100).default(60),
  timezone: z.string().default('UTC'),
  concurrency: z.number().min(1).max(5).default(1),
  maxRuntimeSeconds: z.number().min(10).max(300).default(60),
  maxAttempts: z.number().min(1).max(10).default(3),
});

export async function createAgentAction(input: z.infer<typeof AgentInput>) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const data = AgentInput.parse(input);

    const now = new Date();
    const nextRun = new Date(now.getTime() + data.intervalMinutes * 60_000);

    const [agent] = await db
      .insert(scheduledAgentsTable)
      .values({
        userId,
        name: data.name,
        isActive: true,
        intervalMinutes: data.intervalMinutes,
        pairs: data.pairs,
        strategies: data.strategies as any,
        minConfidence: data.minConfidence,
        timezone: data.timezone,
        concurrency: data.concurrency,
        maxRuntimeSeconds: data.maxRuntimeSeconds,
        maxAttempts: data.maxAttempts,
        lastRunAt: null,
        nextRunAt: nextRun,
      })
      .returning();

    revalidatePath('/agents');
    return { success: true, agent };
  } catch (error: any) {
    console.error('Create agent error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create agent',
    };
  }
}

export async function updateAgentAction(
  agentId: string,
  input: Partial<z.infer<typeof AgentInput>>
) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch to ensure ownership
    const [agent] = await db
      .select()
      .from(scheduledAgentsTable)
      .where(and(eq(scheduledAgentsTable.id, agentId), eq(scheduledAgentsTable.userId, userId)));

    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Only allow certain fields
    const parsed = AgentInput.partial().parse(input);

    // If interval changed, update nextRunAt to now + new interval
    const patch: any = { ...parsed, updatedAt: new Date() };
    if (parsed.intervalMinutes) {
      patch.nextRunAt = new Date(Date.now() + parsed.intervalMinutes * 60_000);
    }

    const [updated] = await db
      .update(scheduledAgentsTable)
      .set(patch)
      .where(eq(scheduledAgentsTable.id, agentId))
      .returning();

    revalidatePath('/agents');
    return { success: true, agent: updated };
  } catch (error: any) {
    console.error('Update agent error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update agent',
    };
  }
}

export async function toggleAgentActiveAction(agentId: string, isActive: boolean) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const now = new Date();
    const [agent] = await db
      .update(scheduledAgentsTable)
      .set({
        isActive,
        nextRunAt: isActive ? new Date(now.getTime() + 60_000) : null,
        updatedAt: now,
      })
      .where(and(eq(scheduledAgentsTable.id, agentId), eq(scheduledAgentsTable.userId, userId)))
      .returning();

    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    revalidatePath('/agents');
    return { success: true, agent };
  } catch (error: any) {
    console.error('Toggle agent error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to toggle agent',
    };
  }
}

export async function deleteAgentAction(agentId: string) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [agent] = await db
      .select()
      .from(scheduledAgentsTable)
      .where(and(eq(scheduledAgentsTable.id, agentId), eq(scheduledAgentsTable.userId, userId)));

    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    await db.delete(scheduledAgentsTable).where(eq(scheduledAgentsTable.id, agentId));

    revalidatePath('/agents');
    return { success: true };
  } catch (error: any) {
    console.error('Delete agent error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to delete agent',
    };
  }
}

export async function runAgentNowAction(agentId: string) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Ensure ownership
    const [agent] = await db
      .select()
      .from(scheduledAgentsTable)
      .where(and(eq(scheduledAgentsTable.id, agentId), eq(scheduledAgentsTable.userId, userId)));

    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Ensure no running/pending job exists
    const existing = await db
      .select()
      .from(scheduledAgentJobsTable)
      .where(
        and(
          eq(scheduledAgentJobsTable.agentId, agentId),
          inArray(scheduledAgentJobsTable.status, ['pending', 'running'])
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: 'A job is already running or pending for this agent',
      };
    }

    await db.insert(scheduledAgentJobsTable).values({
      agentId,
      status: 'pending',
      scheduledFor: new Date(),
      runContext: { trigger: 'manual' } as any,
    });

    revalidatePath(`/agents/${agentId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Run agent now error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to start agent',
    };
  }
}

export async function getUserAgents() {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized', agents: [] };
    }

    const agents = await db
      .select()
      .from(scheduledAgentsTable)
      .where(eq(scheduledAgentsTable.userId, userId))
      .orderBy(desc(scheduledAgentsTable.createdAt));

    return { success: true, agents };
  } catch (error: any) {
    console.error('Get user agents error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch agents',
      agents: [],
    };
  }
}

export async function getAgent(agentId: string) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized', agent: null };
    }

    const [agent] = await db
      .select()
      .from(scheduledAgentsTable)
      .where(and(eq(scheduledAgentsTable.id, agentId), eq(scheduledAgentsTable.userId, userId)))
      .limit(1);

    if (!agent) {
      return { success: false, error: 'Agent not found', agent: null };
    }

    // Fetch recent jobs
    const jobs = await db
      .select()
      .from(scheduledAgentJobsTable)
      .where(eq(scheduledAgentJobsTable.agentId, agentId))
      .orderBy(desc(scheduledAgentJobsTable.createdAt))
      .limit(10);

    // Fetch recent logs
    const logs = await db
      .select()
      .from(scheduledAgentLogsTable)
      .where(eq(scheduledAgentLogsTable.agentId, agentId))
      .orderBy(desc(scheduledAgentLogsTable.createdAt))
      .limit(50);

    return { success: true, agent, jobs, logs };
  } catch (error: any) {
    console.error('Get agent error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch agent',
      agent: null,
    };
  }
}
