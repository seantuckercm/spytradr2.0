
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute('SELECT 1 as health');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected',
      },
      { status: 500 }
    );
  }
}
