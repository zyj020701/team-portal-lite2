'use client';

import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

type MetricName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB';

/**
 * Reports a single Web Vital metric to the RUM collection endpoint.
 *
 * Uses `navigator.sendBeacon` when available so that the request is not
 * cancelled when the page is being unloaded; falls back to `fetch` with
 * `keepalive`. The endpoint path is versioned (`/api/v1/vitals`) so that the
 * server can evolve the payload schema over time.
 */
function reportMetric(metric: Metric): void {
  const body = JSON.stringify({
    name: metric.name as MetricName,
    value: Math.round(metric.value * 1000) / 1000,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
    href: window.location.href,
  } satisfies VitalsPayload);

  const endpoint = '/api/v1/vitals';

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(endpoint, blob)) return;
  }

  void fetch(endpoint, {
    body,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // RUM reporting must never break the application; swallow network errors.
  });
}

interface VitalsPayload {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  path: string;
  href: string;
}

/**
 * Client-side component that subscribes to Core Web Vitals (LCP, INP, CLS)
 * plus FCP/TTFB and reports every sample to `/api/v1/vitals`.
 *
 * Mount once inside the root layout. Renders nothing.
 */
export function WebVitals(): null {
  if (typeof window === 'undefined') return null;

  onLCP(reportMetric);
  onINP(reportMetric);
  onCLS(reportMetric);
  onFCP(reportMetric);
  onTTFB(reportMetric);

  return null;
}
