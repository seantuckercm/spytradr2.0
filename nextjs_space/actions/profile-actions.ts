
// actions/profile-actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { profilesTable } from '@/db/schema/profiles-schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/clerk';
import { revalidatePath } from 'next/cache';
import { updatePreferencesSchema } from '@/lib/validators/profile';

export async function updatePreferences(input: z.infer<typeof updatePreferencesSchema>) {
  try {
    const userId = await requireAuth();
    const validated = updatePreferencesSchema.parse(input);
    
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    
    const updatedPreferences = {
      ...profile.preferences,
      ...validated,
    };
    
    await db
      .update(profilesTable)
      .set({ 
        preferences: updatedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.userId, userId));
    
    revalidatePath('/settings');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update preferences:', error);
    return { success: false, error: error.message || 'Failed to update preferences' };
  }
}

export async function getProfile() {
  try {
    const userId = await requireAuth();
    
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    
    return { success: true, data: profile };
  } catch (error: any) {
    console.error('Failed to get profile:', error);
    return { success: false, error: error.message || 'Failed to get profile' };
  }
}

export async function updateLastLogin() {
  try {
    const userId = await requireAuth();
    
    await db
      .update(profilesTable)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.userId, userId));
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update last login:', error);
    return { success: false, error: error.message || 'Failed to update last login' };
  }
}
