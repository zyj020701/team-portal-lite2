const fs = require('fs');
const path = require('path');

const files = ['lh-home', 'lh-tickets', 'lh-ticket-detail', 'lh-dashboard'];
const pages = {
  'lh-home': 'Home (/)',
  'lh-tickets': 'Ticket List (/tickets)',
  'lh-ticket-detail': 'Ticket Detail (/tickets/[id])',
  'lh-dashboard': 'Dashboard (/dashboard)',
};
const cats = ['performance', 'accessibility', 'best-practices', 'seo'];
const audits = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'interactive',
];

const results = [];
for (const f of files) {
  const filePath = path.join(__dirname, '..', 'docs', 'reports', f + '.json');
  if (!fs.existsSync(filePath)) {
    console.log('MISSING: ' + filePath);
    continue;
  }
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const row = { page: pages[f], scores: {}, metrics: {}, opportunities: [] };
  for (const c of cats) {
    row.scores[c] = d.categories[c] ? Math.round(d.categories[c].score * 100) : 'N/A';
  }
  for (const a of audits) {
    const v = d.audits[a];
    row.metrics[a] = v ? v.displayValue || String(Math.round(v.numericValue || 0)) : 'N/A';
  }
  for (const [id, audit] of Object.entries(d.audits)) {
    if (
      audit.score !== null &&
      audit.score !== undefined &&
      audit.score < 0.9 &&
      audit.scoreDisplayMode !== 'notApplicable' &&
      audit.scoreDisplayMode !== 'informative'
    ) {
      row.opportunities.push({
        id,
        title: audit.title,
        score: audit.score,
        displayValue: audit.displayValue || '',
      });
    }
  }
  results.push(row);
}

console.log('\n=== SCORES ===');
console.log('| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI | TTI |');
console.log('|------|------|------|----|----|-----|-----|-----|-----|----|-----|');
for (const r of results) {
  console.log(
    '| ' +
      r.page +
      ' | ' +
      r.scores.performance +
      ' | ' +
      r.scores.accessibility +
      ' | ' +
      r.scores['best-practices'] +
      ' | ' +
      r.scores.seo +
      ' | ' +
      r.metrics['first-contentful-paint'] +
      ' | ' +
      r.metrics['largest-contentful-paint'] +
      ' | ' +
      r.metrics['total-blocking-time'] +
      ' | ' +
      r.metrics['cumulative-layout-shift'] +
      ' | ' +
      r.metrics['speed-index'] +
      ' | ' +
      r.metrics['interactive'] +
      ' |',
  );
}

console.log('\n=== OPPORTUNITIES (score < 0.9) ===');
for (const r of results) {
  console.log('\n--- ' + r.page + ' ---');
  for (const o of r.opportunities.sort((a, b) => a.score - b.score)) {
    console.log(
      '  [' +
        Math.round(o.score * 100) +
        '] ' +
        o.title +
        (o.displayValue ? ' (' + o.displayValue + ')' : '') +
        ' <' +
        o.id +
        '>',
    );
  }
}
