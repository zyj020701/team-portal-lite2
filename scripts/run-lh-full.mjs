#!/usr/bin/env node
/**
 * Full Lighthouse runner (self-contained).
 * Usage: node scripts/run-lh-full.mjs <outDir> <label>
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const outDirArg = process.argv[2] || '.lighthouse';
const label = process.argv[3] || 'baseline';
const PORT = process.env.LH_PORT || '3100';
const HOST = process.env.LH_HOST || '127.0.0.1';
const ORIGIN = `http://${HOST}:${PORT}`;
const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const CHROME_PATH = process.env.CHROME_PATH || EDGE_PATHS.find((p) => existsSync(p)) || '';

const PAGES = [
  { name: 'home', path: '/zh' },
  { name: 'tickets', path: '/zh/tickets' },
  { name: 'ticket-detail', path: '/zh/tickets/TK-00001' },
  { name: 'dashboard', path: '/zh/dashboard' },
];

function extractScores(lhr) {
  const c = lhr.categories;
  const a = lhr.audits;
  return {
    performance: Math.round((c.performance?.score ?? 0) * 100),
    accessibility: Math.round((c.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((c['best-practices']?.score ?? 0) * 100),
    seo: Math.round((c.seo?.score ?? 0) * 100),
    metrics: {
      FCP: a['first-contentful-paint']?.displayValue ?? 'N/A',
      LCP: a['largest-contentful-paint']?.displayValue ?? 'N/A',
      TBT: a['total-blocking-time']?.displayValue ?? 'N/A',
      CLS: a['cumulative-layout-shift']?.displayValue ?? 'N/A',
      SI: a['speed-index']?.displayValue ?? 'N/A',
    },
  };
}

async function main() {
  const outDir = resolve(ROOT, outDirArg, label);
  mkdirSync(outDir, { recursive: true });

  const launchOpts = {
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  };
  if (CHROME_PATH) {
    launchOpts.chromePath = CHROME_PATH;
    console.log(`[Lighthouse] Using browser: ${CHROME_PATH}`);
  }
  const chrome = await launch(launchOpts);

  const summary = {};
  try {
    for (const page of PAGES) {
      const url = `${ORIGIN}${page.path}`;
      console.log(`[Lighthouse] Auditing ${page.name}: ${url}`);
      const result = await lighthouse(
        url,
        {
          port: chrome.port,
          output: ['json', 'html'],
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          formFactor: 'desktop',
          screenEmulation: { disabled: true },
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
          },
        },
        undefined,
      );
      const { report, lhr } = result;

      writeFileSync(resolve(outDir, `${page.name}.json`), report[0]);
      writeFileSync(resolve(outDir, `${page.name}.html`), report[1]);

      summary[page.name] = extractScores(lhr);
      console.log(
        `  ✓ ${page.name}: Perf=${summary[page.name].performance} A11y=${summary[page.name].accessibility} BP=${summary[page.name].bestPractices} SEO=${summary[page.name].seo}`,
      );
    }
  } finally {
    await chrome.kill();
  }

  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n[Lighthouse] Reports saved to: ${outDir}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
