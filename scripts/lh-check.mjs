#!/usr/bin/env node
/**
 * Ad-hoc Lighthouse check against an already-running server (default :3000).
 * Desktop throttling (matches lighthouserc.js), 3 runs, median reported.
 * Usage: node scripts/lh-check.mjs [port] [label]
 */
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = Number(process.argv[2] || 3000);
const LABEL = process.argv[3] || 'check';
// Pass 'mobile' as the 4th arg to emulate Lighthouse's default mobile preset
// (4x CPU slowdown, slow 4G throttling, mobile viewport). Default = desktop.
const MOBILE = process.argv[4] === 'mobile';

const PAGES = [
  { name: 'home', path: '/zh' },
  { name: 'tickets', path: '/zh/tickets' },
  { name: 'ticket-detail', path: '/zh/tickets/TK-00001' },
  { name: 'dashboard', path: '/zh/dashboard' },
];

const SETTINGS = MOBILE
  ? {
      output: ['json', 'html'],
      formFactor: 'mobile',
      // Lighthouse mobile default: simulated throttling, 4x CPU, ~1.6 Mbps.
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 150,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 675,
      },
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      quiet: true,
    }
  : {
      output: ['json', 'html'],
      formFactor: 'desktop',
      screenEmulation: { disabled: true },
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      quiet: true,
    };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function scores(lhr) {
  const c = lhr.categories;
  const a = lhr.audits;
  return {
    perf: Math.round((c.performance?.score ?? 0) * 100),
    a11y: Math.round((c.accessibility?.score ?? 0) * 100),
    bp: Math.round((c['best-practices']?.score ?? 0) * 100),
    seo: Math.round((c.seo?.score ?? 0) * 100),
    fcp: a['first-contentful-paint']?.numericValue ?? 0,
    lcp: a['largest-contentful-paint']?.numericValue ?? 0,
    tbt: a['total-blocking-time']?.numericValue ?? 0,
    cls: a['cumulative-layout-shift']?.numericValue ?? 0,
    si: a['speed-index']?.numericValue ?? 0,
    lhr,
  };
}

function pickMedian(runs) {
  const sorted = [...runs].sort((a, b) => a.perf - b.perf);
  return sorted[Math.floor(sorted.length / 2)];
}

async function main() {
  const outDir = resolve(ROOT, '.lighthouse', LABEL);
  mkdirSync(outDir, { recursive: true });
  const fs = await import('node:fs');
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  // Prefer Playwright-bundled Chromium if present.
  const pwRoot = resolve(process.env.LOCALAPPDATA || '', 'ms-playwright');
  try {
    for (const d of fs.readdirSync(pwRoot)) {
      if (d.startsWith('chromium-')) {
        const exe = resolve(pwRoot, d, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(exe)) candidates.unshift(exe);
      }
    }
  } catch { /* no playwright chromium */ }
  const chromePath = candidates.find((p) => p && fs.existsSync(p));
  console.log('Using Chrome:', chromePath);
  const chrome = await launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const summary = {};
  try {
    for (const page of PAGES) {
      const url = `http://127.0.0.1:${PORT}${page.path}`;
      const runs = [];
      for (let i = 0; i < 3; i++) {
        const { lhr, report } = await lighthouse(url, { ...SETTINGS, port: chrome.port });
        const s = scores(lhr);
        runs.push(s);
        console.log(
          `[${page.name}] run${i + 1} Perf=${s.perf} FCP=${s.fcp.toFixed(2)}s LCP=${s.lcp.toFixed(2)}s TBT=${s.tbt.toFixed(0)}ms CLS=${s.cls.toFixed(3)}`,
        );
        if (i === 0) {
          writeFileSync(resolve(outDir, `${page.name}.json`), report[0]);
          writeFileSync(resolve(outDir, `${page.name}.html`), report[1]);
        }
        await sleep(500);
      }
      const med = pickMedian(runs);
      summary[page.name] = med;
      console.log(
        `  => MEDIAN ${page.name}: Perf=${med.perf} A11y=${med.a11y} BP=${med.bp} SEO=${med.seo} | FCP=${med.fcp.toFixed(2)}s LCP=${med.lcp.toFixed(2)}s TBT=${med.tbt.toFixed(0)}ms CLS=${med.cls.toFixed(3)} SI=${med.si.toFixed(2)}s`,
      );
    }
  } finally {
    await chrome.kill();
  }
  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(
    Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, { perf: v.perf, a11y: v.a11y, bp: v.bp, seo: v.seo, fcp: +v.fcp.toFixed(2), lcp: +v.lcp.toFixed(2), tbt: +v.tbt.toFixed(0), cls: +v.cls.toFixed(3) }])), null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
