
// lib/api/kraken.ts
import { db } from '@/db';
import { exchangePairsCacheTable } from '@/db/schema/watchlists-schema';
import { eq, and, gt } from 'drizzle-orm';

const KRAKEN_API_BASE = 'https://api.kraken.com/0/public';
const CACHE_DURATION_HOURS = 24;

interface KrakenPairInfo {
  altname: string;
  wsname: string;
  base: string;
  quote: string;
  status?: string;
}

interface KrakenPairsResponse {
  error: string[];
  result: Record<string, KrakenPairInfo>;
}

export async function fetchKrakenPairs(): Promise<Record<string, KrakenPairInfo>> {
  try {
    const response = await fetch(`${KRAKEN_API_BASE}/AssetPairs`, {
      next: { revalidate: 86400 }, // 24 hours
    });
    
    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.statusText}`);
    }
    
    const data: KrakenPairsResponse = await response.json();
    
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error.join(', ')}`);
    }
    
    return data.result;
  } catch (error) {
    console.error('Failed to fetch Kraken pairs:', error);
    throw error;
  }
}

export async function validateKrakenPair(inputSymbol: string): Promise<{
  success: boolean;
  error?: string;
  data?: { krakenPair: string; altname: string; base: string; quote: string };
}> {
  try {
    // Normalize input (remove special chars, uppercase)
    const normalized = inputSymbol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Check cache first
    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() - CACHE_DURATION_HOURS);
    
    const [cached] = await db
      .select()
      .from(exchangePairsCacheTable)
      .where(
        and(
          eq(exchangePairsCacheTable.exchange, 'kraken'),
          gt(exchangePairsCacheTable.validatedAt, cacheExpiry)
        )
      )
      .limit(1);
    
    if (cached && (cached.krakenPair === normalized || cached.altname === normalized)) {
      return {
        success: true,
        data: {
          krakenPair: cached.krakenPair,
          altname: cached.altname,
          base: cached.base,
          quote: cached.quote,
        },
      };
    }
    
    // Fetch from Kraken API
    const pairs = await fetchKrakenPairs();
    
    // Find matching pair
    let matchedPair: { krakenPair: string; info: KrakenPairInfo } | null = null;
    
    for (const [krakenPair, info] of Object.entries(pairs)) {
      if (
        krakenPair === normalized ||
        info.altname === normalized ||
        info.wsname === normalized
      ) {
        matchedPair = { krakenPair, info };
        break;
      }
    }
    
    if (!matchedPair) {
      return {
        success: false,
        error: `Trading pair "${inputSymbol}" not found on Kraken`,
      };
    }
    
    // Cache the result
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);
    
    try {
      await db
        .insert(exchangePairsCacheTable)
        .values({
          exchange: 'kraken',
          krakenPair: matchedPair.krakenPair,
          altname: matchedPair.info.altname,
          base: matchedPair.info.base,
          quote: matchedPair.info.quote,
          isActive: matchedPair.info.status === 'online',
          validatedAt: new Date(),
          expiresAt,
        });
    } catch (cacheError) {
      // Ignore cache errors, return the result anyway
      console.warn('Failed to cache pair validation result:', cacheError);
    }
    
    return {
      success: true,
      data: {
        krakenPair: matchedPair.krakenPair,
        altname: matchedPair.info.altname,
        base: matchedPair.info.base,
        quote: matchedPair.info.quote,
      },
    };
  } catch (error: any) {
    console.error('Failed to validate Kraken pair:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate trading pair',
    };
  }
}

export async function getKrakenTicker(pair: string) {
  try {
    const response = await fetch(
      `${KRAKEN_API_BASE}/Ticker?pair=${pair}`,
      { next: { revalidate: 60 } } // 1 minute cache
    );
    
    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error.join(', ')}`);
    }
    
    return data.result;
  } catch (error) {
    console.error('Failed to fetch Kraken ticker:', error);
    throw error;
  }
}

// Timeframe mapping for Kraken OHLC intervals (in minutes)
export const KRAKEN_TIMEFRAME_MAP: Record<string, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '4h': 240,
  '1d': 1440,
  '1w': 10080,
};

interface KrakenOHLCData {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  vwap: string;
  volume: string;
  count: number;
}

interface KrakenOHLCResponse {
  error: string[];
  result: {
    [key: string]: KrakenOHLCData[] | number;
  };
}

/**
 * Fetch OHLC data from Kraken
 * @param pair - Trading pair (e.g., XBTUSD, XXBTZUSD)
 * @param interval - Timeframe in minutes (1, 5, 15, 30, 60, 240, 1440, 10080)
 * @param since - Return data since given timestamp (optional)
 * @returns OHLC data array
 */
export async function fetchKrakenOHLC(
  pair: string,
  interval: number,
  since?: number
): Promise<{
  success: boolean;
  data?: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  last?: number;
  error?: string;
}> {
  try {
    const url = new URL(`${KRAKEN_API_BASE}/OHLC`);
    url.searchParams.set('pair', pair);
    url.searchParams.set('interval', interval.toString());
    if (since) {
      url.searchParams.set('since', since.toString());
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 }, // 1 minute cache
    });

    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.statusText}`);
    }

    const apiData: KrakenOHLCResponse = await response.json();

    if (apiData.error && apiData.error.length > 0) {
      throw new Error(`Kraken API error: ${apiData.error.join(', ')}`);
    }

    const result = apiData.result;
    const pairKey = Object.keys(result).find(key => key !== 'last');

    if (!pairKey) {
      throw new Error('No OHLC data found in response');
    }

    const pairData = result[pairKey];
    if (!Array.isArray(pairData)) {
      throw new Error('Invalid OHLC data format');
    }

    const ohlcData = pairData.map((candle) => ({
      timestamp: candle.time,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    }));

    return {
      success: true,
      data: ohlcData,
      last: typeof result.last === 'number' ? result.last : undefined,
    };
  } catch (error: any) {
    console.error('Failed to fetch Kraken OHLC:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch OHLC data',
    };
  }
}

/**
 * Fetch OHLC data using timeframe string (e.g., '1h', '4h')
 */
export async function fetchKrakenOHLCByTimeframe(
  pair: string,
  timeframe: string,
  since?: number
) {
  const interval = KRAKEN_TIMEFRAME_MAP[timeframe];
  
  if (!interval) {
    return {
      success: false,
      error: `Invalid timeframe: ${timeframe}`,
    };
  }

  return fetchKrakenOHLC(pair, interval, since);
}
