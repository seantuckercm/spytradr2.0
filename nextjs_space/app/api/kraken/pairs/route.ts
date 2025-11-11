
// app/api/kraken/pairs/route.ts
import { NextResponse } from 'next/server';
import { fetchKrakenPairs } from '@/lib/api/kraken';

export async function GET() {
  try {
    const pairs = await fetchKrakenPairs();
    
    // Transform to simpler format
    const simplified = Object.entries(pairs).map(([krakenPair, info]) => ({
      krakenPair,
      altname: info.altname,
      wsname: info.wsname,
      base: info.base,
      quote: info.quote,
      status: info.status,
    }));
    
    return NextResponse.json({
      success: true,
      data: simplified,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch trading pairs',
      },
      { status: 500 }
    );
  }
}
