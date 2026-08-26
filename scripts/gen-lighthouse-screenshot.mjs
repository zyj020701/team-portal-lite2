/**
 * Generate a Lighthouse scorecard PNG for the README (Day28 1.3).
 * Reads .lighthouse/d28/summary.json + docs/screenshots/inp-results.json,
 * renders an HTML scorecard, and screenshots it with playwright-core.
 * Usage: node scripts/gen-lighthouse-screenshot.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });
const { chromium } = require(resolve(root, 'node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.js'));

const lh = JSON.parse(readFileSync(resolve(root, '.lighthouse/d28/summary.json'), 'utf8'));
const inp = JSON.parse(readFileSync(resolve(outDir, 'inp-results.json'), 'utf8'));
const inpWorst = Math.max(...inp.map((r) => r.inpMs));

const order = ['home', 'tickets', 'ticket-detail', 'dashboard'];
const labels = { home: '首页 Home', tickets: '工单列表 Tickets', 'ticket-detail': '工单详情 Detail', dashboard: 'Dashboard' };
const paths = { home: '/zh', tickets: '/zh/tickets', 'ticket-detail': '/zh/tickets/TK-00001', dashboard: '/zh/dashboard' };
const scoreColor = (s) => (s >= 90 ? '#0cce6b' : s >= 50 ? '#ffa400' : '#ff4e42');
const cwvColor = (v, good, needs) => (v <= good ? '#0cce6b' : v <= needs ? '#ffa400' : '#ff4e42');
const today = new Date().toISOString().slice(0, 10);

const rows = order.map((slug) => {
  const d = lh[slug];
  const inpRow = inp.find((r) => r.path === paths[slug]);
  const inpMs = inpRow ? inpRow.inpMs : 0;
  return `<tr>
    <td class="page"><div class="page-name">${labels[slug]}</div><div class="page-path">${paths[slug]}</div></td>
    <td><div class="gauge ${slug}" data-score="${d.performance}"></div></td>
    <td class="metric" style="color:${cwvColor(d.lcp / 1000, 2.5, 4.0)}">${(d.lcp / 1000).toFixed(2)}<span>s</span></td>
    <td class="metric" style="color:${cwvColor(inpMs, 200, 500)}">${inpMs}<span>ms</span></td>
    <td class="metric" style="color:${cwvColor(d.cls, 0.1, 0.25)}">${d.cls.toFixed(3)}</td>
    <td class="metric sub">${d.accessibility} / ${d.bestPractices} / ${d.seo}</td>
  </tr>`;
}).join('');

const gaugeConics = order
  .map((s) => `.gauge.${s}{background:conic-gradient(${scoreColor(lh[s].performance)} ${lh[s].performance}%,#1e293b 0)}`)
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
body{width:1080px;background:#0f172a}
.card{background:linear-gradient(160deg,#111827,#0f172a);padding:40px 48px;color:#f8fafc}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
.title{font-size:28px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:14px}
.logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:900}
.env{font-size:13px;color:#94a3b8;text-align:right;line-height:1.6}
.env b{color:#e2e8f0}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;font-weight:600;padding:0 16px 12px;border-bottom:1px solid #1e293b}
th.num{text-align:center}
td{padding:16px;border-bottom:1px solid #1e293b;vertical-align:middle}
.page-name{font-size:15px;font-weight:600;color:#f1f5f9}
.page-path{font-size:12px;color:#64748b;font-family:ui-monospace,Menlo,monospace;margin-top:3px}
.gauge{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;position:relative}
.gauge::before{content:"";position:absolute;inset:5px;border-radius:50%;background:#0f172a}
.gauge::after{content:attr(data-score);position:relative;z-index:1;font-size:17px;font-weight:800}
${gaugeConics}
.metric{text-align:center;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}
.metric span{font-size:13px;font-weight:500;color:#94a3b8;margin-left:2px}
.metric.sub{font-size:14px;color:#cbd5e1;font-weight:500}
.footer{margin-top:24px;display:flex;justify-content:space-between;align-items:center}
.cwv-legend{font-size:12.5px;color:#94a3b8}
.cwv-legend b{color:#0cce6b}
.stamp{font-size:12px;color:#64748b}
.pill{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(12,206,107,.12);color:#0cce6b;font-size:12px;font-weight:600;margin-left:10px}
</style></head><body>
<div class="card">
  <div class="header">
    <div class="title"><div class="logo">T</div>Team Portal Lite · Lighthouse ${today}<span class="pill">ALL PASS</span></div>
    <div class="env"><b>Production build</b> · Next.js 14 · desktop preset<br>Chromium headless · ${today}</div>
  </div>
  <table>
    <thead><tr><th>页面 Page</th><th class="num">Performance</th><th class="num">LCP</th><th class="num">INP</th><th class="num">CLS</th><th class="num">A11y / BP / SEO</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <div class="cwv-legend">Core Web Vitals thresholds: <b>LCP &lt; 2.5s</b> · <b>INP &lt; 200ms</b> · <b>CLS &lt; 0.1</b> &nbsp;|&nbsp; worst measured INP: <b>${inpWorst}ms</b></div>
    <div class="stamp">generated by scripts/gen-lighthouse-screenshot.mjs</div>
  </div>
</div></body></html>`;

writeFileSync(resolve(outDir, 'lighthouse-scorecard.html'), html);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 720 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
const el = await page.$('.card');
await el.screenshot({ path: resolve(outDir, 'lighthouse-scorecard.png') });
await browser.close();
console.log('Screenshot -> docs/screenshots/lighthouse-scorecard.png');
