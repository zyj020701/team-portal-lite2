import 'server-only';
import type { DashboardData } from '@team-portal/types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock dashboard data. In production this would call the real API.
 * Data is regenerated slightly on each call to simulate live updates.
 */
export async function fetchDashboardData(locale: string): Promise<DashboardData> {
  await delay(400);

  // Use locale as a seed so different languages show slightly different data
  const seed = locale.length;
  const jitter = (base: number, range: number): number =>
    base + Math.round(Math.sin(Date.now() / 60000 + seed) * range);

  const today = new Date();
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const created = 80 + Math.round(Math.sin(i + seed) * 30) + i * 5;
    const resolved = 60 + Math.round(Math.cos(i + seed) * 25) + i * 4;
    return { date: dateStr, created, resolved };
  });

  const pending = jitter(36, 8);
  const inProgress = jitter(52, 10);
  const resolved = jitter(892, 20);
  const closed = jitter(1200, 30);

  return {
    stats: {
      newToday: jitter(128, 15),
      pending,
      resolved,
      avgResponseMinutes: jitter(138, 20),
      newTodayChange: 12,
      pendingChange: -5,
      resolvedChange: 8,
      avgResponseChange: -15,
    },
    trend,
    distribution: [
      { status: 'pending', count: pending },
      { status: 'in_progress', count: inProgress },
      { status: 'resolved', count: resolved },
      { status: 'closed', count: closed },
    ],
    topAssignees: [
      { assigneeId: 'u1', assigneeName: 'Alex Zhang', count: 45 },
      { assigneeId: 'u2', assigneeName: 'Maria Li', count: 38 },
      { assigneeId: 'u3', assigneeName: 'David Wang', count: 32 },
      { assigneeId: 'u4', assigneeName: 'Sophia Zhao', count: 28 },
      { assigneeId: 'u5', assigneeName: 'Chris Chen', count: 24 },
    ],
  };
}
