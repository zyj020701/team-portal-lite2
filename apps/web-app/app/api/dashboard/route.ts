import { NextResponse } from 'next/server';
import { fetchDashboardData } from '../../../lib/dashboard-api';

/**
 * GET /api/dashboard?locale=xx — dashboard stats/trends.
 *
 * Server-side only; the client polls this every 30s via TanStack Query.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') ?? 'zh';
  const data = await fetchDashboardData(locale);
  return NextResponse.json(data);
}

export const dynamic = 'force-dynamic';
