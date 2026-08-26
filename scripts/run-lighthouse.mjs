import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.LH_BASE_URL || 'http://localhost:3210';

// Locate a Chromium-based browser (Edge on Windows, Chrome elsewhere)
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' && existsSync(EDGE_PATH) ? EDGE_PATH : undefined);

const PAGES = [
  { name: 'home', path: '/zh' },
  { name: 'tickets', path: '/zh/tickets' },
  { name: 'ticket-detail', path: '/zh/tickets/TK-00001' },
  { name: 'dashboard', path: '/zh/dashboard' },
];

const COMMON_FLAGS = {
  output: ['json', 'html'],
  formFactor: 'desktop',
  screenEmulation: { disabled: true },
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1,
  },
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};

async function runAudit(chrome, page) {
  const url = `${BASE_URL}${page.path}`;
  console.log(`\n[Lighthouse] Auditing: ${url}`);
  const flags = { ...COMMON_FLAGS, port: chrome.port };
  const result = await lighthouse(url, flags);
  return result;
}

function extractScores(lhr) {
  const cats = lhr.categories;
  const a = lhr.audits;
  return {
    performance: Math.round((cats.performance?.score ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
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
  const label = process.argv[2] || 'baseline';
  const outDir = resolve(__dirname, '..', '.lighthouse', label);
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
      const result = await runAudit(chrome, page);
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
