import { NextResponse } from 'next/server';
import { batchAssignTickets } from '../../../../../lib/ticket-api';

/**
 * POST /api/tickets/batch/assign — { ticketIds: string[], assigneeId: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: { ticketIds?: string[]; assigneeId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!Array.isArray(body.ticketIds) || body.ticketIds.length === 0) {
    return NextResponse.json({ error: 'ticketIds must be a non-empty array' }, { status: 400 });
  }
  if (!body.assigneeId) {
    return NextResponse.json({ error: 'assigneeId is required' }, { status: 400 });
  }
  await batchAssignTickets(body.ticketIds, body.assigneeId);
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
