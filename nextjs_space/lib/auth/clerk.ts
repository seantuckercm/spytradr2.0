
// lib/auth/clerk.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { DEFAULT_TIER_LIMITS } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getCurrentUser() {
  const userId = await requireAuth();
  const user = await currentUser();
  return user;
}

export async function getCurrentProfile() {
  const userId = await requireAuth();
  
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
    
  if (!profile) {
    throw new Error("Profile not found");
  }
  
  return profile;
}

export async function getProfileWithLimits() {
  const profile = await getCurrentProfile();
  const limits = profile.customLimits || DEFAULT_TIER_LIMITS[profile.membership];
  
  return {
    ...profile,
    limits,
  };
}
