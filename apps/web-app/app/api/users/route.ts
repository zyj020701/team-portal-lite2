import { NextResponse } from 'next/server';
import { fetchUsers } from '../../../lib/ticket-api';

/**
 * GET /api/users — assignee directory for filters / assignment dialogs.
 */
export async function GET(): Promise<NextResponse> {
  const users = await fetchUsers();
  return NextResponse.json(users);
}

export const dynamic = 'force-dynamic';
