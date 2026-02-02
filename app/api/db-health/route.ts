export const dynamic = 'force-dynamic';

import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * GET /api/db-health - Database health check
 *
 * @internal Ops-only endpoint for infrastructure monitoring.
 * Used to verify database connectivity and schema access.
 * Not intended for frontend consumption.
 *
 * Returns:
 * - 200: { status: 'healthy', database: 'connected', ... } - DB accessible
 * - 503: { status: 'unhealthy', error: string } - DB connection failed
 */
export async function GET() {
  try {
    // Test 1: Basic connectivity - execute raw SQL
    const timeResult = await db.execute(sql`SELECT NOW() as server_time`);

    // Test 2: Schema access - count users (should be 0 initially)
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      runtime: 'nodejs',
      serverTime: timeResult[0]?.server_time,
      userCount: userCount[0]?.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
