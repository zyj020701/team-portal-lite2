import { NextResponse } from 'next/server';
import type { TicketListParams } from '@team-portal/types';
import { fetchTickets } from '../../../lib/ticket-api';

/**
 * GET /api/tickets — paginated/filtered ticket list.
 *
 * Server-side only: imports the `server-only` mock data layer, so the 10k
 * dataset never reaches the client bundle. Query params mirror TicketListParams.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '20');

  const split = (key: string): string[] | undefined => {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const arr = v.split(',').filter(Boolean);
    return arr.length > 0 ? arr : undefined;
  };

  const sortField = searchParams.get('sortField');
  const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;

  const params: TicketListParams = {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
    status: split('status') as TicketListParams['status'],
    priority: split('priority') as TicketListParams['priority'],
    assigneeId: searchParams.get('assigneeId') ?? undefined,
    keyword: searchParams.get('keyword') ?? undefined,
    date: searchParams.get('date') ?? undefined,
    sort:
      sortField && sortDirection
        ? { field: sortField as 'createdAt' | 'priority', direction: sortDirection }
        : undefined,
  };

  const result = await fetchTickets(params);
  return NextResponse.json(result);
}

// The handler reads live query params; never statically optimize it away.
export const dynamic = 'force-dynamic';
