# Lighthouse Baseline Report

> **Run date:** 2026-08-24 (before D28-S03 optimization)
> **Environment:** Production build (`next build && next start`), Node 24, desktop form factor, headless Edge/Chromium, throttling disabled (RTT 40ms, 10 Mbps, CPU 1×), 1 run per page.
> **Audited URL prefix:** `http://127.0.0.1:3100/zh`

## 1. Score Summary

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:-------------:|:--------------:|:---:|
| **Home** (`/zh`) | 100 | 96 | 96 | 82 |
| **Tickets** (`/zh/tickets`) | 100 | 80 | 96 | 82 |
| **Ticket Detail** (`/zh/tickets/TK-00001`) | **0** ❌ | **0** ❌ | **0** ❌ | **0** ❌ |
| **Dashboard** (`/zh/dashboard`) | 99 | 94 | 96 | 82 |

### Core Web Vitals

| Page | FCP | LCP | TBT | CLS | SI |
|------|-----|-----|-----|-----|-----|
| Home | 0.2 s | 0.5 s | 0 ms | 0 | 0.4 s |
| Tickets | 0.2 s | 0.6 s | 0 ms | 0 | 0.4 s |
| Ticket Detail | — | — | — | — | — (page crashed with HTTP 500) |
| Dashboard | 0.2 s | 0.9 s | 30 ms | 0 | 0.5 s |

## 2. Issues Identified

### 2.1 Ticket Detail — HTTP 500 (blocking)
The production server threw `TypeError: Cannot read properties of undefined (reading 'in_progress')`
because `STATUS_TRANSITIONS` was imported from `@team-portal/types` but the value import was
erased by SWC under `isolatedModules` (the types package is treated as type-only, and its
ESM/CJS interop in the CJS server bundle produced an empty module namespace).

### 2.2 Missing i18n keys (console errors on every page)
- `tickets.list.count` — shown next to the select-all checkbox
- `tickets.list.selectAll` — aria-label for the select-all checkbox
- `detail.timeline.types.*` — timeline event type labels (`created`, `assigned`,
  `status_changed`, `priority_changed`, `comment`) were looked up as `t('types.X')` under the
  `detail.timeline` namespace but were only defined at the namespace root
- `tickets.status.*` / `tickets.priority.*` — `TicketTimeline` called a translator bound to
  the `tickets` namespace for status/priority labels, but those labels live under `detail`
- `detail.timeline.heading` — the `<h2>` heading text

### 2.3 Accessibility

| Audit | Page(s) | Issue |
|-------|---------|-------|
| `color-contrast` | Home, Tickets, Dashboard | `text-neutral-400` (#9ca3af) on `bg-neutral-50` (#f9fafb) yields only 2.42:1 contrast (need ≥ 4.5:1 for 12 px text) |
| `label-content-name-mismatch` | All | `TenantSwitcher` button had `aria-label="切换租户"` but visible text was the tenant name ("Acme Corp") |
| `aria-allowed-attr` | Tickets | `aria-sort` was placed on a `<button>` (only valid on `role="columnheader"`); ticket rows used `aria-selected` on a `<div>` without a supporting role |
| `aria-required-parent` | Tickets | After the first fix attempt, `role="columnheader"` was used without a `role="row"` ancestor |
| `select-name` | Ticket Detail | Two `<select>` elements (priority, assignee) had no associated `<label htmlFor>` |
| `heading-order` | Dashboard | Chart cards used `<h3>` with no preceding `<h2>` |

### 2.4 SEO
- `canonical` / `hreflang`: canonical URL pointed to the production HTTPS origin while the page
  was served over `http://localhost`, so Lighthouse flagged the canonical as "points to another
  hreflang location". On the baseline run (without `NEXT_PUBLIC_SITE_URL`), the canonical used
  `http://localhost:3100` and hreflang tags were missing entirely.
- No favicon / app icon was configured (404 on `/favicon.ico`).

### 2.5 Best Practices
- `errors-in-console`: every page logged multiple `MISSING_MESSAGE` errors from next-intl.
- `bfcache`: blocked by the WebSocket client's event listeners (mitigated by `WS_ENABLED`
  when no `NEXT_PUBLIC_WS_URL` is configured).

### 2.6 Performance
- All pages met or exceeded targets (FCP ≤ 2 s, TTI ≤ 3 s, CLS ≤ 0.1).
- Dashboard was at 99 due to Recharts client-side rendering of three charts (LCP 0.9 s,
  TBT 30 ms); target for Dashboard is ≥ 90 so this already passes.

## 3. Optimization Plan

1. Move `STATUS_TRANSITIONS` out of the types package into the app's
   `lib/ticket-state-machine.ts` so the value import cannot be erased.
2. Add all missing i18n keys to all 5 locale message files and fix the translator namespace
   in `TicketTimeline`.
3. Replace visible `text-neutral-400` with `text-neutral-500` for body text.
4. Fix `TenantSwitcher` aria-label to begin with the visible tenant name.
5. Replace invalid `aria-sort`/`aria-selected` patterns with valid alternatives.
6. Associate `<label htmlFor>` with the ticket-detail selects.
7. Promote chart card headings from `<h3>` to `<h2>`.
8. Add `app/icon.svg` and root layout icon metadata.
9. Make canonical/hreflang URLs request-origin–aware so they match in every environment.
10. Re-run Lighthouse and record final scores.
