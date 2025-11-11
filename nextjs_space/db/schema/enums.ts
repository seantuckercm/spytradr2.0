
// db/schema/enums.ts
import { pgEnum } from "drizzle-orm/pg-core";

// User & Account Enums
export const membershipEnum = pgEnum("membership", ["free", "basic", "pro", "enterprise"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "whop"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "inactive", "suspended", "cancelled"]);

// Trading Enums
export const timeframeEnum = pgEnum("timeframe", ["1m","5m","15m","1h","4h","1d","1w","1M"]);
export const directionEnum = pgEnum("direction_enum", ["buy", "sell"]);
export const riskEnum = pgEnum("risk_enum", ["low", "medium", "high"]);
export const signalStatusEnum = pgEnum("signal_status_enum", ["active","closed","expired"]);

// Exchange Enums
export const exchangeEnum = pgEnum("exchange", ["kraken"]);
export const pairStatusEnum = pgEnum("pair_status", ["active", "inactive", "delisted"]);
