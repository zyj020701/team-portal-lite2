const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'apps', 'web-app', 'messages');
const files = ['zh', 'en', 'ja', 'ko', 'zh-TW'];
const keys = (f) => {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f + '.json'), 'utf8'));
  const walk = (o, p) =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' ? walk(v, p + k + '.') : [p + k],
    );
  return new Set(walk(j, ''));
};
const base = keys('zh');
let ok = true;
files.forEach((f) => {
  const k = keys(f);
  const missing = [...base].filter((x) => !k.has(x));
  const extra = [...k].filter((x) => !base.has(x));
  console.log(`${f}: missing=${missing.length} extra=${extra.length}`);
  if (missing.length) {
    ok = false;
    console.log('  MISSING:', missing.join(', '));
  }
  if (extra.length) {
    ok = false;
    console.log('  EXTRA:', extra.join(', '));
  }
});
console.log(ok ? 'ALL CONSISTENT' : 'INCONSISTENT');
process.exit(ok ? 0 : 1);
