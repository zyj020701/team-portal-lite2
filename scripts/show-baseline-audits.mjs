import fs from 'node:fs';
import path from 'node:path';

const dir = '.lighthouse/baseline';
const pages = ['home', 'tickets', 'ticket-detail', 'dashboard'];

for (const p of pages) {
  const file = path.join(dir, `${p}.json`);
  if (!fs.existsSync(file)) {
    console.log(`\n=== ${p} === FILE NOT FOUND`);
    continue;
  }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const c = d.categories;
  console.log(`\n=== ${p} ===`);
  console.log(
    `Perf=${Math.round((c.performance?.score ?? 0) * 100)} A11y=${Math.round((c.accessibility?.score ?? 0) * 100)} BP=${Math.round((c['best-practices']?.score ?? 0) * 100)} SEO=${Math.round((c.seo?.score ?? 0) * 100)}`,
  );
  const a = d.audits;
  for (const [k, v] of Object.entries(a)) {
    if (
      v.score !== null &&
      v.score < 1 &&
      v.scoreDisplayMode !== 'informative' &&
      v.scoreDisplayMode !== 'notApplicable' &&
      v.scoreDisplayMode !== 'manual'
    ) {
      console.log(`  [${Math.round(v.score * 100)}] ${k}: ${v.title}`);
      if (v.details && v.details.items) {
        for (const it of v.details.items.slice(0, 5)) {
          const n = it.node ? it.node.snippet || it.node.selector || '' : '';
          const u = it.url ? ` url=${it.url}` : '';
          console.log(`    - ${n}${u}`);
        }
      }
    }
  }
}
