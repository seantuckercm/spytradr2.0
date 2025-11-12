
import { db } from '@/db';
import { alertConfigTable, alertHistoryTable, signalsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SelectSignal } from '@/db/schema/signals-schema';

interface SendAlertOptions {
  userId: string;
  signal: SelectSignal;
}

interface AlertResult {
  success: boolean;
  channels: {
    email?: { sent: boolean; error?: string };
    discord?: { sent: boolean; error?: string };
  };
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(quietHoursStart?: string, quietHoursEnd?: string): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = quietHoursEnd.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle case where quiet hours span midnight
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Send email notification for a trading signal
 */
async function sendEmailAlert(
  email: string,
  signal: SelectSignal
): Promise<{ sent: boolean; error?: string }> {
  try {
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Mailgun
    
    // For now, we'll log the email that would be sent
    console.log('[Alert Service] Email notification:', {
      to: email,
      subject: `${signal.direction} Signal: ${signal.altname}`,
      body: {
        pair: signal.altname,
        direction: signal.direction,
        confidence: signal.confidence,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        strategy: signal.strategy,
        risk: signal.risk,
        reason: signal.reason,
      },
    });

    // Simulate email sending
    // In production, replace this with actual email API call:
    // await emailClient.send({ ... })

    return { sent: true };
  } catch (error) {
    console.error('[Alert Service] Email error:', error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send Discord webhook notification for a trading signal
 */
async function sendDiscordAlert(
  webhookUrl: string,
  signal: SelectSignal
): Promise<{ sent: boolean; error?: string }> {
  try {
    const color = signal.direction === 'buy' ? 0x10b981 : 0xef4444; // green for buy, red for sell
    const emoji = signal.direction === 'buy' ? '📈' : '📉';

    const entryPrice = signal.entryPrice ? parseFloat(signal.entryPrice) : null;
    const stopLoss = signal.stopLoss ? parseFloat(signal.stopLoss) : null;
    const takeProfit = signal.takeProfit ? parseFloat(signal.takeProfit) : null;

    const embed = {
      title: `${emoji} ${signal.direction.toUpperCase()} Signal: ${signal.krakenPair}`,
      color,
      fields: [
        {
          name: 'Entry Price',
          value: entryPrice ? `$${entryPrice.toFixed(2)}` : 'N/A',
          inline: true,
        },
        {
          name: 'Stop Loss',
          value: stopLoss ? `$${stopLoss.toFixed(2)}` : 'N/A',
          inline: true,
        },
        {
          name: 'Take Profit',
          value: takeProfit ? `$${takeProfit.toFixed(2)}` : 'N/A',
          inline: true,
        },
        {
          name: 'Confidence',
          value: `${signal.confidence}%`,
          inline: true,
        },
        {
          name: 'Risk',
          value: signal.risk?.toUpperCase() || 'N/A',
          inline: true,
        },
        {
          name: 'Strategy',
          value: signal.strategy || 'N/A',
          inline: true,
        },
        {
          name: 'Reason',
          value: signal.reason || 'Technical analysis criteria met',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SpyTradr Trading Signals',
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
    }

    console.log('[Alert Service] Discord notification sent successfully');
    return { sent: true };
  } catch (error) {
    console.error('[Alert Service] Discord error:', error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main function to send alerts for a trading signal
 */
export async function sendSignalAlert(options: SendAlertOptions): Promise<AlertResult> {
  const { userId, signal } = options;

  try {
    // Fetch user's alert configuration
    const configs = await db
      .select()
      .from(alertConfigTable)
      .where(eq(alertConfigTable.userId, userId))
      .limit(1);

    const config = configs[0];

    // If no config or all notifications disabled, skip
    if (
      !config ||
      (!config.emailEnabled && !config.discordEnabled)
    ) {
      console.log('[Alert Service] No alerts enabled for user:', userId);
      return {
        success: false,
        channels: {},
      };
    }

    // Check confidence threshold
    const signalConfidence = typeof signal.confidence === 'string' 
      ? parseFloat(signal.confidence) 
      : signal.confidence;

    if (signalConfidence < config.minConfidenceThreshold) {
      console.log(
        '[Alert Service] Signal confidence below threshold:',
        signalConfidence,
        '<',
        config.minConfidenceThreshold
      );
      return {
        success: false,
        channels: {},
      };
    }

    // Check watchlist filters
    if (config.watchlistFilters && config.watchlistFilters.length > 0) {
      // If filters are set and signal has no watchlist item, skip
      if (!signal.watchlistItemId) {
        console.log('[Alert Service] Signal has no watchlist item, filters enabled');
        return {
          success: false,
          channels: {},
        };
      }
      // In a full implementation, you'd check if the signal's watchlist is in the filter list
    }

    // Check quiet hours
    if (isQuietHours(config.quietHoursStart || undefined, config.quietHoursEnd || undefined)) {
      console.log('[Alert Service] Currently in quiet hours');
      return {
        success: false,
        channels: {},
      };
    }

    // Send notifications
    const result: AlertResult = {
      success: false,
      channels: {},
    };

    if (config.emailEnabled && config.emailAddress) {
      result.channels.email = await sendEmailAlert(config.emailAddress, signal);
    }

    if (config.discordEnabled && config.discordWebhookUrl) {
      result.channels.discord = await sendDiscordAlert(config.discordWebhookUrl, signal);
    }

    // Check if at least one channel was successful
    result.success =
      (result.channels.email?.sent || false) ||
      (result.channels.discord?.sent || false);

    // Log to alert history for each channel
    const promises: Promise<any>[] = [];
    const confidence = typeof signal.confidence === 'string' 
      ? parseInt(signal.confidence) 
      : signal.confidence;

    if (result.channels.email) {
      promises.push(
        db.insert(alertHistoryTable).values({
          userId,
          signalId: signal.id,
          alertType: 'email',
          channel: config.emailAddress || 'unknown',
          krakenPair: signal.krakenPair,
          direction: signal.direction,
          confidence,
          entryPrice: signal.entryPrice || null,
          status: result.channels.email.sent ? 'sent' : 'failed',
          error: result.channels.email.error || null,
        })
      );
    }

    if (result.channels.discord) {
      promises.push(
        db.insert(alertHistoryTable).values({
          userId,
          signalId: signal.id,
          alertType: 'discord',
          channel: config.discordWebhookUrl || 'unknown',
          krakenPair: signal.krakenPair,
          direction: signal.direction,
          confidence,
          entryPrice: signal.entryPrice || null,
          status: result.channels.discord.sent ? 'sent' : 'failed',
          error: result.channels.discord.error || null,
        })
      );
    }

    await Promise.all(promises);

    return result;
  } catch (error) {
    console.error('[Alert Service] Error sending alert:', error);

    // Log failed attempt
    const confidence = typeof signal.confidence === 'string' 
      ? parseInt(signal.confidence) 
      : signal.confidence;

    await db.insert(alertHistoryTable).values({
      userId,
      signalId: signal.id,
      alertType: 'system',
      channel: 'system',
      krakenPair: signal.krakenPair,
      direction: signal.direction,
      confidence,
      entryPrice: signal.entryPrice || null,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      channels: {},
    };
  }
}

/**
 * Batch send alerts for multiple signals
 */
export async function sendBatchSignalAlerts(
  userId: string,
  signals: SelectSignal[]
): Promise<{ total: number; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const signal of signals) {
    const result = await sendSignalAlert({ userId, signal });
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    total: signals.length,
    sent,
    failed,
  };
}
