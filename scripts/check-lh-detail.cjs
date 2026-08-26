const fs = require('fs');
const d = JSON.parse(fs.readFileSync('docs/reports/lh-ticket-detail.json', 'utf8'));
console.log('runtimeError:', JSON.stringify(d.runtimeError));
console.log('runWarnings:', JSON.stringify(d.runWarnings));
if (d.categories) {
  for (const k of Object.keys(d.categories)) {
    console.log('category', k, d.categories[k].score);
  }
}
console.log('audits keys sample:', Object.keys(d.audits || {}).slice(0, 10));
console.log('finalUrl:', d.finalUrl);
console.log('requestedUrl:', d.requestedUrl);
