import { NextResponse } from 'next/server';
import { batchCloseTickets } from '../../../../../lib/ticket-api';

/**
 * POST /api/tickets/batch/close — { ticketIds: string[] }
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: { ticketIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!Array.isArray(body.ticketIds) || body.ticketIds.length === 0) {
    return NextResponse.json({ error: 'ticketIds must be a non-empty array' }, { status: 400 });
  }
  await batchCloseTickets(body.ticketIds);
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
