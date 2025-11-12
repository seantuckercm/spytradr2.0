
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profilesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function createOrGetProfile(user: any) {
  // Check if profile already exists
  const existingProfile = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, user.id))
    .limit(1);

  if (existingProfile.length > 0) {
    return existingProfile[0];
  }

  // Create new profile
  const email = user.emailAddresses[0]?.emailAddress || '';
  const newProfile = await db
    .insert(profilesTable)
    .values({
      userId: user.id,
      email,
      membership: 'free', // Default to free for new users
      status: 'active',
      usageCredits: 0,
    })
    .returning();

  return newProfile[0];
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      const url = new URL(request.url);
      return NextResponse.redirect(new URL('/login', url.origin));
    }

    const profile = await createOrGetProfile(user);

    // Redirect to dashboard or specified redirect param
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  } catch (error: any) {
    console.error('Error in GET /api/create-profile:', error);
    return NextResponse.json({ 
      error: 'Failed to create profile',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const profile = await createOrGetProfile(user);

    return NextResponse.json({ 
      success: true, 
      message: profile ? 'Profile ready' : 'Profile created successfully',
      profile
    });
  } catch (error: any) {
    console.error('Error in POST /api/create-profile:', error);
    return NextResponse.json({ 
      error: 'Failed to create profile',
      details: error.message 
    }, { status: 500 });
  }
}
