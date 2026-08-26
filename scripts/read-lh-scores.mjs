import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const files = ['lh-home', 'lh-tickets', 'lh-ticket-detail', 'lh-dashboard'];
for (const f of files) {
  try {
    const d = JSON.parse(readFileSync(resolve(ROOT, 'docs/reports', f + '.json'), 'utf8'));
    const c = d.categories;
    const a = d.audits;
    const perf = Math.round((c.performance?.score ?? 0) * 100);
    const a11y = Math.round((c.accessibility?.score ?? 0) * 100);
    const bp = Math.round((c['best-practices']?.score ?? 0) * 100);
    const seo = Math.round((c.seo?.score ?? 0) * 100);
    console.log(`${f}: Perf=${perf} A11y=${a11y} BP=${bp} SEO=${seo}`);
    console.log(
      `  FCP=${a['first-contentful-paint']?.displayValue ?? '?'} LCP=${a['largest-contentful-paint']?.displayValue ?? '?'} TBT=${a['total-blocking-time']?.displayValue ?? '?'} CLS=${a['cumulative-layout-shift']?.displayValue ?? '?'}`,
    );
    const failed = [];
    for (const [key, audit] of Object.entries(a)) {
      if (
        audit.score !== null &&
        audit.score < 0.9 &&
        audit.scoreDisplayMode !== 'informative' &&
        audit.scoreDisplayMode !== 'notApplicable'
      ) {
        failed.push(`  [${audit.score}] ${key}: ${audit.title}`);
      }
    }
    if (failed.length) {
      console.log('  Failed audits:');
      console.log(failed.join('\n'));
    }
  } catch (e) {
    console.log(`${f}: ERROR ${e.message}`);
  }
}
