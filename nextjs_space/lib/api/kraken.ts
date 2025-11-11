
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
