import { NextResponse } from 'next/server';
import {
  fetchTicketComments,
  createComment,
} from '../../../../../lib/ticket-api';

/**
 * GET  /api/tickets/[id]/comments — list comments
 * POST /api/tickets/[id]/comments — add a comment { content }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const comments = await fetchTicketComments(id);
  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  let body: { content?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
  }
  const comment = await createComment(id, content);
  return NextResponse.json(comment, { status: 201 });
}

export const dynamic = 'force-dynamic';
