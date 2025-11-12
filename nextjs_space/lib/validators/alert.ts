
import { z } from 'zod';

// Alert Configuration Schema
export const updateAlertConfigSchema = z.object({
  // Email Notifications
  emailEnabled: z.boolean().optional(),
  emailAddress: z.string().email('Invalid email address').optional().or(z.literal('')),
  
  // Discord Webhooks
  discordEnabled: z.boolean().optional(),
  discordWebhookUrl: z.string().url('Invalid Discord webhook URL').optional().or(z.literal('')),
  
  // Alert Thresholds
  minConfidenceThreshold: z.number().min(0).max(100).optional(),
  alertOnBuySignals: z.boolean().optional(),
  alertOnSellSignals: z.boolean().optional(),
  
  // Alert Frequency Controls
  maxAlertsPerHour: z.number().min(1).max(100).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional().or(z.literal('')),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional().or(z.literal('')),
  
  // Watchlist-specific settings
  watchlistFilters: z.array(z.string()).optional(),
});

export type UpdateAlertConfigInput = z.infer<typeof updateAlertConfigSchema>;
