import { NextResponse } from 'next/server';

/**
 * RUM (Real User Monitoring) collection endpoint.
 *
 * Receives Core Web Vitals samples posted by the client-side `WebVitals`
 * component. In production these records would be forwarded to a monitoring
 * provider (e.g. Sentry, Datadog, BigQuery); here we validate the shape and
 * respond with 202 Accepted. The validation ensures malformed or third-party
 * payloads are never trusted/acted upon.
 */

const METRIC_NAMES = new Set(['CLS', 'INP', 'LCP', 'FCP', 'TTFB']);
const RATINGS = new Set(['good', 'needs-improvement', 'poor']);

interface VitalsRecord {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
  path: string;
  href: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidVitals(payload: unknown): payload is VitalsRecord {
  if (!isRecord(payload)) return false;
  if (typeof payload.name !== 'string' || !METRIC_NAMES.has(payload.name)) return false;
  if (typeof payload.value !== 'number' || !Number.isFinite(payload.value)) return false;
  if (typeof payload.rating !== 'string' || !RATINGS.has(payload.rating)) return false;
  if (typeof payload.delta !== 'number' || !Number.isFinite(payload.delta)) return false;
  if (typeof payload.id !== 'string') return false;
  if (typeof payload.navigationType !== 'string') return false;
  if (typeof payload.path !== 'string') return false;
  if (typeof payload.href !== 'string') return false;
  return true;
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isValidVitals(payload)) {
    return NextResponse.json({ error: 'Invalid vitals payload' }, { status: 400 });
  }

  // In a real deployment, forward `payload` to the RUM backend here.
  // We keep the handler side-effect free for local/Lighthouse-CI runs so no
  // external credentials are required.

  return NextResponse.json(
    {
      ok: true,
      received: { name: payload.name, value: payload.value, rating: payload.rating },
    },
    { status: 202 },
  );
}

// This endpoint is called by anonymous browsers; do not attempt static
// optimization — it must always run at request time.
export const dynamic = 'force-dynamic';
