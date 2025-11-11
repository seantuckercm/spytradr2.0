
// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db } from '@/db';
import { profilesTable } from '@/db/schema/profiles-schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const eventType = evt.type;
  console.log('Clerk webhook event:', eventType);

  if (eventType === 'user.created') {
    // Create profile for new user
    const { id, email_addresses, created_at } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    try {
      await db.insert(profilesTable).values({
        userId: id,
        email,
        membership: 'free',
        status: 'active',
        createdAt: new Date(created_at),
      });
      console.log('Profile created for user:', id);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  }

  if (eventType === 'user.updated') {
    // Update profile
    const { id, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    try {
      await db
        .update(profilesTable)
        .set({ email, updatedAt: new Date() })
        .where(eq(profilesTable.userId, id));
      console.log('Profile updated for user:', id);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  if (eventType === 'user.deleted') {
    // Delete profile
    const { id } = evt.data;
    
    try {
      await db
        .delete(profilesTable)
        .where(eq(profilesTable.userId, id));
      console.log('Profile deleted for user:', id);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
