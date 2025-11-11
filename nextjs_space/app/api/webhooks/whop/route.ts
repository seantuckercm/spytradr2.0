
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profilesTable, pendingProfilesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Verify Whop webhook signature
 */
function verifyWhopSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Map Whop plan to membership tier
 */
function mapWhopPlanToTier(planId: string): 'free' | 'basic' | 'pro' | 'enterprise' {
  // You'll need to configure these plan IDs based on your Whop setup
  const planMapping: Record<string, 'free' | 'basic' | 'pro' | 'enterprise'> = {
    'plan_basic': 'basic',
    'plan_pro': 'pro',
    'plan_enterprise': 'enterprise',
  };

  return planMapping[planId] || 'free';
}

export async function POST(request: NextRequest) {
  try {
    const whopSecret = process.env.WHOP_WEBHOOK_SECRET;

    if (!whopSecret) {
      console.error('WHOP_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get signature from headers
    const signature = request.headers.get('x-whop-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Get raw body
    const rawBody = await request.text();

    // Verify signature
    if (!verifyWhopSignature(rawBody, signature, whopSecret)) {
      console.error('Invalid Whop webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(rawBody);
    console.log('Whop webhook event:', event.type);

    switch (event.type) {
      case 'membership.created':
      case 'membership.updated':
        await handleMembershipUpdate(event.data);
        break;

      case 'membership.cancelled':
      case 'membership.expired':
        await handleMembershipCancellation(event.data);
        break;

      case 'payment.succeeded':
        await handlePaymentSuccess(event.data);
        break;

      case 'payment.failed':
        await handlePaymentFailure(event.data);
        break;

      default:
        console.log('Unhandled Whop event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Whop webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleMembershipUpdate(data: any) {
  const { user, membership, plan } = data;

  try {
    // Check if profile exists (user has signed up with Clerk)
    const [existingProfile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.email, user.email))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      const tier = mapWhopPlanToTier(plan.id);
      
      await db
        .update(profilesTable)
        .set({
          membership: tier,
          whopUserId: user.id,
          whopMembershipId: membership.id,
          paymentProvider: 'whop',
          status: membership.status === 'active' ? 'active' : 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(profilesTable.email, user.email));

      console.log(`Updated profile for ${user.email} to ${tier} tier`);
    } else {
      // Create pending profile (user hasn't signed up with Clerk yet)
      const tier = mapWhopPlanToTier(plan.id);
      
      // Check if pending profile already exists
      const [existingPending] = await db
        .select()
        .from(pendingProfilesTable)
        .where(eq(pendingProfilesTable.email, user.email))
        .limit(1);

      if (existingPending) {
        // Update pending profile
        await db
          .update(pendingProfilesTable)
          .set({
            membership: tier,
            whopUserId: user.id,
            whopMembershipId: membership.id,
            updatedAt: new Date(),
          })
          .where(eq(pendingProfilesTable.email, user.email));
      } else {
        // Create new pending profile
        const token = crypto.randomBytes(32).toString('hex');
        const id = crypto.randomUUID();
        
        await db
          .insert(pendingProfilesTable)
          .values({
            id,
            email: user.email,
            token,
            membership: tier,
            paymentProvider: 'whop',
            whopUserId: user.id,
            whopMembershipId: membership.id,
            claimed: false,
          });
      }

      console.log(`Created/Updated pending profile for ${user.email} (${tier} tier)`);
    }
  } catch (error) {
    console.error('Failed to handle membership update:', error);
    throw error;
  }
}

async function handleMembershipCancellation(data: any) {
  const { user, membership } = data;

  try {
    // Update profile status
    await db
      .update(profilesTable)
      .set({
        status: 'cancelled',
        membership: 'free', // Downgrade to free tier
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.whopMembershipId, membership.id));

    console.log(`Cancelled membership for user with Whop membership ${membership.id}`);
  } catch (error) {
    console.error('Failed to handle membership cancellation:', error);
    throw error;
  }
}

async function handlePaymentSuccess(data: any) {
  const { user, payment } = data;

  console.log(`Payment succeeded for ${user.email}: ${payment.amount}`);
  
  // Additional logic for payment success tracking
  // You could store payment records, send confirmation emails, etc.
}

async function handlePaymentFailure(data: any) {
  const { user, payment } = data;

  console.log(`Payment failed for ${user.email}`);

  try {
    // You might want to suspend the account or send a notification
    await db
      .update(profilesTable)
      .set({
        status: 'suspended',
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.email, user.email));

    console.log(`Suspended account for ${user.email} due to payment failure`);
  } catch (error) {
    console.error('Failed to handle payment failure:', error);
    throw error;
  }
}
