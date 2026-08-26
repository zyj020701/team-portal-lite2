/**
 * Measure real INP via Playwright + web-vitals (field-style interaction metric).
 * Lighthouse navigation mode does not report INP, so we drive real interactions
 * (click / select / input / scroll) and collect the worst event duration from a
 * PerformanceObserver of type "event".
 *
 * Usage: node scripts/measure-inp.mjs [baseUrl]
 * Writes docs/screenshots/inp-results.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Resolve playwright-core from the pnpm store.
const require = createRequire(import.meta.url);
const pwCorePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.js',
);
const { chromium } = require(pwCorePath);

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });
const baseUrl = process.argv[2] || 'http://localhost:3000';

const INIT = `(() => {
  window.__inpWorst = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > window.__inpWorst) window.__inpWorst = e.duration;
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (e) {}
})();`;

async function measure(path, label, interactions) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1350, height: 940 } });
  await page.addInitScript({ content: INIT });
  await page.goto(baseUrl.replace(/\/$/, '') + path, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  await interactions(page);
  await page.waitForTimeout(800);
  const inpMs = Math.round(await page.evaluate(() => window.__inpWorst || 0));
  await browser.close();
  return {
    path,
    label,
    inpMs,
    rating: inpMs <= 200 ? 'good' : inpMs <= 500 ? 'needs-improvement' : 'poor',
  };
}

async function main() {
  const results = [];
  results.push(
    await measure('/zh/tickets', '工单列表 Tickets', async (page) => {
      for (const name of [/待处理|pending/i, /处理中|in_progress/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible().catch(() => false)) {
          await b.click();
          await page.waitForTimeout(150);
        }
      }
      const search = page.getByLabel('搜索工单');
      if (await search.isVisible().catch(() => false)) {
        await search.click();
        await search.fill('登录');
        await page.waitForTimeout(250);
      }
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(200);
    }),
  );
  results.push(
    await measure('/zh/dashboard', 'Dashboard', async (page) => {
      await page.getByRole('heading', { name: '数据概览' }).waitFor().catch(() => {});
      const refresh = page.getByRole('button', { name: '刷新' });
      if (await refresh.isVisible().catch(() => false)) {
        await refresh.click();
        await page.waitForTimeout(350);
      }
      const card = page.getByRole('link', { name: /待处理工单/ }).first();
      if (await card.isVisible().catch(() => false)) await card.click();
    }),
  );
  results.push(
    await measure('/zh/tickets/TK-00001', '工单详情 Detail', async (page) => {
      await page.waitForTimeout(400);
      // Status transition / action buttons on the detail page.
      const action = page.getByRole('button', { name: /处理中|已解决|重新打开|开始处理/ }).first();
      if (await action.isVisible().catch(() => false)) {
        await action.click();
        await page.waitForTimeout(250);
      }
      // Tab switching (备注 / 时间线)
      const tab = page.getByRole('tab', { name: /备注|时间线|活动/ }).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(200);
      }
    }),
  );
  results.push(
    await measure('/zh', '首页 Home', async (page) => {
      // Language switcher and primary CTA.
      const lang = page.getByRole('button', { name: /中文|English|语言/ }).first();
      if (await lang.isVisible().catch(() => false)) {
        await lang.click();
        await page.waitForTimeout(200);
      }
      const cta = page.getByRole('link', { name: /进入工作台|开始使用|工单|dashboard/i }).first();
      if (await cta.isVisible().catch(() => false)) await cta.click();
    }),
  );

  writeFileSync(resolve(outDir, 'inp-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  const pass = results.every((r) => r.inpMs <= 200);
  console.log(`\nINP ${pass ? 'PASS ✅' : 'FAIL ❌'} (threshold 200ms)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
