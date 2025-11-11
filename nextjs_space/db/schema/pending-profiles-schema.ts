
// db/schema/pending-profiles-schema.ts
import { pgTable, text, timestamp, integer, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { membershipEnum, paymentProviderEnum } from "./enums";

export const pendingProfilesTable = pgTable("pending_profiles", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
  token: text("token"),
  
  // Payment details
  membership: membershipEnum("membership").notNull().default("pro"),
  paymentProvider: paymentProviderEnum("payment_provider").default("whop"),
  
  // Whop specific fields
  whopUserId: text("whop_user_id"),
  whopMembershipId: text("whop_membership_id"),
  
  // Plan details
  planDuration: text("plan_duration"),
  billingCycleStart: timestamp("billing_cycle_start", { withTimezone: true }),
  billingCycleEnd: timestamp("billing_cycle_end", { withTimezone: true }),
  
  // Credits
  usageCredits: integer("usage_credits").default(0),
  usedCredits: integer("used_credits").default(0),
  
  // Claiming status
  claimed: boolean("claimed").default(false),
  claimedByUserId: text("claimed_by_user_id"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  emailUq: uniqueIndex("pending_profiles_email_uq").on(table.email),
  claimedIdx: index("pending_profiles_claimed_idx").on(table.claimed),
}));

export type InsertPendingProfile = typeof pendingProfilesTable.$inferInsert;
export type SelectPendingProfile = typeof pendingProfilesTable.$inferSelect;
