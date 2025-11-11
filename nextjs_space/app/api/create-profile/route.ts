
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profilesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, user.id))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Profile already exists',
        profile: existingProfile[0]
      });
    }

    // Create new profile
    const email = user.emailAddresses[0]?.emailAddress || '';
    const newProfile = await db
      .insert(profilesTable)
      .values({
        userId: user.id,
        email,
        membership: 'enterprise', // Set to enterprise as requested
        status: 'active',
        usageCredits: 0,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully',
      profile: newProfile[0]
    });
  } catch (error: any) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ 
      error: 'Failed to create profile',
      details: error.message 
    }, { status: 500 });
  }
}
