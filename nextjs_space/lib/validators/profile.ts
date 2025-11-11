
// lib/validators/profile.ts
import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultTimeframe: z.string().optional(),
});
