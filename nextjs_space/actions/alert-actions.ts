
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { alertConfigTable, alertHistoryTable } from '@/db/schema/alerts-schema';
import { requireAuth } from '@/lib/auth/clerk';
import { updateAlertConfigSchema } from '@/lib/validators/alert';
import { eq, desc } from 'drizzle-orm';

/**
 * Get or create alert config for the current user
 */
export async function getAlertConfig() {
  try {
    const userId = await requireAuth();
    
    // Try to fetch existing config
    const [config] = await db
      .select()
      .from(alertConfigTable)
      .where(eq(alertConfigTable.userId, userId))
      .limit(1);
    
    // If no config exists, create default one
    if (!config) {
      const [newConfig] = await db
        .insert(alertConfigTable)
        .values({
          userId,
          emailEnabled: true,
          emailAddress: null,
          discordEnabled: false,
          discordWebhookUrl: null,
          minConfidenceThreshold: 70,
          alertOnBuySignals: true,
          alertOnSellSignals: true,
          maxAlertsPerHour: 10,
          quietHoursEnabled: false,
          quietHoursStart: null,
          quietHoursEnd: null,
          watchlistFilters: [],
        })
        .returning();
      
      return { success: true, data: newConfig };
    }
    
    return { success: true, data: config };
  } catch (error) {
    console.error('Error getting alert config:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch alert config' 
    };
  }
}

/**
 * Update alert config for the current user
 */
export async function updateAlertConfig(input: unknown) {
  try {
    const userId = await requireAuth();
    
    // Validate input
    const validated = updateAlertConfigSchema.parse(input);
    
    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(alertConfigTable)
      .where(eq(alertConfigTable.userId, userId))
      .limit(1);
    
    if (!existingConfig) {
      // Create new config
      const [newConfig] = await db
        .insert(alertConfigTable)
        .values({
          userId,
          ...validated,
          updatedAt: new Date(),
        })
        .returning();
      
      revalidatePath('/settings');
      return { success: true, data: newConfig };
    }
    
    // Update existing config
    const [updated] = await db
      .update(alertConfigTable)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(alertConfigTable.userId, userId))
      .returning();
    
    revalidatePath('/settings');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating alert config:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update alert config' 
    };
  }
}

/**
 * Get alert history for the current user
 */
export async function getAlertHistory(limit = 50) {
  try {
    const userId = await requireAuth();
    
    const alerts = await db
      .select()
      .from(alertHistoryTable)
      .where(eq(alertHistoryTable.userId, userId))
      .orderBy(desc(alertHistoryTable.sentAt))
      .limit(limit);
    
    return { success: true, data: alerts };
  } catch (error) {
    console.error('Error getting alert history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch alert history' 
    };
  }
}
