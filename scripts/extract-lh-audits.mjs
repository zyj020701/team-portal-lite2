import fs from 'fs';

const pages = ['home', 'tickets', 'ticket-detail', 'dashboard'];

for (const page of pages) {
  try {
    const data = JSON.parse(fs.readFileSync(`docs/reports/lh-${page}.json`, 'utf8'));
    console.log(`\n=== ${page} ===`);
    const cats = data.categories;
    console.log(
      `Perf=${Math.round(cats.performance.score * 100)} A11y=${Math.round(cats.accessibility.score * 100)} BP=${Math.round(cats['best-practices'].score * 100)} SEO=${Math.round(cats.seo.score * 100)}`,
    );

    const audits = data.audits;
    for (const [key, audit] of Object.entries(audits)) {
      if (
        audit.score !== null &&
        audit.score < 1 &&
        audit.scoreDisplayMode !== 'informative' &&
        audit.scoreDisplayMode !== 'notApplicable'
      ) {
        console.log(`  [${Math.round(audit.score * 100)}] ${key}: ${audit.title}`);
        if (audit.details && audit.details.items && audit.details.items.length > 0) {
          for (const item of audit.details.items.slice(0, 3)) {
            const node = item.node ? item.node.snippet || item.node.selector : '';
            const url = item.url ? ` url=${item.url}` : '';
            console.log(`    - ${node}${url}`);
          }
        }
      }
    }
  } catch (e) {
    console.log(`\n=== ${page} === ERROR: ${e.message}`);
  }
}
