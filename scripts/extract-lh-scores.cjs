const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || '.lighthouse/baseline';
const pages = ['home', 'tickets', 'ticket-detail', 'dashboard'];

const results = {};
for (const p of pages) {
  const file = path.join(dir, `${p}.json`);
  if (!fs.existsSync(file)) {
    console.log(`${p}: MISSING`);
    continue;
  }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const c = d.categories;
  const a = d.audits;
  results[p] = {
    performance: Math.round((c.performance?.score ?? 0) * 100),
    accessibility: Math.round((c.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((c['best-practices']?.score ?? 0) * 100),
    seo: Math.round((c.seo?.score ?? 0) * 100),
    FCP: a['first-contentful-paint']?.displayValue ?? 'N/A',
    LCP: a['largest-contentful-paint']?.displayValue ?? 'N/A',
    TBT: a['total-blocking-time']?.displayValue ?? 'N/A',
    CLS: a['cumulative-layout-shift']?.displayValue ?? 'N/A',
    SI: a['speed-index']?.displayValue ?? 'N/A',
  };

  // Collect failed audits
  const failed = [];
  for (const [key, audit] of Object.entries(a)) {
    if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative') {
      failed.push({
        id: key,
        title: audit.title,
        score: audit.score,
        displayValue: audit.displayValue || '',
      });
    }
  }
  results[p].failedAudits = failed;
}

console.log(JSON.stringify(results, null, 2));
