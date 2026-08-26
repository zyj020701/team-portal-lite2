# Lighthouse Final Report

> **Run date:** 2026-08-25 (after D28-S03 optimization)
> **Environment:** Production build (`next build && next start`), Node 24, desktop form factor, headless Edge/Chromium, throttling disabled (RTT 40ms, 10 Mbps, CPU 1×), 1 run per page.
> **Audited URL prefix:** `http://127.0.0.1:3100/zh`
> **Raw JSON/HTML reports:** `.lighthouse/round5/`

## 1. Score Summary

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:-------------:|:--------------:|:---:|
| **Home** (`/zh`) | **100** | **100** | **100** | **100** |
| **Tickets** (`/zh/tickets`) | **100** | **100** | **100** | **100** |
| **Ticket Detail** (`/zh/tickets/TK-00001`) | **100** | **100** | **100** | **100** |
| **Dashboard** (`/zh/dashboard`) | **99** ✅ | **100** | **100** | **100** |

> **Target:** Performance ≥ 96 on all four core pages (Dashboard ≥ 90).
> Accessibility / Best Practices / SEO ≥ 95.
> **Result:** All targets met on every page.

### Core Web Vitals

| Page | FCP | LCP | TBT | CLS | SI | TTI |
|------|-----|-----|-----|-----|-----|-----|
| Home | 0.2 s | 0.5 s | 0 ms | 0 | 0.4 s | 0.5 s |
| Tickets | 0.2 s | 0.6 s | 0 ms | 0 | 0.4 s | 0.6 s |
| Ticket Detail | 0.2 s | 0.5 s | 0 ms | 0 | 0.4 s | 0.5 s |
| Dashboard | 0.2 s | 0.8 s | 30 ms | 0 | 0.8 s | 0.9 s |

All metrics comfortably beat the red-line targets:
- FCP ≤ 2 s → actual **0.2 s**
- CLS ≤ 0.1 → actual **0**
- TBT essentially zero on all pages (Dashboard 30 ms)

### INP (Interaction to Next Paint)

Lighthouse navigation mode does not report INP. We measured it with Playwright + `PerformanceObserver({ type: 'event' })` (script: `scripts/measure-inp.mjs`), driving real interactions on each page (filter clicks, search input, virtual-list scroll, status transitions, dashboard refresh).

| Page | INP (worst interaction) | Rating |
|------|:-----------------------:|:------:|
| Home | 0 ms | good |
| Tickets | **32 ms** | good |
| Ticket Detail | 16 ms | good |
| Dashboard | **32 ms** | good |

Threshold: INP < 200 ms is "good". Worst measured INP across the app is **32 ms** — comfortably within the green. Raw data: `docs/screenshots/inp-results.json`; rendered scorecard: `docs/screenshots/lighthouse-scorecard.png`.

## 2. Baseline → Final Comparison

| Page | Metric | Baseline | Final | Delta |
|------|--------|:--------:|:-----:|:-----:|
| Home | Perf / A11y / BP / SEO | 100 / 96 / 96 / 82 | 100 / 100 / 100 / 100 | A11y +4, BP +4, SEO +18 |
| Tickets | Perf / A11y / BP / SEO | 100 / 80 / 96 / 82 | 100 / 100 / 100 / 100 | A11y +20, BP +4, SEO +18 |
| Ticket Detail | Perf / A11y / BP / SEO | 0 / 0 / 0 / 0 (500 crash) | 100 / 100 / 100 / 100 | **page fully restored** |
| Dashboard | Perf / A11y / BP / SEO | 99 / 94 / 96 / 82 | 99 / 100 / 100 / 100 | A11y +6, BP +4, SEO +18 |

## 3. Fixes Applied (Iteration Log)

### Iteration 1 — Restore ticket detail (was HTTP 500)
**Problem:** `TypeError: Cannot read properties of undefined (reading 'in_progress')`
in the production bundle. `STATUS_TRANSITIONS` was imported from `@team-portal/types`,
but SWC/`isolatedModules` erased the value import because the package is primarily a
type-only package and its ESM dist was not correctly interop'd into the CJS server chunk
(the binding pointed at the module's own empty `exports` object).

**Fix:** Defined `STATUS_TRANSITIONS` locally in
`apps/web-app/lib/ticket-state-machine.ts` with `import type { TicketStatus }` only.
The ticket detail page immediately returned 200 with full SSR content.

### Iteration 2 — Eliminate console errors (i18n)
**Problem:** `errors-in-console` failed on every page due to missing translation keys:
`tickets.list.count`, `tickets.list.selectAll`, `detail.timeline.types.*`, and
`detail.timeline.heading`; plus `TicketTimeline` called `tTickets('status.X')` although
status labels live under the `detail` namespace.

**Fixes:**
- Added `count` and `selectAll` under `tickets.list` in all 5 locales.
- Added `heading` under `detail.timeline` in all 5 locales.
- Nested timeline event labels under `detail.timeline.types.*` in all 5 locales.
- Changed `TicketTimeline` to use `useTranslations('detail')` for status/priority labels.

### Iteration 3 — Accessibility
- **Color contrast:** replaced `text-neutral-400` with `text-neutral-500` for all visible
  body text (`TicketRow`, `StatCard`, `TrendChart`, `Table`, `VirtualList`). Placeholder
  text was left unchanged (it is not subject to the 4.5:1 rule).
- **label-content-name-mismatch:** `TenantSwitcher` button now uses
  `` aria-label={`${currentTenant.name}, ${t('switchTenant')}`} `` so the accessible name
  starts with the visible tenant name.
- **aria-allowed-attr / aria-required-parent:** removed the invalid `aria-sort` from the
  sort `<button>` (replaced with a textual `aria-label` indicating sort direction);
  replaced `aria-selected` on ticket-row `<div>`s with `aria-current` (valid on generic
  elements).
- **select-name:** added `id` + matching `htmlFor` to the priority and assignee `<select>`
  elements and their labels in `TicketActionsPanel`.
- **heading-order:** chart cards already used `<h2>` (fixed in an earlier step); the
  dashboard now descends h1 → h2 correctly.

### Iteration 4 — SEO / canonical
- Added `apps/web-app/app/icon.svg` and icon/viewport metadata in the root layout to
  eliminate `/favicon.ico` 404s.
- Rewrote `generateMetadata` in `app/[locale]/layout.tsx` so that when
  `NEXT_PUBLIC_SITE_URL` is not set (local / CI), the canonical and hreflang origin is
  derived from the request `host`/`x-forwarded-proto` headers. This makes canonical and
  hreflang URLs match the URL actually being audited, which resolves the Lighthouse
  "points to another hreflang location" failure. In production `NEXT_PUBLIC_SITE_URL`
  still takes precedence.

### Iteration 5 — Verification
After all fixes, a clean production build was produced and all four pages were
re-audited. Console errors dropped to **0** on every page and all categories reached
their targets.

## 4. Remaining Non-Blocking Observations

These audits are **informative / not scored** in the Lighthouse configuration used and do
not affect the category scores:

- **`bfcache`** — the WebSocket client registers event listeners that prevent
  back/forward cache restoration. The hook already no-ops when `WS_ENABLED` is false
  (which is the default for local/CI when `NEXT_PUBLIC_WS_URL` is unset). In production
  the real WS connection is intentional; bfcache is a progressive-enhancement concern,
  not a scoring audit.
- **`unused-javascript` / `render-blocking-insight`** — Lighthouse's new "insight"
  audits report opportunities (Recharts on the dashboard, Next.js CSS). They carry no
  score weight and the CSS is small and critical-path.
- Dashboard performance is 99 rather than 100 because Recharts renders three charts on
  the client after hydration. This is above the ≥ 90 dashboard target; further
  optimization (e.g. SVG pre-rendering) provides diminishing returns.

## 5. Acceptance Criteria Mapping

| Criterion | Status |
|-----------|:------:|
| Four core pages have baseline reports | ✅ `docs/reports/lighthouse-baseline.md` |
| Four core pages have final reports | ✅ `docs/reports/lighthouse-final.md` + raw JSON/HTML in `.lighthouse/round5/` |
| Performance ≥ 96 (Dashboard ≥ 90) | ✅ 100 / 100 / 100 / 99 |
| Accessibility / BP / SEO ≥ 95 | ✅ all 100 |
| CLS ≤ 0.1 | ✅ 0 on all pages |
| FCP ≤ 2 s | ✅ 0.2 s on all pages |
| At least one complete measure → fix → re-measure iteration | ✅ five iterations logged above |
| `pnpm build` succeeds | ✅ verified |

---

## 6. Iteration 6 — Mobile performance deep-dive (2026-08-27)

> **Context:** A manual Lighthouse run against `next dev` reported Performance 70 on
> `/zh/tickets`. That number is **not representative** — `next dev` ships unminified,
> non-optimized code with React's development build and HMR overhead. The real baseline
> is a **production** build. We nonetheless audited the **mobile preset** (the strictest
> default: 4× CPU slowdown, ~1.6 Mbps, mobile viewport), found a genuine architectural
> issue, and fixed it.

### Root cause

The client-side TanStack Query hooks imported `lib/ticket-api` → `lib/mock-data`, which
**synchronously generates 10,000 ticket objects at module load** (`generateTickets(10000)`).
Because this module was reachable from a client bundle, the whole dataset generator shipped
to the browser and ran on the main thread during hydration — a large blocking task on
throttled mobile CPUs (high TBT), plus ~12 KB of unnecessary client JS. The tickets list
page also had **no SSR prefetch**, so the first screen waited for a client fetch.

### Fix (data layer moved to the server, RSC-correct)

1. Marked the data layer **`server-only`** (`mock-data.ts`, `ticket-api.ts`,
   `dashboard-api.ts`) so it can never be bundled into client code (build fails loudly if
   a client component imports it).
2. Added Next.js **Route Handlers** under `app/api/*` (`tickets`, `tickets/[id]`,
   `tickets/[id]/comments`, `tickets/batch/assign`, `tickets/batch/close`, `users`,
   `dashboard`) that call the server-only mock layer over HTTP.
3. Added a client-safe `lib/api-client.ts` (fetch wrapper) and pointed all client hooks
   (`use-tickets`, `use-ticket-detail`, `use-dashboard`) at it.
4. Added a shared, client-safe `lib/ticket-filters.ts` (`PAGE_SIZE`, URL parsing, query-key
   & param builders) so the SSR prefetch and the client query produce **identical** keys.
5. Added **SSR infinite-query prefetch + HydrationBoundary** to the tickets list page, so
   the first page of tickets is rendered in the server HTML (LCP element is now
   server-rendered).
6. Lazy-loaded non-critical chrome (`NotificationBell` with the WebSocket client,
   `TenantSwitcher`) via `next/dynamic` (`ssr: false`, skeleton placeholder) to shrink the
   first-screen JS/hydration work.

### Results — Production build, mobile preset (4× CPU, ~1.6 Mbps), median of 3 runs

| Page | Performance | FCP | LCP | TBT | CLS |
|------|:-----------:|-----|-----|-----|:---:|
| Home (`/zh`) | **97** | 1.4 s | 2.5 s | 6 ms | 0 |
| Tickets (`/zh/tickets`) | **95-96** | 1.4 s | 2.7 s | ~50 ms | 0 |
| Ticket Detail (`/zh/tickets/TK-00001`) | **98-99** | 1.4 s | 2.3 s | ~20 ms | 0 |
| Dashboard (`/zh/dashboard`) | **93** | 1.4 s | 2.3 s | ~245 ms | 0 |

### Results — Production build, desktop preset (CI gate), median of 3 runs

| Page | Performance | FCP | LCP | TBT | CLS |
|------|:-----------:|-----|-----|-----|:---:|
| Home | **100** | 0.37 s | 0.53 s | 0 ms | 0 |
| Tickets | **100** | 0.37 s | 0.62 s | 0 ms | 0 |
| Ticket Detail | **100** | 0.37 s | 0.52 s | 0 ms | 0 |
| Dashboard | **100** | 0.37 s | 0.55 s | 35 ms | 0 |

The mock dataset strings no longer appear in any client chunk (`/_next/static/chunks`);
the tickets route's First Load JS is **139 KB** raw / well under budget gzipped.

> **How to measure correctly:** never Lighthouse a `next dev` server. Use
> `pnpm build && pnpm --filter @team-portal/web-app exec next start -p 3000`, then run
> Lighthouse against `http://localhost:3000/zh/...`. Desktop preset is the CI gate; the
> mobile preset numbers above are provided as a stricter reference.

