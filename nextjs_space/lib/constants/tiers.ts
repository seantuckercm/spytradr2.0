
// lib/constants/tiers.ts
export const TIER_NAMES = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
} as const;

export const TIER_COLORS = {
  free: 'text-gray-500',
  basic: 'text-blue-500', 
  pro: 'text-purple-500',
  enterprise: 'text-yellow-500',
} as const;

export type TierType = keyof typeof TIER_NAMES;
