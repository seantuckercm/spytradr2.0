
import { NextRequest, NextResponse } from 'next/server';
import { fetchKrakenOHLCByTimeframe } from '@/lib/api/kraken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pair = searchParams.get('pair');
    const timeframe = searchParams.get('timeframe');
    const sinceParam = searchParams.get('since');

    if (!pair) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: pair' },
        { status: 400 }
      );
    }

    if (!timeframe) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: timeframe' },
        { status: 400 }
      );
    }

    const since = sinceParam ? parseInt(sinceParam, 10) : undefined;

    const result = await fetchKrakenOHLCByTimeframe(pair, timeframe, since);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      last: result.last,
    });
  } catch (error: any) {
    console.error('OHLC API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
