
// lib/auth/tier-limits.ts
import { SelectProfile, DEFAULT_TIER_LIMITS } from '@/db/schema/profiles-schema';

export function canCreateWatchlist(profile: SelectProfile, currentCount: number): boolean {
  const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
  const maxWatchlists = limits?.maxWatchlists ?? 0;
  
  if (maxWatchlists === -1) return true; // unlimited
  return currentCount < maxWatchlists;
}

export function canAddWatchlistItem(profile: SelectProfile, currentCount: number): boolean {
  const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
  const maxItems = limits?.maxItemsPerWatchlist ?? 0;
  
  if (maxItems === -1) return true; // unlimited
  return currentCount < maxItems;
}

export function hasFeatureAccess(profile: SelectProfile, feature: string): boolean {
  const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
  return limits?.features?.[feature as keyof typeof limits.features] || false;
}

export function getTierDisplayName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'free': return 'text-gray-500';
    case 'basic': return 'text-blue-500';
    case 'pro': return 'text-purple-500';
    case 'enterprise': return 'text-gold-500';
    default: return 'text-gray-500';
  }
}
