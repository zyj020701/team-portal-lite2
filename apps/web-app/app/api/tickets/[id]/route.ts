import { NextResponse } from 'next/server';
import type { TicketStatus, TicketPriority } from '@team-portal/types';
import {
  fetchTicketDetail,
  transitionTicketStatus,
  changeTicketPriority,
  assignTicketToUser,
} from '../../../../lib/ticket-api';

/**
 * GET   /api/tickets/[id]           — ticket detail (with timeline events)
 * PATCH /api/tickets/[id]           — mutate status / priority / assignee
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const detail = await fetchTicketDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const existing = await fetchTicketDetail(id);
  if (!existing) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  let body: { status?: TicketStatus; priority?: TicketPriority; assigneeId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.status) await transitionTicketStatus(id, body.status);
  if (body.priority) await changeTicketPriority(id, body.priority);
  if (body.assigneeId) await assignTicketToUser(id, body.assigneeId);

  const updated = await fetchTicketDetail(id);
  return NextResponse.json(updated);
}

export const dynamic = 'force-dynamic';
