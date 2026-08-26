import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const dir = resolve(ROOT, '.lighthouse/baseline');

const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'summary.json');
for (const f of files) {
  try {
    const j = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
    const c = j.categories,
      a = j.audits;
    const name = f.replace('.json', '');
    console.log(`\n=== ${name} ===`);
    console.log(
      `Perf=${Math.round((c.performance?.score ?? 0) * 100)} A11y=${Math.round((c.accessibility?.score ?? 0) * 100)} BP=${Math.round((c['best-practices']?.score ?? 0) * 100)} SEO=${Math.round((c.seo?.score ?? 0) * 100)}`,
    );
    console.log(
      `FCP=${a['first-contentful-paint']?.displayValue ?? '?'} LCP=${a['largest-contentful-paint']?.displayValue ?? '?'} TBT=${a['total-blocking-time']?.displayValue ?? '?'} CLS=${a['cumulative-layout-shift']?.displayValue ?? '?'} SI=${a['speed-index']?.displayValue ?? '?'}`,
    );
    const failed = [];
    for (const [key, audit] of Object.entries(a)) {
      if (
        audit.score !== null &&
        audit.score !== undefined &&
        audit.score < 0.9 &&
        audit.scoreDisplayMode !== 'informative' &&
        audit.scoreDisplayMode !== 'notApplicable' &&
        audit.scoreDisplayMode !== 'manual'
      ) {
        failed.push(
          `  [${audit.score}] ${key}: ${audit.title}${audit.displayValue ? ' (' + audit.displayValue + ')' : ''}`,
        );
      }
    }
    if (failed.length) {
      console.log('Failed audits:');
      console.log(failed.join('\n'));
    }
  } catch (e) {
    console.log(`${f}: ERROR ${e.message}`);
  }
}
