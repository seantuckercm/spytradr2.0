
import { z } from 'zod';

export const updateAlertConfigSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailAddress: z.string().email().optional().or(z.literal('')),
  discordEnabled: z.boolean().optional(),
  discordWebhookUrl: z.string().url().optional().or(z.literal('')),
  minConfidenceThreshold: z.number().min(0).max(100).optional(),
  alertOnBuySignals: z.boolean().optional(),
  alertOnSellSignals: z.boolean().optional(),
  maxAlertsPerHour: z.number().min(1).max(100).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')).or(z.null()),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')).or(z.null()),
  watchlistFilters: z.array(z.string()).optional(),
});

export type UpdateAlertConfigInput = z.infer<typeof updateAlertConfigSchema>;
