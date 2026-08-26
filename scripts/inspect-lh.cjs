const r = require('../.lighthouse/mobile/tickets.json');
const a = r.audits;
const keys = Object.keys(a).filter(k => /lcp|largest|element|font|render|paint|critical/i.test(k));
console.log('=== matching audit keys ===');
for (const k of keys) {
  const v = a[k];
  console.log(k, '| score', v.score, '|', v.displayValue || v.title || '');
}
function dump(name) {
  const v = a[name];
  if (!v) return console.log('(none)', name);
  console.log('\n###', name, '| score', v.score);
  console.log(JSON.stringify(v.details, null, 1).slice(0, 2500));
}
['lcp-breakdown-insight','lcp-discovery-insight','render-blocking-insight'].forEach(dump);


