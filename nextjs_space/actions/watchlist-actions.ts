
// actions/watchlist-actions.ts
'use server';

import { db } from '@/db';
import { watchlistsTable, watchlistItemsTable } from '@/db/schema/watchlists-schema';
import { profilesTable } from '@/db/schema/profiles-schema';
import { eq, and, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/clerk';
import { revalidatePath } from 'next/cache';
import { 
  createWatchlistSchema, 
  updateWatchlistSchema, 
  addWatchlistItemSchema,
  updateWatchlistItemSchema,
  deleteWatchlistSchema,
  deleteWatchlistItemSchema 
} from '@/lib/validators/watchlist';
import { validateKrakenPair } from '@/lib/api/kraken';
import { canCreateWatchlist, canAddWatchlistItem } from '@/lib/auth/tier-limits';
import { DEFAULT_TIER_LIMITS } from '@/db/schema/profiles-schema';

export async function createWatchlist(input: unknown) {
  try {
    const userId = await requireAuth();
    const validated = createWatchlistSchema.parse(input);
    
    // Get profile and check limits
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    
    // Count existing watchlists
    const [result] = await db
      .select({ count: count() })
      .from(watchlistsTable)
      .where(eq(watchlistsTable.ownerId, userId));
    
    const currentCount = result?.count || 0;
    
    if (!canCreateWatchlist(profile, currentCount)) {
      const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
      return { 
        success: false, 
        error: `Watchlist limit reached. Your plan allows ${limits.maxWatchlists} watchlists.` 
      };
    }
    
    // Create watchlist
    const [watchlist] = await db
      .insert(watchlistsTable)
      .values({
        ownerId: userId,
        name: validated.name,
        description: validated.description,
        defaultConfidenceThreshold: validated.defaultConfidenceThreshold,
      })
      .returning();
    
    revalidatePath('/watchlists');
    
    return { success: true, data: watchlist };
  } catch (error: any) {
    console.error('Failed to create watchlist:', error);
    
    if (error.code === '23505') { // unique constraint violation
      return { success: false, error: 'A watchlist with this name already exists' };
    }
    
    return { success: false, error: error.message || 'Failed to create watchlist' };
  }
}

export async function updateWatchlist(id: string, input: unknown) {
  try {
    const userId = await requireAuth();
    const validated = updateWatchlistSchema.parse(input);
    
    // Verify ownership
    const [watchlist] = await db
      .select()
      .from(watchlistsTable)
      .where(and(
        eq(watchlistsTable.id, id),
        eq(watchlistsTable.ownerId, userId)
      ))
      .limit(1);
    
    if (!watchlist) {
      return { success: false, error: 'Watchlist not found' };
    }
    
    // Update watchlist
    const [updated] = await db
      .update(watchlistsTable)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(watchlistsTable.id, id))
      .returning();
    
    revalidatePath('/watchlists');
    revalidatePath(`/watchlists/${id}`);
    
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Failed to update watchlist:', error);
    return { success: false, error: error.message || 'Failed to update watchlist' };
  }
}

export async function deleteWatchlist(input: unknown) {
  try {
    const userId = await requireAuth();
    const { watchlistId } = deleteWatchlistSchema.parse(input);
    
    // Verify ownership
    const [watchlist] = await db
      .select()
      .from(watchlistsTable)
      .where(and(
        eq(watchlistsTable.id, watchlistId),
        eq(watchlistsTable.ownerId, userId)
      ))
      .limit(1);
    
    if (!watchlist) {
      return { success: false, error: 'Watchlist not found' };
    }
    
    // Delete watchlist (cascade will delete items)
    await db
      .delete(watchlistsTable)
      .where(eq(watchlistsTable.id, watchlistId));
    
    revalidatePath('/watchlists');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete watchlist:', error);
    return { success: false, error: error.message || 'Failed to delete watchlist' };
  }
}

export async function addWatchlistItem(input: unknown) {
  try {
    const userId = await requireAuth();
    const validated = addWatchlistItemSchema.parse(input);
    
    // Verify watchlist ownership
    const [watchlist] = await db
      .select()
      .from(watchlistsTable)
      .where(and(
        eq(watchlistsTable.id, validated.watchlistId),
        eq(watchlistsTable.ownerId, userId)
      ))
      .limit(1);
    
    if (!watchlist) {
      return { success: false, error: 'Watchlist not found' };
    }
    
    // Get profile and check limits
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    
    // Count existing items
    const [result] = await db
      .select({ count: count() })
      .from(watchlistItemsTable)
      .where(eq(watchlistItemsTable.watchlistId, validated.watchlistId));
    
    const currentCount = result?.count || 0;
    
    if (!canAddWatchlistItem(profile, currentCount)) {
      const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
      return { 
        success: false, 
        error: `Item limit reached. Your plan allows ${limits.maxItemsPerWatchlist} items per watchlist.` 
      };
    }
    
    // Validate Kraken pair
    const pairValidation = await validateKrakenPair(validated.inputSymbol);
    
    if (!pairValidation.success) {
      return { success: false, error: pairValidation.error || 'Invalid trading pair' };
    }
    
    const { krakenPair, altname } = pairValidation.data!;
    
    // Add item
    const [item] = await db
      .insert(watchlistItemsTable)
      .values({
        watchlistId: validated.watchlistId,
        krakenPair,
        altname,
        timeframes: validated.timeframes,
        strategies: validated.strategies,
        confidenceThreshold: validated.confidenceThreshold,
      })
      .returning();
    
    revalidatePath(`/watchlists/${validated.watchlistId}`);
    
    return { success: true, data: item };
  } catch (error: any) {
    console.error('Failed to add watchlist item:', error);
    
    if (error.code === '23505') {
      return { success: false, error: 'This pair is already in the watchlist' };
    }
    
    return { success: false, error: error.message || 'Failed to add item' };
  }
}

export async function updateWatchlistItem(input: unknown) {
  try {
    const userId = await requireAuth();
    const validated = updateWatchlistItemSchema.parse(input);
    
    // Verify item ownership via watchlist
    const [item] = await db
      .select({
        item: watchlistItemsTable,
        watchlist: watchlistsTable,
      })
      .from(watchlistItemsTable)
      .innerJoin(
        watchlistsTable,
        eq(watchlistItemsTable.watchlistId, watchlistsTable.id)
      )
      .where(and(
        eq(watchlistItemsTable.id, validated.itemId),
        eq(watchlistsTable.ownerId, userId)
      ))
      .limit(1);
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    // Update item
    const [updated] = await db
      .update(watchlistItemsTable)
      .set({
        enabled: validated.enabled,
        timeframes: validated.timeframes,
        strategies: validated.strategies,
        confidenceThreshold: validated.confidenceThreshold,
        updatedAt: new Date(),
      })
      .where(eq(watchlistItemsTable.id, validated.itemId))
      .returning();
    
    revalidatePath(`/watchlists/${item.watchlist.id}`);
    
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Failed to update watchlist item:', error);
    return { success: false, error: error.message || 'Failed to update item' };
  }
}

export async function deleteWatchlistItem(input: unknown) {
  try {
    const userId = await requireAuth();
    const { itemId } = deleteWatchlistItemSchema.parse(input);
    
    // Verify item ownership via watchlist
    const [item] = await db
      .select({
        item: watchlistItemsTable,
        watchlist: watchlistsTable,
      })
      .from(watchlistItemsTable)
      .innerJoin(
        watchlistsTable,
        eq(watchlistItemsTable.watchlistId, watchlistsTable.id)
      )
      .where(and(
        eq(watchlistItemsTable.id, itemId),
        eq(watchlistsTable.ownerId, userId)
      ))
      .limit(1);
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    // Delete item
    await db
      .delete(watchlistItemsTable)
      .where(eq(watchlistItemsTable.id, itemId));
    
    revalidatePath(`/watchlists/${item.watchlist.id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete watchlist item:', error);
    return { success: false, error: error.message || 'Failed to delete item' };
  }
}

export async function getWatchlists() {
  try {
    const userId = await requireAuth();
    
    const watchlists = await db.query.watchlistsTable.findMany({
      where: eq(watchlistsTable.ownerId, userId),
      with: {
        items: true,
      },
      orderBy: (watchlists, { desc }) => [desc(watchlists.createdAt)],
    });
    
    return { success: true, data: watchlists };
  } catch (error: any) {
    console.error('Failed to get watchlists:', error);
    return { success: false, error: error.message || 'Failed to get watchlists' };
  }
}

export async function getWatchlist(id: string) {
  try {
    const userId = await requireAuth();
    
    const watchlist = await db.query.watchlistsTable.findFirst({
      where: and(
        eq(watchlistsTable.id, id),
        eq(watchlistsTable.ownerId, userId)
      ),
      with: {
        items: true,
      },
    });
    
    if (!watchlist) {
      return { success: false, error: 'Watchlist not found' };
    }
    
    return { success: true, data: watchlist };
  } catch (error: any) {
    console.error('Failed to get watchlist:', error);
    return { success: false, error: error.message || 'Failed to get watchlist' };
  }
}
