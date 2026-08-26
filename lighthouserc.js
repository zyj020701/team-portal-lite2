/**
 * Lighthouse CI configuration for Team Portal Lite (D28-S09).
 *
 * This configuration is consumed by `@lhci/cli` via `lhci autorun` both
 * locally and in GitHub Actions. It:
 *
 *  1. Starts the production web-app server (next start on port 3210).
 *  2. Audits the four core pages 3 times each (median is used).
 *  3. Enforces category score thresholds as CI gates:
 *       - Performance  ≥ 0.96 on home / tickets / ticket-detail
 *       - Performance  ≥ 0.90 on dashboard (heavier Recharts page)
 *       - Accessibility / Best-Practices / SEO ≥ 0.95 on every page
 *  4. Emits warn-level resource budgets (R1): first-party JS ≤ 150 KB
 *     (gzip), images ≤ 500 KB, total requests ≤ 30.
 *  5. Persists JSON + HTML reports to .lighthouse/ci as CI artifacts.
 *
 * Red-line refs: R1 (Performance), R9 (CI must use @lhci/cli).
 */
module.exports = {
  ci: {
    collect: {
      // Use a dedicated port so lhci does not collide with dev servers.
      url: [
        'http://127.0.0.1:3210/zh',
        'http://127.0.0.1:3210/zh/tickets',
        'http://127.0.0.1:3210/zh/tickets/TK-00001',
        'http://127.0.0.1:3210/zh/dashboard',
      ],
      numberOfRuns: 3,
      // Fixed throttling reduces run-to-run variance on CI hardware.
      settings: {
        formFactor: 'desktop',
        screenEmulation: { disabled: true },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        chromeFlags: '--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
      },
      // Start the already-built web-app production server from the monorepo
      // root. `pnpm --filter ... exec` runs `next start` in the web-app
      // directory without a `--` separator (which pnpm would otherwise
      // forward literally to next-start and make it parse "-p" as a dir).
      // CI/locally must run `pnpm build` first; lhci only starts the server.
      startServerCommand: 'pnpm --filter @team-portal/web-app exec next start -p 3210 -H 127.0.0.1',
      startServerReadyPattern: 'Ready|started server|Local:|compiled',
      startServerReadyTimeout: 90000,
    },
    assert: {
      // NOTE: @lhci/cli forbids combining top-level `assertions` with
      // `assertMatrix`, so every assertion is declared inside the matrix.
      // The first entry (matchingUrlPattern: '.*') applies to every URL;
      // later entries override the performance threshold for the dashboard.
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            // Category score floors (R1 / D28-S09 gate).
            'categories:performance': ['error', { minScore: 0.96 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            'categories:seo': ['error', { minScore: 0.95 }],
            // Core Web Vitals (R1) — warn so a regression is visible but
            // a single metric jitter does not hard-fail the gate.
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
            'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
            'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
            'total-blocking-time': ['warn', { maxNumericValue: 300 }],
            // Resource budgets (R1) via LHCI's resource-summary special
            // assertions. Sizes are in bytes (transfer size), counts are
            // request counts. Warn level per spec.
            'resource-summary:script:size': ['warn', { maxNumericValue: 153600 }], // 150 KiB
            'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // 500 KiB
            'resource-summary:total:count': ['warn', { maxNumericValue: 30 }],
          },
        },
        {
          // Dashboard ships Recharts; it is held to ≥ 0.90 (R1) rather than
          // the 0.96 required of the three lighter pages.
          matchingUrlPattern: '.*/dashboard',
          assertions: {
            'categories:performance': ['error', { minScore: 0.9 }],
          },
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouse/ci',
      // Replace previous local/CI reports to keep the artifact directory
      // clean and represent the most recent run only.
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
};
