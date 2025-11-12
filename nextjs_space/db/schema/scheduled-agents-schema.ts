
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

export const agentJobStatusEnum = pgEnum('agent_job_status', [
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);

export const logLevelEnum = pgEnum('log_level', ['debug', 'info', 'warn', 'error']);

export const scheduledAgentsTable = pgTable(
  'scheduled_agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 256 }).notNull(), // Clerk user id
    name: text('name').notNull(),
    isActive: boolean('is_active').notNull().default(true),

    // Minute-based intervals: 1,5,15,30,60,240,1440, etc.
    intervalMinutes: integer('interval_minutes').notNull(),

    // e.g., ["BTC/USD","ETH/USD"] Kraken pair symbols
    pairs: text('pairs').array().notNull(),

    // JSON array of strategies with params
    strategies: jsonb('strategies').notNull(),

    // Signals below this confidence are discarded (0-100 percent)
    minConfidence: integer('min_confidence').default(60),

    // Operational
    concurrency: integer('concurrency').notNull().default(1),
    maxRuntimeSeconds: integer('max_runtime_seconds').notNull().default(60),
    maxAttempts: integer('max_attempts').notNull().default(3),

    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdx: index('scheduled_agents_user_idx').on(table.userId),
      activeNextRunIdx: index('scheduled_agents_active_nextrun_idx').on(
        table.isActive,
        table.nextRunAt
      ),
    };
  }
);

export const scheduledAgentJobsTable = pgTable(
  'scheduled_agent_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => scheduledAgentsTable.id, { onDelete: 'cascade' }),
    status: agentJobStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),

    // When this job should run (for scheduling/backoff)
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),

    // Context may include subset pairs or strategy overrides for this run
    runContext: jsonb('run_context'),

    error: text('error'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      agentIdx: index('scheduled_agent_jobs_agent_idx').on(table.agentId),
      statusSchedIdx: index('scheduled_agent_jobs_status_sched_idx').on(
        table.status,
        table.scheduledFor
      ),
    };
  }
);

export const scheduledAgentLogsTable = pgTable(
  'scheduled_agent_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => scheduledAgentsTable.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id').references(() => scheduledAgentJobsTable.id, { onDelete: 'set null' }),
    level: logLevelEnum('level').notNull().default('info'),
    message: text('message').notNull(),
    context: jsonb('context'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      agentLogIdx: index('scheduled_agent_logs_agent_idx').on(table.agentId),
      jobLogIdx: index('scheduled_agent_logs_job_idx').on(table.jobId),
    };
  }
);

// Types
export type InsertScheduledAgent = typeof scheduledAgentsTable.$inferInsert;
export type SelectScheduledAgent = typeof scheduledAgentsTable.$inferSelect;

export type InsertScheduledAgentJob = typeof scheduledAgentJobsTable.$inferInsert;
export type SelectScheduledAgentJob = typeof scheduledAgentJobsTable.$inferSelect;

export type InsertScheduledAgentLog = typeof scheduledAgentLogsTable.$inferInsert;
export type SelectScheduledAgentLog = typeof scheduledAgentLogsTable.$inferSelect;
