
// db/schema/profiles-schema.ts
import { pgTable, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { membershipEnum, paymentProviderEnum, accountStatusEnum } from "./enums";

export interface TierLimits {
  maxWatchlists: number;
  maxItemsPerWatchlist: number;
  maxAgents: number;
  maxSignalsPerDay: number;
  features: {
    realTimeSignals: boolean;
    advancedTA: boolean;
    emailNotifications: boolean;
    aiCopilot: boolean;
  };
}

export const DEFAULT_TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxWatchlists: 2,
    maxItemsPerWatchlist: 10,
    maxAgents: 1,
    maxSignalsPerDay: 10,
    features: {
      realTimeSignals: false,
      advancedTA: false,
      emailNotifications: false,
      aiCopilot: true,
    },
  },
  basic: {
    maxWatchlists: 5,
    maxItemsPerWatchlist: 25,
    maxAgents: 3,
    maxSignalsPerDay: 50,
    features: {
      realTimeSignals: true,
      advancedTA: true,
      emailNotifications: true,
      aiCopilot: true,
    },
  },
  pro: {
    maxWatchlists: 15,
    maxItemsPerWatchlist: 100,
    maxAgents: 10,
    maxSignalsPerDay: 500,
    features: {
      realTimeSignals: true,
      advancedTA: true,
      emailNotifications: true,
      aiCopilot: true,
    },
  },
  enterprise: {
    maxWatchlists: -1, // unlimited
    maxItemsPerWatchlist: -1,
    maxAgents: -1,
    maxSignalsPerDay: -1,
    features: {
      realTimeSignals: true,
      advancedTA: true,
      emailNotifications: true,
      aiCopilot: true,
    },
  },
};

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  email: text("email").notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  paymentProvider: paymentProviderEnum("payment_provider").default("whop"),
  
  // CRITICAL: Account status column
  status: accountStatusEnum("status").notNull().default("active"),
  
  // Payment provider IDs
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  whopUserId: text("whop_user_id"),
  whopMembershipId: text("whop_membership_id"),
  
  // Plan details
  planDuration: text("plan_duration"), // "monthly" or "yearly"
  
  // Billing cycle tracking
  billingCycleStart: timestamp("billing_cycle_start", { withTimezone: true }),
  billingCycleEnd: timestamp("billing_cycle_end", { withTimezone: true }),
  nextCreditRenewal: timestamp("next_credit_renewal", { withTimezone: true }),
  
  // Usage credits tracking
  usageCredits: integer("usage_credits").default(0),
  usedCredits: integer("used_credits").default(0),
  
  // Custom tier limits (overrides defaults if set)
  customLimits: jsonb("custom_limits").$type<Partial<TierLimits>>(),
  
  // User preferences
  preferences: jsonb("preferences").$type<{
    timezone?: string;
    emailNotifications?: boolean;
    theme?: "light" | "dark" | "system";
    defaultTimeframe?: string;
  }>().default(sql`'{}'::jsonb`),
  
  // Usage tracking for rate limiting
  lastApiCall: timestamp("last_api_call", { withTimezone: true }),
  apiCallsThisMinute: integer("api_calls_this_minute").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    .$onUpdate(() => new Date()),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}, (table) => ({
  emailIdx: index("profiles_email_idx").on(table.email),
  membershipIdx: index("profiles_membership_idx").on(table.membership),
  statusIdx: index("profiles_status_idx").on(table.status),
}));

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;
