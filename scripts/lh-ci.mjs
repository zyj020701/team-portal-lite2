#!/usr/bin/env node
/**
 * Lighthouse CI orchestrator for D28-S03.
 * Starts prod server, runs Lighthouse (3 runs, median) on 4 core pages,
 * writes JSON+HTML reports + summary, tears down server.
 * Usage: node scripts/lh-ci.mjs [baseline|final]
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WEB_APP = resolve(ROOT, 'apps', 'web-app');
const PORT = Number(process.env.LH_PORT || 3210);
const BASE_URL = `http://localhost:${PORT}`;
const LABEL = process.argv[2] || 'baseline';
const OUT_DIR = resolve(ROOT, '.lighthouse', LABEL);
const RUNS = Number(process.env.LH_RUNS || 3);

const PAGES = [
  { name: 'home', path: '/zh' },
  { name: 'tickets', path: '/zh/tickets' },
  { name: 'ticket-detail', path: '/zh/tickets/TK-00001' },
  { name: 'dashboard', path: '/zh/dashboard' },
];

const FLAGS = {
  output: ['json', 'html'],
  formFactor: 'desktop',
  screenEmulation: { disabled: true },
  throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  quiet: true,
};

const log = (m) => console.log(`[lh-ci] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.status < 500) return true;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  return false;
}

function startServer() {
  log(`Starting production server on port ${PORT}...`);
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(cmd, ['start'], {
    cwd: WEB_APP,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell: isWin,
  });
  child.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  return child;
}

function stopServer(child) {
  if (!child) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    /* ignore */
  }
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
      TTI: a['interactive']?.displayValue ?? 'N/A',
    },
  };
}

function medianRun(runs) {
  const perf = runs.map((r) => r.performance);
  const sorted = [...perf].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const target = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  let best = runs[0],
    bestDiff = Infinity;
  for (const r of runs) {
    const diff = Math.abs(r.performance - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = r;
    }
  }
  return best;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const f of readdirSync(OUT_DIR)) {
    rmSync(resolve(OUT_DIR, f), { recursive: true, force: true });
  }

  const server = startServer();
  let exitCode = 0;
  try {
    if (!(await waitForServer(`${BASE_URL}/zh`))) {
      throw new Error('Production server did not become ready within 90s');
    }
    log('Server is ready.');

    const chrome = await launch({
      chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const summary = {};
    try {
      for (const page of PAGES) {
        const runs = [];
        for (let i = 0; i < RUNS; i++) {
          log(`  [${page.name}] run ${i + 1}/${RUNS}`);
          const result = await lighthouse(`${BASE_URL}${page.path}`, {
            ...FLAGS,
            port: chrome.port,
          });
          const { report, lhr } = result;
          const scores = extractScores(lhr);
          runs.push({ scores, report });
          log(
            `    Perf=${scores.performance} A11y=${scores.accessibility} BP=${scores.bestPractices} SEO=${scores.seo} FCP=${scores.metrics.FCP} LCP=${scores.metrics.LCP} TBT=${scores.metrics.TBT} CLS=${scores.metrics.CLS}`,
          );
        }
        const median = medianRun(runs.map((r) => r.scores));
        const match = runs.find((r) => r.scores === median) || runs[0];
        writeFileSync(resolve(OUT_DIR, `${page.name}.json`), match.report[0]);
        writeFileSync(resolve(OUT_DIR, `${page.name}.html`), match.report[1]);
        summary[page.name] = median;
      }
    } finally {
      await chrome.kill();
    }

    writeFileSync(resolve(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
    log(`Reports saved to: ${OUT_DIR}`);
    console.log(JSON.stringify(summary, null, 2));

    const targets = {
      home: { perf: 96, a11y: 95, bp: 95, seo: 95 },
      tickets: { perf: 96, a11y: 95, bp: 95, seo: 95 },
      'ticket-detail': { perf: 96, a11y: 95, bp: 95, seo: 95 },
      dashboard: { perf: 90, a11y: 95, bp: 95, seo: 95 },
    };
    let failed = false;
    for (const [name, s] of Object.entries(summary)) {
      const t = targets[name];
      for (const [k, v, target] of [
        ['performance', s.performance, t.perf],
        ['accessibility', s.accessibility, t.a11y],
        ['bestPractices', s.bestPractices, t.bp],
        ['seo', s.seo, t.seo],
      ]) {
        if (v < target) {
          log(`FAIL ${name}.${k}=${v} < ${target}`);
          failed = true;
        }
      }
    }
    exitCode = failed ? 2 : 0;
    log(failed ? 'Threshold check FAILED.' : 'Threshold check PASSED.');
  } catch (err) {
    console.error('[lh-ci] ERROR:', err);
    exitCode = 1;
  } finally {
    stopServer(server);
    await sleep(1500);
  }
  process.exit(exitCode);
}

main();
